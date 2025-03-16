/* eslint-disable @typescript-eslint/no-require-imports */

const { TronWeb } = require("tronweb");

const fullNode = "https://api.trongrid.io";
const apiKey = process.env.NEXT_PUBLIC_TRONGRID_API_KEY!;

// Initialize TronWeb
const tronWeb = new TronWeb({
  fullHost: fullNode,
  headers: { "TRON-PRO-API-KEY": apiKey },
});

export { tronWeb };
