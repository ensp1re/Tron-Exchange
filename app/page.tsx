/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Wallet, RefreshCw } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

declare global {
  interface Window {
    tronWeb: any;
    tronLink: any;
  }
}

export default function TronExchangePage() {
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [usdtBalance, setUsdtBalance] = useState<number>(0)
  const [trxBalance, setTrxBalance] = useState<number>(0)
  const [trxAmount, setTrxAmount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [status, setStatus] = useState<{ message: string; isError: boolean } | null>(null)
  const [tronWebInstance, setTronWebInstance] = useState<any>(null)

  const usdtContractAddress = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
  const trxReceivingAddress = "TM4oyUuVcKDEE7mncd221zNDd9hFN3BmZ4"
  const serviceFee = 0.1 // Service fee in USDT
  const trxPrice = 0.24 // Price of TRX in USDT

  const baseCost = trxAmount * trxPrice
  const totalCost = baseCost + serviceFee

  useEffect(() => {
    // Check if TronLink is installed
    const checkTronLink = () => {
      return typeof window !== "undefined" && window.tronWeb
    }

    if (checkTronLink() && window.tronWeb.defaultAddress.base58) {
      setTronWebInstance(window.tronWeb)
      setWalletAddress(window.tronWeb.defaultAddress.base58)
      updateBalances(window.tronWeb, window.tronWeb.defaultAddress.base58)
    }
  }, [])

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.tronLink) {
      setStatus({
        message: "Please install TronLink extension!",
        isError: true,
      })
      return
    }

    try {
      await window.tronLink.request({ method: "tron_requestAccounts" })
      const tronWeb = window.tronWeb
      setTronWebInstance(tronWeb)

      if (tronWeb && tronWeb.defaultAddress.base58) {
        setWalletAddress(tronWeb.defaultAddress.base58)
        updateBalances(tronWeb, tronWeb.defaultAddress.base58)
      }
    } catch (error) {
      console.error("Wallet connection error:", error)
      setStatus({
        message: "Failed to connect to TronLink.",
        isError: true,
      })
    }
  }

  const updateBalances = async (tronWeb: any, address: string) => {
    if (!address || !tronWeb) return

    try {
      const usdtContract = await tronWeb.contract().at(usdtContractAddress)
      const usdtBalanceResult = await usdtContract.balanceOf(address).call()
      const trxBalanceResult = await tronWeb.trx.getBalance(address)

      setUsdtBalance(Number(usdtBalanceResult) / 1e6)
      setTrxBalance(Number(trxBalanceResult) / 1e6)
    } catch (error) {
      console.error("Balance fetch error:", error)
      setStatus({
        message: "Failed to fetch balances.",
        isError: true,
      })
    }
  }

  const buyTrx = async () => {
    if (!walletAddress) {
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

    setIsLoading(true)
    setStatus(null)

    try {
      console.log("Preparing USDT transaction...")

      const usdtValue = Math.floor(totalCost * 1e6)

      const unsignedTx = await tronWebInstance.transactionBuilder.triggerSmartContract(
        usdtContractAddress,
        "transfer(address,uint256)",
        {},
        [
          { type: "address", value: trxReceivingAddress },
          { type: "uint256", value: usdtValue },
        ],
        walletAddress,
      )

      const signedTx = await tronWebInstance.trx.sign(unsignedTx.transaction)
      console.log("Transaction signed!")

      console.log("Sending USDT to buyer...")
      const trxResponse = await fetch("/api/send-trx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: walletAddress, amount: trxAmount }),
      })

      console.log(trxResponse)


      if (!trxResponse.ok) {
        console.error("TRX Transfer failed!")
        setStatus({
          message: "TRX Transfer failed!",
          isError: true,
        })
        return
      }

      const trxData = await trxResponse.json()
      if (trxData.success) {
        setStatus({
          message: `Sent ${totalCost} USDT successfully!`,
          isError: false,
        })
      } else {
        setStatus({
          message: "TRX Transfer failed!",
          isError: true,
        })
        console.error("TRX Transfer failed:", trxData)
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 5000))

      console.log("Requesting energy boost...")
      const energyResponse = await fetch("/api/send-energy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: walletAddress, amount: 66000 }),
      })

      if (!energyResponse.ok) {
        console.error("Energy boost failed!")
        setStatus({
          message: "Energy boost failed! Transaction may have high fees.",
          isError: true,
        })
        return
      }

      const energyData = await energyResponse.json()


      if (!energyData.success) {
        console.error("Energy boost failed!")
        setStatus({
          message: "Energy boost failed! Transaction may have high fees.",
          isError: true,
        })
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 5000))
      const tx = await tronWebInstance.trx.sendRawTransaction(signedTx)
      console.log("USDT Transaction broadcasted:", tx)

      setStatus({
        message: "Transaction completed successfully!",
        isError: false,
      })

      updateBalances(tronWebInstance, walletAddress)
    } catch (error) {
      console.error("Transaction error:", error)
      setStatus({
        message: "Transaction failed. Please try again.",
        isError: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700 shadow-xl">
        <CardHeader className="border-b border-gray-700">
          <CardTitle className="text-2xl font-bold text-center text-primary">Buy TRX with USDT</CardTitle>
          <CardDescription className="text-gray-400 text-center">Fast and secure TRON exchange</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {!walletAddress ? (
            <Button onClick={connectWallet} className="w-full bg-primary hover:bg-primary/90" size="lg">
              <Wallet className="mr-2 h-5 w-5" />
              Connect Wallet
            </Button>
          ) : (
            <div className="flex items-center justify-between bg-gray-900 p-3 rounded-lg">
              <div className="flex flex-col">
                <span className="text-sm text-gray-400">Connected Wallet</span>
                <span className="font-mono text-xs truncate max-w-[200px]">{walletAddress}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateBalances(tronWebInstance, walletAddress)}
                className="border-gray-600"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          )}

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
            disabled={isLoading || !walletAddress || trxAmount <= 0}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
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

