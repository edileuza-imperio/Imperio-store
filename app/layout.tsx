import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";

import ToastProvider from "@/components/Toast/ToastProvider";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";

const fonteMarca = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-marca",
  display: "swap",
});

const fonteInterface = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-interface",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Universo Império",
    template: "%s | Universo Império",
  },
  description: "Descubra produtos, presentes e decoração no Universo Império.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${fonteMarca.variable} ${fonteInterface.variable}`}
    >
      <body>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
