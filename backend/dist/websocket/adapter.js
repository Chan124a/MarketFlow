"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketAdapter = void 0;
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
class WebSocketAdapter extends platform_socket_io_1.IoAdapter {
    constructor(app) {
        super(app);
    }
}
exports.WebSocketAdapter = WebSocketAdapter;
//# sourceMappingURL=adapter.js.map