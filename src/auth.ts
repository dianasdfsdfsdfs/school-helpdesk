import { Elysia } from "elysia";
import { db } from "./db";

async function findUserByToken(authorization?: string) {
  const token = authorization?.replace("Bearer ", "");
  if (!token) return null;
  return db.orm.public.User.first({ token });
}

export const auth = new Elysia({ name: "auth" }).macro({
  isAuthenticated: {
    async resolve({ headers, status }) {
      const user = await findUserByToken(headers.authorization);
      if (!user) return status(401, { message: "Not logged in." });
      return { user };
    },
  },

  isAdmin: {
    async resolve({ headers, status }) {
      const user = await findUserByToken(headers.authorization);
      if (!user) return status(401, { message: "Not logged in." });
      if (user.role !== "ADMIN") return status(403, { message: "Admins only." });
      return { user };
    },
  },
});
