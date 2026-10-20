import { describe, expect, test } from "bun:test"
import { canEditSurvey, canFillSurvey } from "./rules"

describe("canFillSurvey", () => {
    const ok = { isActive: true, isAssigned: true, isCompleted: false }

    test("smie vyplniť, keď je aktívny, priradený a nedokončený", () => {
        expect(canFillSurvey(ok)).toBe(true)
    })

    test("nesmie vyplniť, keď dotazník nie je aktívny", () => {
        expect(canFillSurvey({ ...ok, isActive: false })).toBe(false)
    })

    test("nesmie vyplniť, keď naň nie je priradený", () => {
        expect(canFillSurvey({ ...ok, isAssigned: false })).toBe(false)
    })

    test("nesmie vyplniť, keď ho už dokončil", () => {
        expect(canFillSurvey({ ...ok, isCompleted: true })).toBe(false)
    })
})

describe("canEditSurvey", () => {
    test("admin smie meniť, keď dotazník nie je aktivovaný", () => {
        expect(canEditSurvey({ isActivated: false })).toBe(true)
    })

    test("admin nesmie meniť, keď je dotazník aktivovaný", () => {
        expect(canEditSurvey({ isActivated: true })).toBe(false)
    })
})
