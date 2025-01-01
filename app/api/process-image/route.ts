import { NextRequest, NextResponse } from "next/server";
import { Anthropic } from "@anthropic-ai/sdk";
import sharp from 'sharp';
import { Buffer } from 'buffer';

async function compressImage(base64Data: string): Promise<string> {
	try {
		const buffer = Buffer.from(base64Data, 'base64');
		
		const compressedBuffer = await sharp(buffer)
			.resize(800, 800, { // Resize to max 800x800 while maintaining aspect ratio
				fit: 'inside',
				withoutEnlargement: true
			})
			.jpeg({ quality: 80 }) // Convert to JPEG with 80% quality
			.toBuffer();

		return compressedBuffer.toString('base64');
	} catch (error) {
		console.error('Error compressing image:', error);
		throw error;
	}
}

export async function POST(request: NextRequest) {
	const apiKey = process.env.ANTHROPIC_API_KEY;
	if (!apiKey) {
		console.error("ANTHROPIC_API_KEY is not set");
		return NextResponse.json(
			{ error: "ANTHROPIC_API_KEY environment variable is not set" },
			{ status: 500 },
		);
	}

	const anthropic = new Anthropic({
		apiKey,
	});

	try {
		const { imageData } = await request.json();

		if (!imageData) {
			console.error("No image data provided");
			return NextResponse.json(
				{ error: "No image data provided" },
				{ status: 400 },
			);
		}

        console.log(imageData.slice(0,20));
		// Ensure the imageData is in the correct format
		const base64Data = imageData.startsWith("data:image")
			? imageData.split(",")[1]
			: imageData;

		if (!isValidBase64(base64Data)) {
			console.error("Invalid base64 image data");
			return NextResponse.json(
				{ error: "Invalid base64 image data" },
				{ status: 400 },
			);
		}

		console.log("Image data length:", base64Data.length);

		const compressedBase64 = await compressImage(base64Data);
		console.log("Compressed image size:", compressedBase64.length);

		const response = await anthropic.messages.create({
			model: "claude-3-haiku-20240307",
			max_tokens: 1000,
			messages: [
				{
					role: "user",
					content: [
						{
							type: "text",
							text: "Analyze this image of a coupon or store logo. Extract the coupon code, discount value, store name, and expiry date if present. Return the information in JSON format with 'code', 'discount', 'store', and 'expiryDate' fields. If you can't find any of these, leave the respective field empty. For the expiry date, use the format 'YYYY-MM-DD' if possible, or 'No Expiry' if there's no expiration date. Always respond in proper JSON, even errors. You must ALWAYS respond in proper JSON format. Do not explain why an image cannot be analyzed. Just JSON, nothing else",
						},
						{
							type: "image",
							source: {
								type: "base64",
								media_type: "image/jpeg",
								data: compressedBase64,
							},
						},
					],
				},
			],
		});

		if (!response || !response.content || response.content.length === 0) {
			console.error("Empty response from Anthropic API");
			return NextResponse.json(
				{ error: "Empty response from Anthropic API" },
				{ status: 500 },
			);
		}

		const content = response.content[0];
		if (!content || typeof content.text !== "string") {
			console.error("Invalid content in Anthropic API response");
			return NextResponse.json(
				{ error: "Invalid content in Anthropic API response" },
				{ status: 500 },
			);
		}

        console.log('content: ', content.text);
		const result = JSON.parse(content.text);
		if (
			!result ||
			typeof result !== "object" ||
			(!result.code && !result.discount && !result.store && !result.expiryDate)
		) {
			console.error("Invalid JSON format in API response");
			return NextResponse.json(
				{ error: "Invalid JSON format in API response" },
				{ status: 500 },
			);
		}

		console.log("Processed image result:", result);
		return NextResponse.json(result);
	} catch (error) {
		console.error("Error in processImageWithAnthropic:", error);
		const errorMessage =
			error instanceof Error
				? error.message
				: "An unknown error occurred while processing the image";
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}

function isValidBase64(str: string) {
	if (str === "" || str.trim() === "") {
		return false;
	}
	try {
		return btoa(atob(str)) === str;
	} catch (err) {
		console.error(err);
		return false;
	}
}
