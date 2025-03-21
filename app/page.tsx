/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, ReactElement } from "react";
import { ChevronDown, ArrowRight, AlertCircle } from 'lucide-react';
import { useWallet } from "@tronweb3/tronwallet-adapter-react-hooks";
import { tronWeb } from "@/lib/tronweb";
import toast from "react-hot-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMobile } from "@/components/use-mobile";
import { WalletModal } from "@/components/WalletModal";
import UsdtLogo from "@/components/UsdtLogo";
import TrxLogo from "@/components/TrxLogo";
import LoadingAnimation from "@/components/LoadingAnimation";
import FaqSection from "@/components/Faq";
import InstructionModal from "@/components/InstructionModal";
import { AdapterName } from "@tronweb3/tronwallet-abstract-adapter";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { isUserAgentMobile } from "@/lib/utils";

export default function Home(): ReactElement {
  const { address, connected, wallet, connect, select } = useWallet();
  const [spendUsdt, setSpendUsdt] = useState<string>("1");
  const [buyTrx, setBuyTrx] = useState<string>("0");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdditionalOpen, setIsAdditionalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [trxPrice, setTrxPrice] = useState<number>(0);
  const [recipientAddress, setRecipientAddress] = useState<string>("");



  useEffect(() => {
    const fetchTrxPrice = async () => {
      const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd");
      const data = await response.json();
      setTrxPrice(data.tron.usd);
    };
    fetchTrxPrice();
  }, []);

  // New state from your component
  const [usdtBalance, setUsdtBalance] = useState<number>(0);
  const [status, setStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);

  // Constants from your component
  const usdtContractAddress = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
  const trxReceivingAddress = "TM4oyUuVcKDEE7mncd221zNDd9hFN3BmZ4";
  const serviceFee = 0.1; // Network fee in USDT
  const pricePerUsdt = 1 / trxPrice;

  // Calculate total USDT (amount + network fee)
  const totalUsdt = Number.parseFloat(spendUsdt) + serviceFee;
  const trxAmount = Number.parseFloat(buyTrx.toString());

  // Update TRX amount when USDT changes
  useEffect(() => {
    const usdt = Number.parseFloat(spendUsdt) || 0;
    const trx = parseFloat((usdt * pricePerUsdt).toFixed(2));
    setBuyTrx(trx.toString());
  }, [spendUsdt, pricePerUsdt]);

  // Wallet connection effects
  useEffect(() => {
    if (connected && address) {
      updateBalances();
    }
  }, [connected, address]);

  useEffect(() => {
    const isBrowser = typeof window !== "undefined";
    if (!isBrowser) return;
  }, []);

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
    if (!connected || !address) return;

    try {
      // Use TronWeb instance to get balances
      let tronWebToUse = tronWeb;

      // If using TronLink, we can use the injected tronWeb instance
      if (wallet?.adapter.name === "TronLink" && window.tronWeb) {
        tronWebToUse = window.tronWeb;
      }

      tronWebToUse.setAddress(address);

      const usdtContract = await tronWebToUse.contract().at(usdtContractAddress);
      const usdtBalanceResult = await usdtContract.balanceOf(tronWeb.address.toHex(address)).call();

      setUsdtBalance(Number(usdtBalanceResult) / 1e6);
    } catch (error) {
      toast.error("Failed to fetch balances. Please try again.");
      console.error("Failed to fetch balances:", error);
    }
  };

  const { isIOS } = useMobile();

  console.log("isIOS", isIOS);

  const handleBuyClick = async () => {
    if (!connected || !address) {
      setStatus({
        message: "Пожалуйста, сначала подключите ваш кошелек!",
        isError: true,
      });
      return;
    }

    if (totalUsdt > usdtBalance) {
      setStatus({
        message: `
            Общая сума к оплате: ${totalUsdt.toFixed(2)} USDT.
            Ваш баланс: ${usdtBalance.toFixed(2)} USDT.
          `,
        isError: true,
      });
      return;
    }

    setIsLoading(true);
    setStatus(null);

    try {
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
          { type: "uint256", value: Math.floor(totalUsdt * 1e6) },
        ],
        address
      );

      setIsWalletModalOpen(true);

      // Sign the transaction using the wallet adapter
      const signedTx = await wallet?.adapter.signTransaction(unsignedTx.transaction);

      // Send TRX to buyer
      await processTrxSending();

      // Send energy boost
      await processEnergyBoost();

      // Broadcast the signed transaction
      const tx = await tronWeb.trx.sendRawTransaction(signedTx);

      console.log("Transaction result:", tx);

      setStatus({
        message: "Транзакция успешно завершена!",
        isError: false,
      });

      updateBalances();
    } catch (error: any) {
      console.error("Transaction error:", error);
      if (error.message.includes("declined")) {
        setStatus({
          message: "Транзакция отклонена пользователем.",
          isError: true,
        });
      } else if (error.message.includes("connection")) {
        setStatus({
          message: "Ошибка соединения. Пожалуйста, проверьте ваше интернет-соединение и попробуйте снова.",
          isError: true,
        });
      } else {
        setStatus({
          message: error.message || "Транзакция не удалась. Пожалуйста, попробуйте еще раз.",
          isError: true,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const processTrxSending = async () => {
    const trxResponse = await fetch("/api/send-trx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: recipientAddress ? recipientAddress : address, amount: trxAmount }),
    });

    const trxData = await trxResponse.json();
    if (trxData.success) {
      setStatus({
        message: `Успешно отправлено ${totalUsdt.toFixed(2)} USDT!`,
        isError: false,
      });
    } else {
      throw new Error("Перевод TRX не удался: " + (trxData.error || "Неизвестная ошибка"));
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  };

  const processEnergyBoost = async () => {
    const energyResponse = await fetch("/api/send-energy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: recipientAddress ? recipientAddress : address, amount: 66000 }),
    });

    const energyData = await energyResponse.json();
    if (!energyData.success) {
      throw new Error("Energy boost failed: " + (energyData.error || "Unknown error"));
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  };

  // Format wallet address for display
  // const formatAddress = (addr: string) => {
  //   if (!addr) return "";
  //   return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  // };


  useEffect(() => {
    console.log(connected, address);
  }, []);


  const [showMobileModal, setShowMobileModal] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  console.log("isMobile", isMobile);

  useEffect(() => {
    setIsMobile(isUserAgentMobile(navigator.userAgent));
  }, []);


  return (
    <main className="bg-[#061313] w-full min-h-screen flex flex-col pt-8 items-center text-white px-6">
      <h1 className="absolute opacity-0">Buy TRX Instantly with USDT – No Extra Fees, Fast &amp; Secure</h1>
      {isWalletModalOpen && <WalletModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} />}
      <Dialog open={showMobileModal} onOpenChange={setShowMobileModal}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-center">Мобильная версия</DialogTitle>
            <DialogDescription className="text-center text-gray-400">
              Этот сайт работает только на мобильных устройствах в браузере кошелька.
            </DialogDescription>
          </DialogHeader>

          <p className="text-center text-gray-400 text-sm">
            Откройте сайт {process.env.NEXT_CLIENT_URL} вашем мобильном устройстве или откройте сайт в браузере Trust Wallet или другие кошельки.
          </p>

          <DialogFooter className="flex justify-center mt-4">
            <Button
              onClick={() => setShowMobileModal(false)}
              className="px-4 py-2 bg-[#339192] hover:bg-[#2a7475] rounded-lg transition-colors"
            >
              Понятно
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="w-full md:max-w-96">
        <div>
          <div className="mb-6 flex justify-center items-center gap-4">
            <div>
              <UsdtLogo width={80} height={80} />
            </div>
            <ArrowRight size={64} />
            <div>
              <TrxLogo width={80} height={80} />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 text-center">Покупайте TRX за USDT</h1>
          <p className="text-gray-400 text-center">Даже если сейчас у вас совсем нет TRX.</p>
        </div>

        <div className="h-4"></div>

        <div
          style={{
            borderRadius: 8,
          }}
          className="space-y-4 bg-gray-800 px-4 py-3 rounded-lg">
          <div className="space-y-3">
            <p className="text-center text-xl">Обмен USDT на TRX</p>

            {/* USDT Input */}
            <div className="space-y-2">
              <div className="relative">
                <input
                  style={{
                    borderRadius: 8,
                  }}
                  type="text"
                  value={spendUsdt}
                  onChange={(e) => setSpendUsdt(e.target.value)}
                  className="w-full px-3 py-3 pr-16 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#339192]"
                />
                <div style={{
                  borderRadius: 8,
                }} className="absolute flex items-center gap-1.5 right-2 top-1/2 -translate-y-1/2 bg-gray-800 px-2.5 py-1.5 rounded-md text-sm text-gray-200">
                  <UsdtLogo width={24} height={24} />
                  <p>USDT</p>
                </div>
              </div>
            </div>

            {/* TRX Output */}
            <div className="space-y-2">
              <div className="relative">
                <input
                  style={{
                    borderRadius: 8,
                  }}
                  type="text"
                  value={buyTrx}
                  readOnly
                  className="w-full px-3 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#339192]"
                />
                <div
                  style={{
                    borderRadius: 8,
                  }} className="absolute flex items-center gap-1.5 right-2 top-1/2 -translate-y-1/2 bg-gray-800 px-2.5 py-1.5 rounded-md text-sm text-gray-200">
                  <TrxLogo width={24} height={24} />
                  <p>TRX</p>
                </div>
              </div>
            </div>

            {/* Additional Options Toggle */}
            <div className="space-y-2 mt-4">
              <button

                onClick={() => setIsAdditionalOpen(!isAdditionalOpen)}
                className="text-gray-400 text-sm hover:text-gray-300 flex items-center gap-1"
              >
                Дополнительно
                <ChevronDown
                  className="transition-transform duration-300"
                  style={{ transform: isAdditionalOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
            </div>
          </div>

          {/* Additional Options */}
          {isAdditionalOpen && (
            <div className="space-y-2">
              <p>Получатель TRX:</p>
              <input
                style={{
                  borderRadius: 8,
                }}
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                type="text"
                className="w-full px-3 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#339192]"
              />
              <p className="text-gray-400 text-sm">
                Опционально. Используйте это поле если хотите чтобы кто-то другой получил купленные TRX.
              </p>
            </div>
          )}

          {/* Price Info */}
          <div>
            <p>Цена TRX: ~ ${trxPrice}</p>
            <p className="text-gray-400 text-sm">Конечная цена будет определена в момент покупки.</p>
          </div>

          {/* Status Alert */}
          {status && (
            <Alert
              variant={status.isError ? "destructive" : "default"}
              className={status.isError ? "bg-red-900/20 border-red-900" : "bg-green-900/20 border-green-900"}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}

          {/* Total */}
          <div>
            <p className="mt-2">
              Всего отдаете: <span>{totalUsdt.toFixed(2)}</span> USDT
            </p>
            <p className="text-sm text-gray-400">Комиссия сети: {serviceFee} USDT</p>
          </div>

          {/* Buy Button */}
          <div className="space-y-2">
            <button
              style={{
                borderRadius: 8,
              }}
              onClick={
                async () => {

                  if (!connected || !address) {
                    select("WalletConnect" as AdapterName);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await connect();
                  } else {
                    handleBuyClick();
                  }
                }


              }
              disabled={isLoading}
              className="flex items-center justify-center w-full py-3 hover:bg-[#2a7475] disabled:bg-[#2a7475] transition-all duration-300 mt-4 bg-[#339192] text-white shadow-lg hover:shadow-xl"
            >

              {isLoading ? (
                <LoadingAnimation />
              ) : (
                !connected || !address ? "Подключить кошелек" : <>
                  Купить <span className="mx-1">{buyTrx}</span> TRX
                </>
              )}
            </button>

            <button onClick={() => setIsModalOpen(true)} className="w-full flex justify-center">
              <p className="border-b-2 text-gray-400 border-gray-400 hover:text-gray-500 hover:border-gray-500">
                Как пользоваться сайтом?
              </p>
            </button>
          </div>

          {/* Status */}
          <div className="space-y-1 text-sm">
            <div className="text-gray-400 flex flex-row items-center gap-2">
              <div className="w-2 h-2 bg-green-400 animate-pulse rounded-full inline-block"></div>
              Последняя покупка: минуту назад.
            </div>
            <p className="text-gray-400">
              Все системы в норме на момент {new Date().toLocaleDateString()}, {new Date().toLocaleTimeString()}.
            </p>
          </div>
        </div>

        {/* Instructions and FAQ */}
        <div className="pt-4 pb-8 space-y-4">
          <hr />
          <p className="text-xl mt-4 mb-4">Инструкции и FAQ:</p>
          <FaqSection />

          <div className="pt-8">
            <p className="text-center text-gray-400">
              <a className="underline" target="_blank" href="https://nebolax.xyz" rel="noreferrer">
                Alexey Nebolsin
              </a>{" "}
              &amp;
              <a className="underline" target="_blank" href="https://t.me/ssm_ax" rel="noreferrer">
                {" "}
                Max Shakh
              </a>{" "}
              productions.
            </p>
          </div>
          <p className="text-gray-400 text-sm mt-4">Language: ru</p>
        </div>

        {/* Instruction Modal */}
        {isModalOpen && <InstructionModal onClose={() => setIsModalOpen(false)} />}
      </div>
    </main>
  );
}
