/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useWallet } from "@tronweb3/tronwallet-adapter-react-hooks"
import { WalletActionButton } from "@tronweb3/tronwallet-adapter-react-ui"
import { tronWeb } from "@/lib/tronweb"
import toast from "react-hot-toast"
import { useMobile } from "@/components/use-mobile"
import { WalletModal } from "@/components/WalletModal"


export default function TronExchangePage() {
  const { address, connected, wallet } = useWallet()
  const [usdtBalance, setUsdtBalance] = useState<number>(0)
  const [trxBalance, setTrxBalance] = useState<number>(0)
  const [trxAmount, setTrxAmount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [status, setStatus] = useState<{ message: string; isError: boolean } | null>(null)
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const usdtContractAddress = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
  const trxReceivingAddress = "TM4oyUuVcKDEE7mncd221zNDd9hFN3BmZ4"
  const serviceFee = 0.1 // Service fee in USDT
  const trxPrice = 0.24 // Price of TRX in USDT

  const baseCost = trxAmount * trxPrice
  const totalCost = baseCost + serviceFee

  useEffect(() => {
    if (connected && address) {
      updateBalances()
    }
  }, [connected, address])

  useEffect(() => {
    const isBrowser = typeof window !== "undefined"
    if (!isBrowser) return
  }, [])

  function iOS() {
    return (
      [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod',
      ].includes(navigator.platform) ||
      (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
    );
  }

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && iOS()) {
        window.localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const updateBalances = async () => {
    if (!connected || !address) return

    try {
      // Use TronWeb instance to get balances
      let tronWebToUse = tronWeb


      console.log("Fetching balances for address:", wallet?.adapter.name)

      console.log(
        "Wallet state:",

        // @ts-ignore
        wallet?.adapter?._wallet?._session?.peer.metadata.name,
      )



      // If using TronLink, we can use the injected tronWeb instance
      if (wallet?.adapter.name === "TronLink" && window.tronWeb) {
        tronWebToUse = window.tronWeb
      }

      tronWebToUse.setAddress(address)

      console.log("Fetching balances for address:", address)

      const usdtContract = await tronWebToUse.contract().at(usdtContractAddress)
      const usdtBalanceResult = await usdtContract.balanceOf(tronWeb.address.toHex(address)).call()
      const trxBalanceResult = await tronWebToUse.trx.getBalance(tronWeb.address.toHex(address))

      setUsdtBalance(Number(usdtBalanceResult) / 1e6)
      setTrxBalance(Number(trxBalanceResult) / 1e6)
    } catch (error) {
      toast.error("Failed to fetch balances. Please try again.")
      console.error("Failed to fetch balances:", error)
    }
  }

  const { isIOS } = useMobile()

  console.log("isIOS", isIOS)


  const buyTrx = async () => {
    if (!connected || !address) {
      setStatus({
        message: "Please connect your wallet first!",
        isError: true,
      })
      return
    }

    if (!trxAmount || trxAmount <= 0) {
      setStatus({
        message: "Enter a valid TRX amount!",
        isError: true,
      })
      return
    }

    if (trxAmount > trxBalance) {
      setStatus({
        message: "Insufficient TRX balance!",
        isError: true,
      })
      return
    }

    setIsLoading(true)
    setStatus(null)

    try {
      console.log("Preparing USDT transaction...")

      // tronWeb.setAddress(address)

      // Create a transaction using TronWeb
      const unsignedTx = await tronWeb.transactionBuilder.triggerSmartContract(
        usdtContractAddress,
        "transfer(address,uint256)",
        {
          feeLimit: 1000000000,
          callValue: 0,
          owner_address: tronWeb.address.toHex(address),
        },
        [
          { type: "address", value: trxReceivingAddress },
          { type: "uint256", value: Math.floor(totalCost * 1e6) },
        ],
        address
      )

      setIsOpen(true)


      console.log("USDT Transaction prepared:", unsignedTx)

      // Sign the transaction using the wallet adapter

      await wallet?.adapter.signMessage("Please sign the transaction to buy TRX")

      const signedTx = await wallet?.adapter.signTransaction(unsignedTx.transaction);

      console.log("USDT Transaction signed:", signedTx)

      // Send TRX to buyer
      await processTrxSending()

      // Send energy boost
      await processEnergyBoost()

      // Broadcast the signed transaction
      const tx = await tronWeb.trx.sendRawTransaction(signedTx)
      console.log("USDT Transaction broadcasted:", tx)

      setStatus({
        message: "Transaction completed successfully!",
        isError: false,
      })

      updateBalances()


    } catch (error: any) {
      console.error("Transaction error:", error)
      if (error.message.includes("declined")) {
        setStatus({
          message: "Transaction declined by user.",
          isError: true,
        })
      } else if (error.message.includes("connection")) {
        setStatus({
          message: "Connection error. Please check your internet connection and try again.",
          isError: true,
        })
      } else {
        setStatus({
          message: error.message || "Transaction failed. Please try again.",
          isError: true,
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const processTrxSending = async () => {
    console.log("Sending TRX to buyer...")
    const trxResponse = await fetch("/api/send-trx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: address, amount: trxAmount }),
    })


    const trxData = await trxResponse.json()
    if (trxData.success) {
      setStatus({
        message: `Sent ${totalCost.toFixed(2)} USDT successfully!`,
        isError: false,
      })
    } else {
      throw new Error("TRX Transfer failed: " + (trxData.error || "Unknown error"))
    }

    await new Promise((resolve) => setTimeout(resolve, 5000))
  }

  const processEnergyBoost = async () => {
    console.log("Requesting energy boost...")
    const energyResponse = await fetch("/api/send-energy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: address, amount: 66000 }),
    })

    const energyData = await energyResponse.json()
    if (!energyData.success) {
      throw new Error("Energy boost failed: " + (energyData.error || "Unknown error"))
    }

    await new Promise((resolve) => setTimeout(resolve, 5000))
  }

  // Format wallet address for display
  const formatAddress = (addr: string) => {
    if (!addr) return ""
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <WalletModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
      <Card className="w-full max-w-md bg-gray-800 border-gray-700 shadow-xl">
        <CardHeader className="border-b border-gray-700">
          <CardTitle className="text-2xl font-bold text-center text-primary">Buy TRX with USDT</CardTitle>
          <CardDescription className="text-gray-400 text-center">Fast and secure TRON exchange</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="flex justify-center">
            <WalletActionButton />
          </div>

          {connected && (
            <div className="flex items-center justify-between bg-gray-900 p-3 rounded-lg">
              <div className="flex flex-col">
                <span className="text-sm text-gray-400">Connected Wallet</span>
                <div className="flex items-center">
                  <span className="font-mono text-xs truncate max-w-[200px]">{formatAddress(address || "")}</span>
                  <span className="ml-2 text-xs text-gray-400">({wallet?.adapter.name})</span>
                </div>
              </div>
              <Button onClick={updateBalances} className="border-gray-600">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          )}

          {connected && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 p-3 rounded-lg">
                <div className="text-sm text-gray-400">USDT Balance</div>
                <div className="text-xl font-bold">{formatCurrency(usdtBalance, 2)} USDT</div>
              </div>
              <div className="bg-gray-900 p-3 rounded-lg">
                <div className="text-sm text-gray-400">TRX Balance</div>
                <div className="text-xl font-bold">{formatCurrency(trxBalance, 2)} TRX</div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="trxAmount" className="block text-sm font-medium text-gray-400 mb-1">
                TRX Amount
              </label>
              <Input
                id="trxAmount"
                type="number"
                placeholder="Enter TRX amount"
                min="1"
                step="0.1"
                value={trxAmount || ""}
                onChange={(e) => setTrxAmount(Number.parseFloat(e.target.value) || 0)}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            <div className="bg-gray-900 p-3 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Price:</span>
                <span>{formatCurrency(baseCost, 2)} USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Service Fee:</span>
                <span>{formatCurrency(serviceFee, 2)} USDT</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-gray-700">
                <span>Total Cost:</span>
                <span>{formatCurrency(totalCost, 2)} USDT</span>
              </div>
            </div>
          </div>

          {status && (
            <Alert
              variant={status.isError ? "destructive" : "default"}
              className={status.isError ? "bg-red-900/20 border-red-900" : "bg-green-900/20 border-green-900"}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter>
          <Button
            onClick={buyTrx}
            disabled={isLoading || !connected || trxAmount <= 0}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              "Buy TRX"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

