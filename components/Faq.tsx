"use client"

import type React from "react"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

interface FaqItem {
    id: string
    question: string
    answer: React.ReactNode
}

export default function FaqSection() {
    const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

    const toggleItem = (id: string) => {
        setOpenItems((prev) => ({
            ...prev,
            [id]: !prev[id],
        }))
    }

    const faqItems: FaqItem[] = [
        {
            id: "security",
            question: "1. Насколько безопасно подключать кошелек к сайту?",
            answer:
                "Подключение кошелька показывает сайту адрес вашего кошелька, но не дает разрешения списывать средства. Это стандартная практика для децентрализованных приложений.",
        },
        {
            id: "trust",
            question: "2. Почему я должен доверять buytrx.org?",
            answer:
                "Вам нужно доверять сайту только в момент совершения покупки. buytrx.org получает доступ только к той сумме USDT, которую вы обмениваете. Все остальные средства всегда остаются в вашем кошельке.",
        },
        {
            id: "wallets",
            question: "3. Какие кошельки вы поддерживаете?",
            answer: "buytrx.org поддерживает главные Tron (TRC-20) кошельки: TronLink и Trust Wallet.",
        },
        {
            id: "kyc",
            question: "4. Есть ли KYC?",
            answer:
                "Нет. Так как buytrx.org основан на децентрализованных технологиях, мы не заправшиваем никаких документов или личной информации.",
        },
        {
            id: "trx-required",
            question: "5. Нужно ли иметь TRX в кошельке для пользования сайтом?",
            answer:
                "Нет. На buytrx.org все комиссии платятся в USDT. buytrx.org сделан специально для случая когда у пользователя есть USDT в кошельке, но нету TRX.",
        },
        {
            id: "speed",
            question: "6. Насколько быстр процесс покупки?",
            answer: "Если ничего не идет не так, то обмен совершается в течение 10 секунд.",
        },
        {
            id: "docs",
            question: "7. Есть ли у вас инструкции и документация?",
            answer:
                "Да. На docs.buytrx.org есть инструкции по использованию buytrx.org с каждым из поддерживаемых кошельков.",
        },
        {
            id: "referral",
            question: "8. Есть ли у вас реферальная программа?",
            answer: (
                <>
                    Да. Вы можете получать 50% от ПОЖИЗНЕННОЙ выручки, генерируемой пользователями, которых вы пригласите.
                    Создайте реферальную ссылку{" "}
                    <a href="https://buytrx.org/referral/create" target="_blank" className="underline" rel="noreferrer">
                        здесь
                    </a>
                    . Отслеживайте свой заработок{" "}
                    <a href="https://buytrx.org/referral/manage" target="_blank" className="underline" rel="noreferrer">
                        здесь
                    </a>
                    .
                </>
            ),
        },
        {
            id: "contact",
            question: "9. Как с вами связаться?",
            answer: "Вы можете связаться с создателем buytrx.org в X (Твиттер) или Телеграме по юзернейму @nebolax0.",
        },
    ]

    return (
        <div className="space-y-2">
            {faqItems.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-700">
                    <div className="p-4 space-y-2">
                        <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleItem(item.id)}>
                            <p className="inline">{item.question}</p>
                            <ChevronDown
                                className="w-10 transition-transform duration-300"
                                style={{ transform: openItems[item.id] ? "rotate(180deg)" : "rotate(0deg)" }}
                            />
                        </div>
                        {openItems[item.id] && <p className="text-gray-400 word-break w-fit">{item.answer}</p>}
                    </div>
                </div>
            ))}
        </div>
    )
}

