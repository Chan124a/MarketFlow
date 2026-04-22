import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WebSocketAdapter } from './websocket/adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useWebSocketAdapter(new WebSocketAdapter(app));
  await app.listen(3001);
  console.log('Backend: http://localhost:3001');
}
bootstrap();