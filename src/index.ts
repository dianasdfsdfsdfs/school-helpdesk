import { Elysia, t } from "elysia";
import { db } from "./db";
import { auth } from "./auth";

const publicUserFields = ["id", "email", "name", "role"] as const;

const ticketsWithRelations = db.orm.public.Ticket.include("category").include(
  "author",
  (author) => author.select(...publicUserFields)
);

const app = new Elysia()
  .use(auth)
  .get("/", () => "Hello Elysia")

  .post(
    "/register",
    async ({ body, status }) => {
      const existing = await db.orm.public.User.first({ email: body.email });
      if (existing) {
        return status(409, { message: "User already exists." });
      }

      const user = await db.orm.public.User.select(...publicUserFields).create({
        email: body.email,
        password: await Bun.password.hash(body.password),
        name: body.name,
        role: "USER",
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
      const user = await db.orm.public.User.first({ email: body.email });
      if (!user || !(await Bun.password.verify(body.password, user.password))) {
        return status(401, { message: "Wrong email or password." });
      }

      const token = crypto.randomUUID();
      await db.orm.public.User.where({ id: user.id }).update({ token });

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
      await db.orm.public.User.where({ id: user.id }).update({ token: null });
      return { message: "Logged out." };
    },
    { isAuthenticated: true }
  )

  .get("/categories", () => db.orm.public.Category.all(), {
    isAuthenticated: true,
  })

  .post(
    "/categories",
    async ({ body, status }) => {
      const existing = await db.orm.public.Category.first({ name: body.name });
      if (existing) {
        return status(409, { message: "Category already exists." });
      }

      const category = await db.orm.public.Category.create({ name: body.name });
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
      const category = await db.orm.public.Category.include("tickets", (tickets) =>
        tickets.count()
      ).first({ id: params.id });
      if (!category) {
        return status(404, { message: "Category not found." });
      }
      if (category.tickets > 0) {
        return status(409, { message: "Category has tickets, delete them first." });
      }

      await db.orm.public.Category.where({ id: params.id }).delete();
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
      const category = await db.orm.public.Category.first({ id: body.categoryId });
      if (!category) {
        return status(404, { message: "Category not found." });
      }

      const ticket = await ticketsWithRelations.create({
        title: body.title,
        description: body.description,
        room: body.room,
        categoryId: body.categoryId,
        authorId: user.id,
        status: "NEW",
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
    ({ user }) => {
      const tickets =
        user.role === "ADMIN"
          ? ticketsWithRelations
          : ticketsWithRelations.where({ authorId: user.id });
      return tickets.orderBy((ticket) => ticket.createdAt.desc()).all();
    },
    { isAuthenticated: true }
  )

  .patch(
    "/tickets/:id/status",
    async ({ params, body, status }) => {
      const ticket = await ticketsWithRelations
        .where({ id: params.id })
        .update({ status: body.status });
      if (!ticket) {
        return status(404, { message: "Ticket not found." });
      }

      return ticket;
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
      const ticket = await db.orm.public.Ticket.where({ id: params.id }).delete();
      if (!ticket) {
        return status(404, { message: "Ticket not found." });
      }

      return { message: "Ticket deleted." };
    },
    {
      isAdmin: true,
      params: t.Object({ id: t.Numeric() }),
    }
  )

  .listen(process.env.PORT ?? 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
