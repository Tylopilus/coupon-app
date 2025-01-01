export async function processImageWithAnthropic(imageData: string) {
	try {
		// Ensure the imageData is in the correct format
		const base64Data = imageData.split(",")[1] || imageData;

		// Check if the base64Data is valid
		if (!isValidBase64(base64Data)) {
			console.error("Invalid base64 image data");
			throw new Error("Invalid base64 image data");
		}

		console.log("Image data length:", base64Data.length);

		const response = await fetch("/api/process-image", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ imageData: base64Data }),
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error("API response error:", errorData);
			throw new Error(
				`Failed to process image: ${response.status} ${JSON.stringify(errorData)}`,
			);
		}

		const result = await response.json();
		console.log("Processed image result:", result);
		return result;
	} catch (error) {
		console.error("Error in processImageWithAnthropic:", error);
		if (error instanceof Error) {
			throw new Error(`Failed to process image: ${error.message}`);
		}
		throw new Error("An unknown error occurred while processing the image");
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
