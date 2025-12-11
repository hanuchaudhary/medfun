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
                  color:"#30b561"
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
