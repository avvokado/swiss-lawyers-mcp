import { httpServer } from "./dist/src/server/http.js";
import { appConfig } from "./dist/src/config/env.js";

const port = Number(process.env.PORT || appConfig.port);
const host = process.env.HOST || "0.0.0.0";

httpServer.listen(port, host, () => {
  console.log(
    `${appConfig.serverName} listening on http://${host}:${port}/mcp`,
  );
});
