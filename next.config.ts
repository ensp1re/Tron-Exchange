import { NextConfig } from "next";

const config: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  env: {
    NEXT_ITRX_API_KEY: process.env.NEXT_ITRX_API_KEY,
    NEXT_ITRX_API_SECRET: process.env.NEXT_ITRX_API_SECRET,
    NEXT_CLIENT_URL: process.env.NEXT_CLIENT_URL,
    NEXT_TRON_PRIVATE_KEY: process.env.NEXT_TRON_PRIVATE_KEY,
    NEXT_TRON_ADDRESS: process.env.NEXT_TRON_ADDRESS,
    NEXT_TRONGRID_API_KEY: process.env.NEXT_TRONGRID_API_KEY,
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  },
};

export default config;
