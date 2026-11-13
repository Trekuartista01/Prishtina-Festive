import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const malkieSlab = localFont({
  src: "../../public/fonts/malkie-slab.otf",
  variable: "--font-malkie-slab",
});

const aeonikPro = localFont({
  src: "../../public/fonts/AeonikProTRIAL-Regular.otf",
  variable: "--font-aeonik-pro",
});

const aeonikProBold = localFont({
  src: "../../public/fonts/AeonikProTRIAL-Bold.otf",
  variable: "--font-aeonik-pro-bold",
});

const barlowCondensed = localFont({
  src: [
    { path: "../../public/fonts/barlow-condensed/barlow-condensed-latin-600-normal.woff2", weight: "600" },
    { path: "../../public/fonts/barlow-condensed/barlow-condensed-latin-800-normal.woff2", weight: "800" },
  ],
  variable: "--font-barlow-condensed",
});

export const metadata: Metadata = {
  title: "PRISHTINA FESTIVE",
  description: "Prishtina Festive",
  icons: {
    icon: "/assets/winter/logo-vere-ndimen.png",
    apple: "/assets/winter/logo-vere-ndimen.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${malkieSlab.variable} ${aeonikPro.variable} ${aeonikProBold.variable} ${barlowCondensed.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
