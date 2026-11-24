export function isPostalCodeJP(value) {
    return /^\d{3}-?\d{4}$/.test(value);
}
export function isMobilePhoneJP(value) {
    return /^(070|080|090)-?\d{4}-?\d{4}$/.test(value);
}
export function isPhoneNumberJP(value) {
    return /^(0\d{1,4}-?\d{1,4}-?\d{4}|0\d{9,10})$/.test(value);
}
export function isStrictPhoneNumberJP(value) {
    return (/^(?:070|080|090|050)(-?)\d{4}\1\d{4}$/.test(value) ||
        /^0120(-?)\d{3}\1\d{3}$/.test(value) ||
        /^0800(-?)\d{3}\1\d{4}$/.test(value));
}
export function isKatakana(value) {
    return /^[ァ-ヶー・\s　]+$/.test(value);
}
export function isFurigana(value) {
    return /^[ァ-ヶー・ 　]+$/.test(value) && /[ァ-ヶ]/.test(value);
}
export function isZenkaku(value) {
    return value.length > 0 && !/[ -~]/.test(value);
}
