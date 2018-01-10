import * as cors from "cors";
import * as logger from "winston";
import { ApplicationWrapper } from "./bootstrap/application-wrapper";
import { SocketIOManager } from "./bootstrap/socket-io-wrapper";
import { IConfig, ProductionConfig } from "./config/index"; //класс порта

let config: IConfig = new ProductionConfig();

let appWrapper = new ApplicationWrapper(config);
let socketIOWrapper = new SocketIOManager(appWrapper.Server);

appWrapper.configure((app) => {
    app.use(cors());
});

appWrapper.start();
socketIOWrapper.start();

process.on("SIGTERM", () => {
    logger.info("Gracefully terminating");
    process.exit();
});
process.on("uncaughtException", (exception: Error) => {
    logger.error(exception.toString());
    logger.info(`Server stopped because of: ${exception.message}`);
    throw exception;
});
