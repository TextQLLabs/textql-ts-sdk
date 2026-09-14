import { createService } from "./server.js";
import { loadConfig } from "./sdk.js";

const config = loadConfig();
const server = createService(config);
server.listen(config.port, "127.0.0.1", () => {
  console.log(`Private SDK service listening on 127.0.0.1:${config.port}`);
});

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  });
}
