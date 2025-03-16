module.exports = {
  apps: [
    {
      name: "tronup",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        HOST: "0.0.0.0", // Bind to all interfaces
      },
    },
  ],
};
