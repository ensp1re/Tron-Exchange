"use client"

import { X } from "lucide-react"

interface InstructionModalProps {
    onClose: () => void
}

export default function InstructionModal({ onClose }: InstructionModalProps) {
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
            <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 bg-gray-800 text-white rounded-lg">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold mb-4">Как пользоваться сайтом?</h2>
                </div>
                <p>
                    <span className="text-xl">Поддерживаемые кошельки</span>
                    <br />
                    <span className="text-gray-400">buytrx.org работает с Trust Wallet и TronLink.</span>
                </p>
                <p>
                    <span className="text-xl">Краткая инструкция:</span>
                    <br />
                    <span className="text-gray-400">
                        1. Откройте buytrx.org во встроенном браузере вашего кошелька.
                        <br />
                        2. Введите сколько TRX вы хотите купить.
                        <br />
                        3. Нажмите &quot;Купить&quot;.
                        <br />
                        4. Подключите кошелек.
                        <br />
                        5. Подтвердите перевод USDT.
                    </span>
                </p>
                <hr />
                <p className="text-gray-400">
                    Смотрите подробную видео инструкцию{" "}
                    <a className="underline" href="https://www.youtube.com/playlist?list=PLnr4C8ZUG7OHUdcr3TiLVJUdOpUCi6Z1f">
                        в этом YouTube плейлисте.
                    </a>
                </p>
                <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-500">
                    <X size={24} />
                </button>
            </div>
        </div>
    )
}

