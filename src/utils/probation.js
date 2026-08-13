export const PROBATION_MONTHS = 3;

export function getProbationEndDate(joiningDate) {
    if (!joiningDate) return null;
    const end = new Date(joiningDate);
    end.setMonth(end.getMonth() + PROBATION_MONTHS);
    return end;
}

export function isOnProbation(joiningDate) {
    const end = getProbationEndDate(joiningDate);
    if (!end) return false;
    return new Date() < end;
}