/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

const API_KEY = process.env.NEXT_ITRX_API_KEY!;
const API_SECRET =
  process.env.NEXT_ITRX_API_SECRET!;

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const recipient = data.recipient;
    const amount = Number.parseInt(data.amount) || 0;

    if (
      !recipient ||
      !recipient.match(/^T[a-zA-Z0-9]{33}$/) ||
      amount < 10000 ||
      amount > 66000
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid recipient address or amount",
        },
        { status: 400 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000) - 1;

    const requestData = {
      energy_amount: amount,
      period: "1H",
      receive_address: recipient,
      callback_url: `${process.env.NEXT_CLIENT_URL}/callback`,
      out_trade_no: crypto.randomUUID(),
    };

    const sortedData = Object.keys(requestData)
      .sort()
      .reduce((obj: any, key: string) => {
        obj[key] = (requestData as any)[key];
        return obj;
      }, {});

    const jsonData = JSON.stringify(sortedData);

    const encoder = new TextEncoder();
    const data1 = encoder.encode(`${timestamp}&${jsonData}`);
    const keyData = encoder.encode(API_SECRET);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", cryptoKey, data1);

    const signatureArray = Array.from(new Uint8Array(signature));
    const signatureHex = signatureArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const response = await fetch("https://itrx.io/api/v1/frontend/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "API-KEY": API_KEY,
        TIMESTAMP: timestamp.toString(),
        SIGNATURE: signatureHex,
      },
      body: jsonData,
    });

    const result = await response.text();

    console.log(
      `[${new Date().toISOString()}] Sent Energy to: ${recipient} | Amount: ${amount} | HTTP Code: ${
        response.status
      } | Response: ${result}`
    );

    return NextResponse.json({
      success: response.status === 200,
      message:
        response.status === 200
          ? "Energy sent successfully"
          : "Failed to send Energy",
      response: result,
    });
  } catch (error) {
    console.error("Error sending energy:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
