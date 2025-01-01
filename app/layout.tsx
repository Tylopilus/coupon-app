import "./globals.css";
import { Poppins } from "next/font/google";
import { DarkModeToggle } from "./components/DarkModeToggle";
import { InstallPrompt } from "./components/InstallPrompt";
import Link from "next/link";
import { Settings } from "lucide-react";
import Script from "next/script";

const poppins = Poppins({
	weight: ["400", "500", "600", "700"],
	subsets: ["latin"],
	display: "swap",
});

export const metadata = {
	title: "Coupon App for Belinda ❤",
	description: "Easily manage and access your store coupons",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
				/>
				<link rel="manifest" href="/manifest.json" />
				<meta name="theme-color" content="#3B82F6" />
				<link rel="apple-touch-icon" href="/icon-192x192.png" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<meta name="apple-mobile-web-app-title" content="Belinda's Coupons" />
				<Script id="check-dark-mode" strategy="beforeInteractive">
					{`
            (function() {
              function getInitialColorMode() {
                const persistedColorPreference = window.localStorage.getItem('darkMode');
                const hasPersistedPreference = typeof persistedColorPreference === 'string';
                if (hasPersistedPreference) {
                  return persistedColorPreference === 'true';
                }
                return window.matchMedia('(prefers-color-scheme: dark)').matches;
              }
              const colorMode = getInitialColorMode();
              document.documentElement.classList.toggle('dark', colorMode);
            })();
          `}
				</Script>
			</head>
			<body
				className={`${poppins.className} bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors`}
			>
				<div className="min-h-screen flex flex-col">
					<header className="p-4 flex justify-between items-center">
						<h1 className="text-xl font-bold">Coupon App for Belinda ❤</h1>
						<div className="flex items-center space-x-2">
							<Link
								href="/settings"
								className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
							>
								<Settings className="h-5 w-5" />
							</Link>
							<DarkModeToggle />
						</div>
					</header>
					<main className="flex-grow">{children}</main>
					<footer className="text-center py-4 text-sm text-gray-600 dark:text-gray-400">
						© 2024 Coupon App for Belinda ❤
					</footer>
				</div>
				<InstallPrompt />
				<Script
					id="register-service-worker"
					strategy="afterInteractive"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
					dangerouslySetInnerHTML={{
						__html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
					}}
				/>
			</body>
		</html>
	);
}
