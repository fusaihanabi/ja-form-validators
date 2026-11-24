import { landlineAreaCodeRules, landlineNumberPattern } from "./landline-metadata.js";
export function isPostalCodeJP(value) {
    return /^\d{3}-?\d{4}$/.test(value);
}
export function isMobilePhoneJP(value) {
    return /^(070|080|090)-?\d{4}-?\d{4}$/.test(value);
}
export function isPhoneNumberJP(value) {
    return /^(0\d{1,4}-?\d{1,4}-?\d{4}|0\d{9,10})$/.test(value);
}
export function isLandlinePhoneJP(value) {
    const match = /^(0\d{1,4})(-?)(\d{1,4})\2(\d{4})$/.exec(value);
    if (!match)
        return false;
    const [, area, separator, exchange, subscriber] = match;
    const nationalNumber = area.slice(1) + exchange + subscriber;
    if (!landlineNumberPattern.test(nationalNumber))
        return false;
    const rule = landlineAreaCodeRules.find(([leadingDigits]) => leadingDigits.test(nationalNumber));
    return rule !== undefined && (separator === "" || area.length === rule[1]);
}
const strictPhoneValidators = {
    landline: isLandlinePhoneJP,
    mobile: (value) => /^(?:070|080|090)(-?)\d{4}\1\d{4}$/.test(value),
    ip: (value) => /^050(-?)\d{4}\1\d{4}$/.test(value),
    tollFree: (value) => /^0120(-?)\d{3}\1\d{3}$/.test(value) || /^0800(-?)\d{3}\1\d{4}$/.test(value),
};
// Unhyphenated 0800 numbers can match both domestic formats. Prefer the longer prefix.
const defaultPhoneNumberKinds = ["tollFree", "mobile", "ip"];
const domesticPhoneNumberKinds = [...defaultPhoneNumberKinds, "landline"];
const internationalPhoneNumberKinds = ["mobile", "landline"];
function toDomesticPhoneNumber(value) {
    // Require the same separator after +81 and between the national groups.
    const match = /^\+81(-?)([1-9]\d{0,3})\1(\d{1,4})\1(\d{4})$/.exec(value);
    if (!match)
        return undefined;
    const [, separator, area, exchange, subscriber] = match;
    return ["0" + area, exchange, subscriber].join(separator);
}
export function validateStrictPhoneNumberJP(value, { kinds = defaultPhoneNumberKinds, format = "domestic" } = {}) {
    if (value === "")
        return { ok: false, reason: "empty" };
    const inputFormat = value.startsWith("+") ? "international" : "domestic";
    const domesticNumber = inputFormat === "international" ? toDomesticPhoneNumber(value) : value;
    if (domesticNumber === undefined)
        return { ok: false, reason: "invalid_format" };
    const possibleKinds = inputFormat === "international" ? internationalPhoneNumberKinds : domesticPhoneNumberKinds;
    const matchingKinds = possibleKinds.filter((kind) => strictPhoneValidators[kind](domesticNumber));
    if (matchingKinds.length === 0)
        return { ok: false, reason: "invalid_format" };
    const kind = matchingKinds.find((candidate) => kinds.includes(candidate));
    if (kind === undefined)
        return { ok: false, reason: "kind_not_allowed" };
    if (format !== "either" && format !== inputFormat)
        return { ok: false, reason: "format_not_allowed" };
    return { ok: true, kind, format: inputFormat };
}
export function isStrictPhoneNumberJP(value, options = {}) {
    return validateStrictPhoneNumberJP(value, options).ok;
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
