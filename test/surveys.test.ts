import { describe, expect, test } from "bun:test"
import { Elysia, t } from "elysia"

const app = new Elysia().post(
    "/surveys",
    () => ({ status: "success" }),
    {
        body: t.Object({
            title: t.String({ minLength: 1 }),
            description: t.String(),
        }),
    },
)

function createSurvey(body: object) {
    return app.handle(
        new Request("http://localhost/surveys", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        }),
    )
}

describe("POST /surveys", () => {
    test("vráti 422, keď je body prázdne", async () => {
        const response = await createSurvey({})
        expect(response.status).toBe(422)
    })

    test("vráti 422, keď je title prázdny", async () => {
        const response = await createSurvey({ title: "", description: "Popis" })
        expect(response.status).toBe(422)
    })

    test("vráti 200 a status success pri platnom body", async () => {
        const response = await createSurvey({ title: "Spätná väzba", description: "Popis" })
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({ status: "success" })
    })
})
