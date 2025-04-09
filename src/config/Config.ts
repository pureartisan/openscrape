import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

const configSchema = z
  .object({
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  })
  .passthrough();

class Config {
  logLevel: string = "info";

  init() {
    const parsedConfig = configSchema.parse(process.env);
    this.logLevel = parsedConfig.LOG_LEVEL;
  }
}

const singleton = new Config();
export { singleton as Config };
