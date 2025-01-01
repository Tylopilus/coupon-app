"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { ArrowLeft, Plus, Camera } from "lucide-react";
import Link from "next/link";
import { getStores, addCoupon, type Coupon } from "../utils/storage";
import { checkAndNotifyExpiringCoupons } from "../utils/notifications";
import { CameraCapture } from "../components/CameraCapture";
import { processImageWithAnthropic } from "../utils/imageProcessing";

let renderCount = 0;

export default function AddCoupon() {
	renderCount++;
	console.log(`AddCoupon render count: ${renderCount}`);
	const router = useRouter();
	const [stores, setStores] = useState<string[]>([]);
	const [newStore, setNewStore] = useState("");
	const [formData, setFormData] = useState<Omit<Coupon, "id">>({
		store: "",
		code: "",
		discount: "",
		expiryDate: "",
		codeImage: "",
		codeType: undefined,
	});
	const [showCamera, setShowCamera] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		console.log("AddCoupon useEffect triggered");
		let isMounted = true;
		async function fetchStores() {
			try {
				console.log("Fetching stores...");
				const fetchedStores = await getStores();
				console.log("Fetched stores:", fetchedStores);
				if (isMounted) {
					setStores(fetchedStores);
					setIsLoading(false);
					console.log("Stores state updated");
				}
			} catch (error) {
				console.error("Error fetching stores:", error);
				if (isMounted) {
					setError("Failed to load stores. Please try again.");
					setIsLoading(false);
					console.log("Error state updated");
				}
			}
		}
		fetchStores();
		return () => {
			console.log("AddCoupon useEffect cleanup");
			isMounted = false;
		};
	}, []);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		console.log("handleChange called", e.target.name, e.target.value);
		const { name, value, type } = e.target;
		if (type === "checkbox") {
			setFormData((prev) => {
				return { ...prev, [name]: (e.target as HTMLInputElement).checked };
			});
		} else {
			setFormData((prev) => {
				console.log("Updating formData", name, value);
				return { ...prev, [name]: value };
			});
		}
	};

	const handleNewStoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setNewStore(e.target.value);
	};

	const handleAddNewStore = () => {
		if (newStore && !stores.includes(newStore)) {
			setStores((prev) => [...prev, newStore]);
			setFormData((prev) => ({ ...prev, store: newStore }));
			setNewStore("");
		}
	};

	const handleImageCapture = async (
		imageData: string,
		codeData?: { type: "qr" | "barcode"; value: string },
	) => {
		setShowCamera(false);
		setError(null);
		if (codeData) {
			setFormData((prev) => ({
				...prev,
				code: codeData.value,
				codeImage: imageData,
				codeType: codeData.type,
			}));
			return;
		}
		setIsProcessing(true);
		try {
			console.log("Processing image...");
			const data = await processImageWithAnthropic(imageData);
			console.log("Processed image data:", data);
			if (data && (data.code || data.discount || data.store)) {
				setFormData((prev) => ({
					...prev,
					code: data.code || prev.code,
					discount: data.discount || prev.discount,
					store: data.store || prev.store,
					codeImage: imageData,
				}));
				if (data.store && !stores.includes(data.store)) {
					setStores((prev) => [...prev, data.store]);
				}
			} else {
				setError(
					"No valid data could be extracted from the image. Please try again or enter the details manually.",
				);
			}
		} catch (error) {
			console.error("Error processing image:", error);
			setError(
				error instanceof Error
					? error.message
					: "An unknown error occurred while processing the image. Please try again or enter the details manually.",
			);
		} finally {
			setIsProcessing(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		console.log("handleSubmit triggered");
		e.preventDefault();
		setError(null);
		setIsProcessing(true);
		try {
			const newCoupon: Coupon = {
				...formData,
				id: uuidv4(),
				store: formData.store || newStore,
			};

			// Validate coupon data
			if (
				!newCoupon.store ||
				!newCoupon.code ||
				!newCoupon.discount ||
				!newCoupon.expiryDate
			) {
				throw new Error("Please fill in all required fields");
			}

			console.log("Adding new coupon:", newCoupon);
			await addCoupon(newCoupon);

			if (newStore && !stores.includes(newStore)) {
				setStores((prev) => [...prev, newStore]);
			}

			await checkAndNotifyExpiringCoupons();
			console.log("Coupon added successfully, navigating to home");
			router.push("/");
		} catch (error) {
			console.error("Error adding coupon:", error);
			setError(
				error instanceof Error
					? error.message
					: "An unknown error occurred while adding the coupon. Please try again.",
			);
		} finally {
			setIsProcessing(false);
		}
	};

	console.log("AddCoupon component rendered", {
		stores,
		formData,
		isLoading,
		error,
	});

	if (isLoading) {
		return (
			<div className="container mx-auto p-4 max-w-[390px]">Loading...</div>
		);
	}

	return (
		<div className="container mx-auto p-4 max-w-[390px]">
			<div className="flex items-center mb-6">
				<Link href="/" className="mr-4">
					<ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
				</Link>
				<h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
					Add New Coupon
				</h1>
			</div>
			<form
				onSubmit={handleSubmit}
				className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
			>
				<div>
					<label
						htmlFor="store"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
					>
						Store
					</label>
					<div className="flex items-center space-x-2">
						<select
							id="store"
							name="store"
							value={formData.store}
							onChange={handleChange}
							className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
						>
							<option value="">Select store or add new</option>
							{stores.map((store) => (
								<option key={store} value={store}>
									{store}
								</option>
							))}
						</select>
					</div>
				</div>
				<div>
					<label
						htmlFor="newStore"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
					>
						New Store
					</label>
					<div className="flex items-center space-x-2">
						<input
							type="text"
							id="newStore"
							value={newStore}
							onChange={handleNewStoreChange}
							className="min-w-0 flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
							placeholder="Enter new store name"
						/>
						<button
							type="button"
							onClick={handleAddNewStore}
							className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<Plus className="h-5 w-5" />
						</button>
					</div>
				</div>
				<div>
					<label
						htmlFor="code"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
					>
						Coupon Code
					</label>
					<div className="flex items-center space-x-2">
						<input
							type="text"
							id="code"
							name="code"
							required
							value={formData.code}
							onChange={handleChange}
							className="min-w-0 flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
						/>
						<button
							type="button"
							onClick={() => setShowCamera(true)}
							className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
							title="Scan coupon code"
						>
							<Camera className="h-5 w-5" />
						</button>
					</div>
				</div>
				<div>
					<label
						htmlFor="discount"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
					>
						Discount
					</label>
					<input
						type="text"
						id="discount"
						name="discount"
						required
						value={formData.discount}
						onChange={handleChange}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
					/>
				</div>
				<div className="flex items-center mb-4">
					<input
						type="checkbox"
						id="noExpiry"
						name="noExpiry"
						checked={formData.expiryDate === "No Expiry"}
						onChange={(e) =>
							setFormData((prev) => ({
								...prev,
								expiryDate: e.target.checked ? "No Expiry" : "",
							}))
						}
						className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
					/>
					<label
						htmlFor="noExpiry"
						className="ml-2 block text-sm text-gray-900 dark:text-gray-100"
					>
						No Expiry Date
					</label>
				</div>
				{formData.expiryDate !== "No Expiry" && (
					<div>
						<label
							htmlFor="expiryDate"
							className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
						>
							Expiry Date
						</label>
						<input
							type="date"
							id="expiryDate"
							name="expiryDate"
							required={formData.expiryDate !== "No Expiry"}
							value={formData.expiryDate}
							onChange={handleChange}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
						/>
					</div>
				)}
				{error && <div className="text-red-500 text-sm">{error}</div>}
				<button
					type="submit"
					className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
					disabled={isProcessing}
				>
					{isProcessing ? "Processing..." : "Add Coupon"}
				</button>
			</form>
			{showCamera && (
				<CameraCapture
					onCapture={handleImageCapture}
					onClose={() => setShowCamera(false)}
				/>
			)}
		</div>
	);
}
