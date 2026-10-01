import { bot } from './app.js';
import { env } from './config/env.js';

async function bootstrap() {
  console.log('⚡ Starting Activity Engine Discord Bot...');
  console.log(`🌍 Environment: ${env.NODE_ENV}`);

  await bot.start();

  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    await bot.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('Fatal startup error in Activity Engine:', err);
  process.exit(1);
});
