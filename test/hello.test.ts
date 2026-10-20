import { describe, expect, test } from "bun:test"
import { Elysia, t } from "elysia"

const app = new Elysia().post(
    "/hello",
    ({ body }) => ({ status: "success", message: `Ahoj ${body.name}` }),
    { body: t.Object({ name: t.String({ minLength: 1 }) }) },
    )

    describe("POST /hello", () => {
    test("vráti 422 keď body je prázdne", async () => {
        const response = await app.handle(
        new Request("http://localhost/hello", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        }),
        )

        expect(response.status).toBe(422)
    })
})