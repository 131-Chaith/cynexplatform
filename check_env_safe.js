import dotenv from 'dotenv';
dotenv.config();

const output = [];
output.push("Checking environment variables...");
output.push("TURSO_DATABASE_URL: " + (process.env.TURSO_DATABASE_URL ? "Exists (" + process.env.TURSO_DATABASE_URL.substring(0, 10) + "...)" : "MISSING"));
output.push("TURSO_AUTH_TOKEN: " + (process.env.TURSO_AUTH_TOKEN ? "Exists (length: " + process.env.TURSO_AUTH_TOKEN.length + ")" : "MISSING"));
output.push("JWT_SECRET: " + (process.env.JWT_SECRET ? "Exists" : "MISSING (using default)"));

console.log(output.join("\n"));
