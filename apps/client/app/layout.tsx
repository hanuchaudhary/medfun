import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeProvider } from "@/components/theme-provider";
import PrivyProvider from "@/components/providers/PrivyProvider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "med.fun - Token Launchpad on Solana",
    template: "%s | med.fun",
  },
  description:
    "med.fun is the ultimate token launchpad on Solana. Create, launch, and trade your own tokens instantly with low fees and lightning-fast transactions.",
  keywords: [
    "Solana",
    "token launchpad",
    "DEX",
    "cryptocurrency",
    "token creation",
    "Solana tokens",
    "DeFi",
    "crypto trading",
    "meme coins",
    "med.fun",
  ],
  authors: [{ name: "med.fun" }],
  creator: "med.fun",
  publisher: "med.fun",
  metadataBase: new URL("https://med.fun"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://med.fun",
    siteName: "med.fun",
    title: "med.fun - Token Launchpad on Solana",
    description:
      "Create, launch, and trade your own tokens on Solana. The fastest and easiest way to launch your token.",
    images: [
      {
        url: "/medfun-banner-final.png",
        width: 1200,
        height: 630,
        alt: "med.fun - Token Launchpad on Solana",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "med.fun - Token Launchpad on Solana",
    description:
      "Create, launch, and trade your own tokens on Solana. The fastest and easiest way to launch your token.",
    images: ["/medfun-banner-final.png"],
    creator: "@medfun",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/medfun-favicon.png",
    shortcut: "/medfun-favicon.png",
    apple: "/medfun-logo-circle.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning suppressContentEditableWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background selection:text-background selection:bg-primary`}
      >
        <PrivyProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex-1 md:ml-60 flex flex-col">
                <Navbar />
                <main className="flex-1">{children}</main>
                <MobileNav />
              </div>
            </div>
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  borderRadius: "30px",
                  border: "0px",
                  color: "#30b561",
                },
              }}
              richColors
            />
          </ThemeProvider>
        </PrivyProvider>
      </body>
    </html>
  );
}
