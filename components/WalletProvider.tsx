"use client"

import React from "react"
import { useMemo } from "react"
import { WalletError, WalletConnectionError, WalletSignTransactionError } from "@tronweb3/tronwallet-abstract-adapter"
import { WalletProvider as TronWalletProvider } from "@tronweb3/tronwallet-adapter-react-hooks"
import { WalletModalProvider } from "@tronweb3/tronwallet-adapter-react-ui"
import { BitKeepAdapter, OkxWalletAdapter, TronLinkAdapter, ImTokenAdapter } from "@tronweb3/tronwallet-adapters"
import { WalletConnectAdapter } from "@tronweb3/tronwallet-adapter-walletconnect"
import { LedgerAdapter } from "@tronweb3/tronwallet-adapter-ledger"
// Import the styles
import "@tronweb3/tronwallet-adapter-react-ui/style.css"
import toast from "react-hot-toast"

export function WalletProvider({ children }: { children: React.ReactNode }) {
    // Handle wallet connection errors
    function onError(e: WalletError) {
        if (e instanceof WalletConnectionError) {
            toast.error("Failed to connect to wallet")
            console.error("Wallet connection error:", e.message)
        } else if (e instanceof WalletSignTransactionError) {
            toast.error("Failed to sign transaction")
            console.error("Wallet sign transaction error:", e.message)
        } else {
            console.error("Wallet error:", e.message)
        }
    }

    // Configure wallet adapters
    const adapters = useMemo(() => {
        const tronLinkAdapter = new TronLinkAdapter()

        const walletConnectAdapter = new WalletConnectAdapter({
            network: "Mainnet",
            options: {
                relayUrl: 'wss://relay.walletconnect.com',
                projectId: '363d081347abde707e55878fbcbf6242', // create a new project on https://cloud.reown.com,
                metadata: {
                    name: 'Tron Exchange',
                    description: 'Tron Exchange',
                    url: `${process.env.NEXT_PUBLIC_CLIENT_URL}`,
                    icons: [`${process.env.NEXT_PUBLIC_CLIENT_URL}/favicon.ico`],
                },
            },
            web3ModalConfig: {
                themeMode: 'dark',
                themeVariables: {
                    '--wcm-z-index': '1000'
                },
            }
        });


        // Ledger hardware wallet adapter
        const ledgerAdapter = new LedgerAdapter({
            accountNumber: 2,
        })

        // Add other popular TRON wallets
        const bitKeepAdapter = new BitKeepAdapter()
        const okxwalletAdapter = new OkxWalletAdapter()

        const imTokenAdapter = new ImTokenAdapter()

        return [tronLinkAdapter, bitKeepAdapter, okxwalletAdapter, walletConnectAdapter, ledgerAdapter, imTokenAdapter].filter(Boolean)
    }, [])

    return (
        <TronWalletProvider onError={onError} autoConnect={false} disableAutoConnectOnLoad={true} adapters={adapters}>
            <WalletModalProvider>{children}</WalletModalProvider>
        </TronWalletProvider>
    )
}

