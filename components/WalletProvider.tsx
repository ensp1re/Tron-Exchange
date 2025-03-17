"use client"

import React, { useMemo, } from 'react';
import { WalletConnectionError, WalletGetNetworkError, WalletNotFoundError, WalletSignMessageError, WalletSignTransactionError, WalletWindowClosedError, type WalletError } from '@tronweb3/tronwallet-abstract-adapter';
import { WalletProvider as TronWalletProvider } from '@tronweb3/tronwallet-adapter-react-hooks';
import {
    WalletModalProvider,
} from '@tronweb3/tronwallet-adapter-react-ui';
import { BitKeepAdapter, ImTokenAdapter, OkxWalletAdapter, TokenPocketAdapter, TronLinkAdapter } from '@tronweb3/tronwallet-adapters';
import { WalletConnectAdapter } from '@tronweb3/tronwallet-adapter-walletconnect';
import { LedgerAdapter } from '@tronweb3/tronwallet-adapter-ledger';
import "@tronweb3/tronwallet-adapter-react-ui/style.css"
import toast from "react-hot-toast"

if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
    throw new Error("NEXT_PUBLIC_CLIENT_URL is not defined")
}


const WalletProvider: React.FC<{
    children: React.ReactNode
}> = ({ children }) => {
    // Handle wallet connection errors
    function onError(e: WalletError) {
        if (e instanceof WalletConnectionError) {
            toast.error("Failed to connect to wallet")
        } else if (e instanceof WalletSignTransactionError) {
            toast.error("Failed to sign transaction")
        } else if (e instanceof WalletWindowClosedError) {
            toast.error("Wallet window closed")
        } else if (e instanceof WalletNotFoundError) {
            toast.error("Wallet not found")
        } else if (e instanceof WalletGetNetworkError) {
            toast.error("Failed to get network")
        } else if (e instanceof WalletSignMessageError) {
            toast.error("Failed to sign message")
        }
        else {
            toast.error("An error occurred")
        }
    }


    const adapters = useMemo(function () {
        const tronLinkAdapter = new TronLinkAdapter();
        const walletConnectAdapter = new WalletConnectAdapter({
            network: 'Mainnet',
            options: {
                relayUrl: 'wss://relay.walletconnect.com',
                projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '0feb0df1b4c7493a4f2a3abd90ec45c5',
                metadata: {
                    name: 'TRON Exchange',
                    description: 'TRON Exchange WalletConnect',
                    url: `${process.env.NEXT_PUBLIC_CLIENT_URL}`,
                    icons: ['https://cdn.tronwallet.me/icons/icon-192x192.png'],
                },

            },
            web3ModalConfig: {
                themeMode: 'dark',
            },

        });
        const ledger = new LedgerAdapter({
            accountNumber: 2,
        });
        const bitKeepAdapter = new BitKeepAdapter();
        const tokenPocketAdapter = new TokenPocketAdapter();
        const imTokenAdapter = new ImTokenAdapter();
        const okxwalletAdapter = new OkxWalletAdapter();
        return [tronLinkAdapter, bitKeepAdapter, tokenPocketAdapter, okxwalletAdapter, walletConnectAdapter, ledger, imTokenAdapter];
    }, []);

    return (
        <TronWalletProvider onError={onError} autoConnect={true} disableAutoConnectOnLoad={true} adapters={adapters}>
            <WalletModalProvider>
                {
                    children
                }
            </WalletModalProvider>
        </TronWalletProvider>
    );
}


export default WalletProvider;