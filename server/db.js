import { createClient } from "@libsql/client";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from the same directory as this file
dotenv.config({ path: path.join(__dirname, '.env') });

export const db = createClient(
    (process.env.TURSO_DATABASE_URL && process.env.TURSO_DATABASE_URL.trim() !== "")
        ? {
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN
          }
        : {
            url: `file:${path.join(__dirname, 'local.db')}`
          }
);
