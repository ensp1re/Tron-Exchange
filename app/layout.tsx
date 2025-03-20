'use client';

import React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import dynamic from 'next/dynamic'
import { ThemeProvider } from "@/components/ThemeProvider"
import { Toaster } from "react-hot-toast"
import '@tronweb3/tronwallet-adapter-react-ui/style.css';

const WalletProvider = dynamic(() => import("@/components/WalletProvider"), { ssr: false })



const inter = Inter({ subsets: ["latin", "cyrillic"] })


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" suppressHydrationWarning suppressContentEditableWarning>
      <head>
        <link rel="icon" type="image/x-icon" href="/logo.png" />
        <meta name="yandex-verification" content="3f02f1ac70a43e58" />
        <meta property="og:title" content="buytrx.org - get Tron to send USDT" />
        <meta property="og:description" content="Buy TRX (Tron) with USDT even if you don't have any TRX right now" />
        <meta property="og:image" content="https://buytrx.org/logo.png" />
        <meta property="og:url" content="https://buytrx.org" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <WalletProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 5000,
                style: {
                  background: "#333",
                  color: "#fff",
                },
              }}
            />

            {children}
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

