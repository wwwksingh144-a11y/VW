import type { Metadata } from "next";
import { League_Spartan, DM_Sans } from "next/font/google";
import "./globals.css";

const leagueSpartan = League_Spartan({
  variable: "--font-league-spartan",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://visionwing.com"), // Placeholder URL, update to actual domain
  title: {
    default: "Vision Wings - Premium Marketing Agency",
    template: "%s | Vision Wings",
  },
  description: "Vision Wings is a premium marketing agency, brand strategy studio, and business consultancy dedicated to elevating visionary brands.",
  keywords: ["marketing agency", "brand strategy", "business consultancy", "premium design", "Vision Wings"],
  authors: [{ name: "Vision Wings" }],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/logo-svg/Primary%20ICON.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/logo-svg/Primary%20ICON.svg",
  },
  openGraph: {
    title: "Vision Wings - Premium Marketing Agency",
    description: "Vision Wings is a premium marketing agency, brand strategy studio, and business consultancy.",
    url: "https://visionwing.com",
    siteName: "Vision Wings",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vision Wings - Premium Marketing Agency",
    description: "Vision Wings is a premium marketing agency, brand strategy studio, and business consultancy.",
    creator: "@visionwing",
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
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "Vision Wings",
  "image": "https://visionwing.com/logo-svg/Primary%20ICON.svg",
  "description": "Vision Wings is a premium marketing agency, brand strategy studio, and business consultancy.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Strategy Blvd",
    "addressLocality": "New York",
    "addressRegion": "NY",
    "postalCode": "10001",
    "addressCountry": "US"
  },
  "url": "https://visionwing.com",
  "telephone": "+11234567890",
};

import SmoothScrollProvider from "@/components/motion/SmoothScrollProvider";
import CursorAperture from "@/components/motion/CursorAperture";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { auth } from '@/lib/auth/server';

import { LoaderProvider } from "@/components/providers/LoaderProvider";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user = null;
  let isAdmin = false;
  try {
    const sessionRes = await auth.getSession();
    if (sessionRes?.data?.user) {
      user = sessionRes.data.user;
      
      const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];
      const superAdmin = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
      
      if (
        (user.email && adminEmails.includes(user.email.toLowerCase())) || 
        (user.email && superAdmin === user.email.toLowerCase())
      ) {
        isAdmin = true;
      }
    }
  } catch (e) {
    // Ignore errors during build or if Neon Auth is unconfigured
  }

  return (
    <html
      lang="en"
      className={`${leagueSpartan.variable} ${dmSans.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-warm-50 text-navy-950">
        <LoaderProvider>
          <SmoothScrollProvider>
            <CursorAperture />
            <Navbar user={user} isAdmin={isAdmin} />
            <main className="flex-grow">{children}</main>
            <Footer />
          </SmoothScrollProvider>
        </LoaderProvider>
      </body>
    </html>
  );
}
