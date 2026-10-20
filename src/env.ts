import { cleanEnv, str, port } from "envalid";

export const env = cleanEnv(process.env, {
    DATABASE_URL: str({ desc: "Connection string to our Postgres database" }),
    PORT: port({ default: 3000 }),
});