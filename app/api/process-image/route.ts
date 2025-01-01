import { NextRequest, NextResponse } from "next/server";
import { Anthropic } from "@anthropic-ai/sdk";

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

		const response = await anthropic.messages.create({
			model: "claude-3-haiku-20240307",
			max_tokens: 1000,
			messages: [
				{
					role: "user",
					content: [
						{
							type: "text",
							text: "Analyze this image of a coupon or store logo. Extract the coupon code, discount value, store name, and expiry date if present. Return the information in JSON format with 'code', 'discount', 'store', and 'expiryDate' fields. If you can't find any of these, leave the respective field empty. For the expiry date, use the format 'YYYY-MM-DD' if possible, or 'No Expiry' if there's no expiration date.",
						},
						{
							type: "image",
							source: {
								type: "base64",
								media_type: "image/jpeg",
								data: base64Data,
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
