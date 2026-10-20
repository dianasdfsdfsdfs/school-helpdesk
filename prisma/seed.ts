import { faker } from "@faker-js/faker";
import type { TimestampString } from "@prisma/orm-postgres/target/codec-types";
import { db } from "../src/db";

const users = await db.orm.public.User.where({ role: "USER" }).all();
if (users.length === 0) throw new Error("No USER in the database, register one first");

await db.orm.public.Category.createAll(
    [{ name: "Elektrina" }, { name: "Nábytok" }, { name: "IT technika" }],
    { onConflict: "skip" },
);
const categories = await db.orm.public.Category.all();

const count = await db.orm.public.Ticket.createAndCount(
    Array.from({ length: 500 }, () => ({
        title: faker.helpers.arrayElement([
            "Nefunguje projektor",
            "Rozbitá stolička",
            "Nesvieti svetlo",
            "Nejde internet",
            "Pokazená tabuľa",
        ]),
        description: faker.lorem.sentence(),
        room: String(faker.number.int({ min: 100, max: 399 })),
        status: faker.helpers.arrayElement(["NEW", "IN_PROGRESS", "DONE"] as const),
        createdAt: faker.date
            .recent({ days: 30 })
            .toISOString()
            .replace("T", " ")
            .replace("Z", "") as TimestampString<3>,
        authorId: faker.helpers.arrayElement(users).id,
        categoryId: faker.helpers.arrayElement(categories).id,
    })),
);

console.log(`Created tickets: ${count}`);

await db.close();
