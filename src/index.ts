import { Elysia, t } from "elysia";
import { prisma } from "./db";
import { auth } from "./auth";

const publicUser = { id: true, email: true, name: true, role: true };

const app = new Elysia()
  .use(auth)
  .get("/", () => "Hello Elysia")

  .post(
    "/register",
    async ({ body, status }) => {
      const existing = await prisma.user.findUnique({
        where: { email: body.email },
      });
      if (existing) {
        return status(409, { message: "User already exists." });
      }

      const user = await prisma.user.create({
        data: {
          email: body.email,
          password: await Bun.password.hash(body.password),
          name: body.name,
          role: "USER",
        },
        select: publicUser,
      });

      return user;
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
        name: t.String({ minLength: 1 }),
      }),
    }
  )

  .post(
    "/login",
    async ({ body, status }) => {
      const user = await prisma.user.findUnique({
        where: { email: body.email },
      });
      if (!user || !(await Bun.password.verify(body.password, user.password))) {
        return status(401, { message: "Wrong email or password." });
      }

      const token = crypto.randomUUID();
      await prisma.user.update({ where: { id: user.id }, data: { token } });

      return { token };
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )

  .post(
    "/logout",
    async ({ user }) => {
      await prisma.user.update({ where: { id: user.id }, data: { token: null } });
      return { message: "Logged out." };
    },
    { isAuthenticated: true }
  )

  .get("/categories", () => prisma.category.findMany(), {
    isAuthenticated: true,
  })

  .post(
    "/categories",
    async ({ body, status }) => {
      const existing = await prisma.category.findUnique({
        where: { name: body.name },
      });
      if (existing) {
        return status(409, { message: "Category already exists." });
      }

      const category = await prisma.category.create({ data: { name: body.name } });
      return status(201, category);
    },
    {
      isAdmin: true,
      body: t.Object({ name: t.String({ minLength: 1 }) }),
    }
  )

  .delete(
    "/categories/:id",
    async ({ params, status }) => {
      const category = await prisma.category.findUnique({
        where: { id: params.id },
        include: { _count: { select: { tickets: true } } },
      });
      if (!category) {
        return status(404, { message: "Category not found." });
      }
      if (category._count.tickets > 0) {
        return status(409, { message: "Category has tickets, delete them first." });
      }

      await prisma.category.delete({ where: { id: params.id } });
      return { message: "Category deleted." };
    },
    {
      isAdmin: true,
      params: t.Object({ id: t.Numeric() }),
    }
  )

  .post(
    "/tickets",
    async ({ body, user, status }) => {
      const category = await prisma.category.findUnique({
        where: { id: body.categoryId },
      });
      if (!category) {
        return status(404, { message: "Category not found." });
      }

      const ticket = await prisma.ticket.create({
        data: {
          title: body.title,
          description: body.description,
          room: body.room,
          categoryId: body.categoryId,
          authorId: user.id,
          status: "NEW",
        },
        include: { category: true, author: { select: publicUser } },
      });

      return status(201, ticket);
    },
    {
      isAuthenticated: true,
      body: t.Object({
        title: t.String({ minLength: 1 }),
        description: t.String({ minLength: 1 }),
        room: t.String({ minLength: 1 }),
        categoryId: t.Integer(),
      }),
    }
  )

  .get(
    "/tickets",
    ({ user }) =>
      prisma.ticket.findMany({
        where: user.role === "ADMIN" ? {} : { authorId: user.id },
        include: { category: true, author: { select: publicUser } },
        orderBy: { createdAt: "desc" },
      }),
    { isAuthenticated: true }
  )

  .patch(
    "/tickets/:id/status",
    async ({ params, body, status }) => {
      const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
      if (!ticket) {
        return status(404, { message: "Ticket not found." });
      }

      return prisma.ticket.update({
        where: { id: params.id },
        data: { status: body.status },
        include: { category: true, author: { select: publicUser } },
      });
    },
    {
      isAdmin: true,
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        status: t.UnionEnum(["NEW", "IN_PROGRESS", "DONE"]),
      }),
    }
  )

  .delete(
    "/tickets/:id",
    async ({ params, status }) => {
      const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
      if (!ticket) {
        return status(404, { message: "Ticket not found." });
      }

      await prisma.ticket.delete({ where: { id: params.id } });
      return { message: "Ticket deleted." };
    },
    {
      isAdmin: true,
      params: t.Object({ id: t.Numeric() }),
    }
  )

  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
