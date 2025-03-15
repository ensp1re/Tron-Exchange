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
        { success: false, error: "Invalid recipient address or amount" },
        { status: 400 }
      );
    }

    // Rate limiting - prevent frequent duplicate transactions
    const now = Date.now();
    if (
      lastTransactions[toAddress] &&
      now - lastTransactions[toAddress] < 5000
    ) {
      return NextResponse.json(
        { success: false, error: "Wait before sending again" },
        { status: 429 }
      );
    }
    lastTransactions[toAddress] = now;

    // Check TRX balance
    const balance = await tronWeb.trx.getBalance(fromAddress);
    const amountSun = tronWeb.toSun(amount);

    if (balance < Number(amountSun)) {
      return NextResponse.json(
        { success: false, error: "Insufficient TRX balance" },
        { status: 400 }
      );
    }

    // Create and send transaction
    const transaction = await tronWeb.transactionBuilder.sendTrx(
      toAddress,
      Number(amountSun),
      fromAddress
    );
    const signedTransaction = await tronWeb.trx.sign(transaction);
    const response = await tronWeb.trx.sendRawTransaction(signedTransaction);

    if (!response.result) {
      throw new Error(`Transaction failed: ${JSON.stringify(response)}`);
    }

    console.log(
      `[${new Date().toISOString()}] Sent TRX to: ${toAddress} | Amount: ${amount} | TxID: ${
        response.txid
      }`
    );

    return NextResponse.json({ success: true, txid: response.txid });
  } catch (error) {
    console.error("Error sending TRX:", error);

    let errorMessage = "Internal server error";
    let statusCode = 500;

    if (error instanceof SyntaxError) {
      errorMessage = "Invalid JSON payload";
      statusCode = 400;
    } else if (
      error instanceof Error &&
      error.message.includes("Invalid recipient address or amount")
    ) {
      errorMessage = "Invalid recipient address or amount";
      statusCode = 400;
    } else if (
      error instanceof Error &&
      error.message.includes("Wait before sending again")
    ) {
      errorMessage = "Wait before sending again";
      statusCode = 429;
    } else if (
      error instanceof Error &&
      error.message.includes("Insufficient TRX balance")
    ) {
      errorMessage = "Insufficient TRX balance";
      statusCode = 400;
    } else if (
      error instanceof Error &&
      error.message.includes("Transaction failed")
    ) {
      errorMessage = "Transaction failed";
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
