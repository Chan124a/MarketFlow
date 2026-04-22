"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const adapter_1 = require("./websocket/adapter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    app.useWebSocketAdapter(new adapter_1.WebSocketAdapter(app));
    await app.listen(3001);
    console.log('Backend: http://localhost:3001');
}
bootstrap();
//# sourceMappingURL=main.js.map