import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jidopay.com"),
  title: {
    default: "JidoPay — Modern payments infrastructure",
    template: "%s — JidoPay",
  },
  description:
    "JidoPay is the payments platform built for modern businesses. Accept payments, send invoices, and get paid — all from one beautiful dashboard.",
  keywords: [
    "payments",
    "invoicing",
    "business payments",
    "payment platform",
    "fintech",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://jidopay.com",
    siteName: "JidoPay",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
        suppressHydrationWarning
      >
        <body className="font-sans min-h-screen bg-background text-foreground antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
