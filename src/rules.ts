export type Survey = {
    isActive: boolean
    isAssigned: boolean
    isCompleted: boolean
}

export function canFillSurvey(survey: Survey): boolean {
    return survey.isActive && survey.isAssigned && !survey.isCompleted
}

export function canEditSurvey(survey: { isActivated: boolean }): boolean {
    return !survey.isActivated
}
