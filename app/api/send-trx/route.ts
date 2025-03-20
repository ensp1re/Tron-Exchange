/* eslint-disable @typescript-eslint/no-require-imports */
import { NextResponse } from "next/server";
const { TronWeb } = require("tronweb");

// Ensure environment variables are set in production
if (
  !process.env.NEXT_TRON_PRIVATE_KEY ||
  !process.env.NEXT_TRON_ADDRESS ||
  !process.env.NEXT_TRONGRID_API_KEY
) {
  throw new Error(
    "Missing required environment variables for TRON configuration."
  );
}

const privateKey = process.env.NEXT_TRON_PRIVATE_KEY!;
const fromAddress = process.env.NEXT_TRON_ADDRESS!;
const apiKey = process.env.NEXT_TRONGRID_API_KEY!;

// Rate limiting store (in production, use Redis or a database)
const lastTransactions: Record<string, number> = {};

// Initialize TronWeb once
const tronWeb = new TronWeb({
  fullHost: "https://api.trongrid.io",
  headers: { "TRON-PRO-API-KEY": apiKey },
  privateKey: privateKey,
});

export async function POST(request: Request) {
  try {
    const data = await request.json();

    console.log("Received request:", data);

    // Validate input parameters
    const toAddress: string = data.recipient;
    const amount: number = Number.parseFloat(data.amount);

    if (!tronWeb.isAddress(toAddress) || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Неверный адрес получателя или сумма" },
        { status: 400 }
      );
    }

    // Ограничение частоты - предотвращение частых дублирующих транзакций
    const now = Date.now();
    if (
      lastTransactions[toAddress] &&
      now - lastTransactions[toAddress] < 5000
    ) {
      return NextResponse.json(
        { success: false, error: "Подождите перед повторной отправкой" },
        { status: 429 }
      );
    }
    lastTransactions[toAddress] = now;

    // Проверка баланса TRX
    const balance = await tronWeb.trx.getBalance(fromAddress);
    const amountSun = tronWeb.toSun(amount);

    if (balance < Number(amountSun)) {
      return NextResponse.json(
        { success: false, error: "Недостаточный баланс TRX" },
        { status: 400 }
      );
    }

    // Создание и отправка транзакции
    const transaction = await tronWeb.transactionBuilder.sendTrx(
      toAddress,
      Number(amountSun),
      fromAddress
    );
    const signedTransaction = await tronWeb.trx.sign(transaction);
    const response = await tronWeb.trx.sendRawTransaction(signedTransaction);

    if (!response.result) {
      throw new Error(`Транзакция не удалась: ${JSON.stringify(response)}`);
    }

    console.log(
      `[${new Date().toISOString()}] Отправлено TRX на: ${toAddress} | Сумма: ${amount} | TxID: ${
        response.txid
      }`
    );

    return NextResponse.json({ success: true, txid: response.txid });
  } catch (error) {
    console.error("Ошибка при отправке TRX:", error);

    let errorMessage = "Внутренняя ошибка сервера";
    let statusCode = 500;

    if (error instanceof SyntaxError) {
      errorMessage = "Неверный JSON формат";
      statusCode = 400;
    } else if (
      error instanceof Error &&
      error.message.includes("Invalid recipient address or amount")
    ) {
      errorMessage = "Неверный адрес получателя или сумма";
      statusCode = 400;
    } else if (
      error instanceof Error &&
      error.message.includes("Wait before sending again")
    ) {
      errorMessage = "Подождите перед повторной отправкой";
      statusCode = 429;
    } else if (
      error instanceof Error &&
      error.message.includes("Insufficient TRX balance")
    ) {
      errorMessage = "Недостаточный баланс TRX";
      statusCode = 400;
    } else if (
      error instanceof Error &&
      error.message.includes("Transaction failed")
    ) {
      errorMessage = "Транзакция не удалась";
      statusCode = 500;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: statusCode }
    );
  }
}
