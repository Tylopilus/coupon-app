"use client";

import { useEffect } from "react";
import {
	requestNotificationPermission,
	scheduleNotification,
} from "../utils/notifications";

export function NotificationHandler() {
	useEffect(() => {
		const setupNotifications = async () => {
			const granted = await requestNotificationPermission();
			if (granted) {
				await scheduleNotification();
			}
		};

		setupNotifications();
	}, []);

	return null;
}
