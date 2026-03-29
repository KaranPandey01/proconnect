import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import LayoutWrapper from "@/components/LayoutWrapper"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "ProConnect",
  description: "Professional Social Feed",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-gradient-to-br from-[#0f172a] via-[#020617] to-black text-white">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  )
}