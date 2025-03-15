/* eslint-disable @typescript-eslint/no-require-imports */

const { TronWeb } = require("tronweb");

const fullNode = "https://api.trongrid.io";
const apiKey =
  process.env.NEXT_PUBLIC_TRONGRID_API_KEY ||
  "1e0828cd-9eab-4e80-9dd6-b76672882e8d";

// Initialize TronWeb
const tronWeb = new TronWeb({
  fullHost: fullNode,
  headers: { "TRON-PRO-API-KEY": apiKey },
});

export { tronWeb };
