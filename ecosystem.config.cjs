/**
 * PM2 ecosystem config — Oracle Cloud VPS deployment
 * Usage:
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup
 */

module.exports = {
  apps: [
    {
      name:        "vaulted",
      script:      "node_modules/.bin/next",
      args:        "start",
      cwd:         "/home/ubuntu/vaulted",
      instances:   1,
      autorestart: true,
      watch:       false,
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
        PORT:     "3000",
      },
    },
    {
      name:        "vaulted-cron",
      script:      "scripts/cron.js",
      cwd:         "/home/ubuntu/vaulted",
      interpreter: "node",
      interpreter_args: "--experimental-vm-modules",
      instances:   1,
      autorestart: true,
      watch:       false,
      max_memory_restart: "100M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
