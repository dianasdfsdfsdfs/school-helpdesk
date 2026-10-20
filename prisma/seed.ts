import { faker } from "@faker-js/faker";
import { env } from "../src/env";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const database = new PrismaClient({ adapter });

const users = await database.user.findMany({ where: { role: "USER" } });
if (users.length === 0) throw new Error("No USER in the database, register one first");

await database.category.createMany({
    data: [{ name: "Elektrina" }, { name: "Nábytok" }, { name: "IT technika" }],
    skipDuplicates: true,
});
const categories = await database.category.findMany();

const result = await database.ticket.createMany({
    data: Array.from({ length: 500 }, () => ({
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
        createdAt: faker.date.recent({ days: 30 }),
        authorId: faker.helpers.arrayElement(users).id,
        categoryId: faker.helpers.arrayElement(categories).id,
    })),
});

console.log(`Created tickets: ${result.count}`);

await database.$disconnect();
