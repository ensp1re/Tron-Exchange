/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useMobile } from "./use-mobile"
import { useWallet } from "@tronweb3/tronwallet-adapter-react-hooks"

interface WalletModalProps {
    isOpen: boolean
    onClose: () => void
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
    const [timeLeft, setTimeLeft] = useState(15)
    const { isIOS } = useMobile()
    const { wallet } = useWallet();


    const userAgent = navigator.userAgent.toLowerCase();
    const [isRedirectButton, setIsRedirectButton] = useState<boolean>(false);

    const isIphone = userAgent.includes('iphone');
    const isSafari = isIphone && userAgent.includes('safari') && !userAgent.includes('crios');
    const isChrome = isIphone && userAgent.includes('crios');

    // @ts-ignore
    const walletName = wallet?.adapter?._wallet?._session?.peer.metadata.name?.toLowerCase();

    useEffect(() => {
        if ((isSafari || isChrome) && walletName?.includes('trust')) {
            setIsRedirectButton(true);
        }
    }, [isSafari, isChrome, walletName]);


    useEffect(() => {
        if (!isOpen) return

        setTimeLeft(15)

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer)
                    onClose()
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [isOpen])

    if (!isOpen || !isIOS) {
        return null
    }

    function redirectToTrustWallet() {

        const trustWalletURL = "trust://";

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);



        if (isMobile) {

            window.location.href = trustWalletURL;

            onClose();

        } else {

            alert("Этот функционал доступен только на мобильных устройствах.");

        }

    }





    const progress = (timeLeft / 15) * 100
    const circumference = 2 * Math.PI * 18

    return isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-[90%] max-w-md relative c">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Open a wallet</h2>
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </Button>
                    </div>

                    <div className="flex justify-center mt-6">
                        <div className="relative flex items-center justify-center">
                            <svg width="48" height="48" viewBox="0 0 48 48">
                                <circle cx="24" cy="24" r="18" fill="transparent" stroke="#e2e8f0" strokeWidth="4" />
                                <circle
                                    cx="24"
                                    cy="24"
                                    r="18"
                                    fill="transparent"
                                    stroke="#3b82f6"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={circumference - (progress / 100) * circumference}
                                    transform="rotate(-90 24 24)"
                                />
                            </svg>
                            <div className="absolute text-sm font-medium">{timeLeft}s</div>
                        </div>
                    </div>

                    {isRedirectButton && (
                        <div className="mt-6 flex justify-center">
                            <Button onClick={redirectToTrustWallet} className="bg-blue-500 text-white">
                                Open in Trust Wallet
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    ) : null
}
