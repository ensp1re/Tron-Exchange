import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/ThemeProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TRON Exchange | Buy TRX with USDT",
  description: "Fast and secure cryptocurrency exchange platform for TRON (TRX) and USDT",
  keywords: ["TRON", "TRX", "USDT", "cryptocurrency", "exchange", "blockchain"],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script src="https://cdn.jsdelivr.net/npm/tronweb@4.0.2/dist/TronWeb.js" defer></script>
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
            <header className="container mx-auto py-4 px-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-primary"
                  >
                    <path d="M16 2L4 9V23L16 30L28 23V9L16 2Z" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path d="M16 16L4 9M16 16L28 9M16 16V30" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  <span className="ml-2 text-xl font-bold text-white">TRON Exchange</span>
                </div>
                <nav>
                  <ul className="flex space-x-4">
                    <li>
                      <a href="#" className="text-gray-300 hover:text-white transition-colors">
                        Home
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-300 hover:text-white transition-colors">
                        Exchange
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-300 hover:text-white transition-colors">
                        FAQ
                      </a>
                    </li>
                  </ul>
                </nav>
              </div>
            </header>
            <main>{children}</main>
            <footer className="container mx-auto py-6 px-4 text-center text-gray-400 text-sm">
              <p>© {new Date().getFullYear()} TRON Exchange. All rights reserved.</p>
              <p className="mt-2">
                <a href="#" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
                {" • "}
                <a href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </p>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
