export const telegramConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN!,
  botChatId: process.env.TELEGRAM_BOT_CHAT_ID!,
  webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET!,
  webhookUrl: process.env.TELEGRAM_WEBHOOK_URL!,
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  requestTimeout: 30000, // 30 seconds
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ],
  scoreFormat: {
    separator: '|',
    fields: ['requestId', 'aiScore', 'plagiarismScore', 'aiReportUrl', 'plagiarismReportUrl']
  }
} as const;

// Validation function for environment variables
export function validateTelegramConfig(): void {
  const requiredEnvVars = [
    'TELEGRAM_BOT_TOKEN',
    'TELEGRAM_BOT_CHAT_ID',
    'TELEGRAM_WEBHOOK_SECRET',
    'TELEGRAM_WEBHOOK_URL'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables for Telegram integration: ${missingVars.join(', ')}`
    );
  }
}
