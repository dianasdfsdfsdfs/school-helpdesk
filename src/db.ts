import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "../generated/prisma8/contract.d";
import contractJson from "../generated/prisma8/contract.json" with { type: "json" };
import { env } from "bun";

export const db = postgres<Contract>({ url: env.DATABASE_URL!, contractJson });
