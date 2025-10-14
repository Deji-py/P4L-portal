import type { Metadata } from "next";
import { Geist_Mono, Open_Sans } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/context/queryProvider";
import { Toaster } from "sonner";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

const latofont = Open_Sans({
  variable: "--font-lato",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Produce For Lagos",
  description: "Produce For Lagos aggregators and bulk traders dashboard",
};

const Preloader = () => (
  <div className="h-screen w-full bg-background flex flex-col items-center justify-center  text-white">
    <Loader2 className="h-6 w-6 animate-spin text-primary mb-4" />
  </div>
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${latofont.variable} ${geistMono.variable} antialiased `}
      >
        {/* <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        > */}
        <Suspense fallback={<Preloader />}>
          <QueryProvider>
            {children}
            <Toaster richColors position="top-left" />
          </QueryProvider>
        </Suspense>
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}
