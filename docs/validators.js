import { landlineAreaCodeRules, landlineNumberPattern } from "./landline-metadata.js";
export function validatePostalCodeJP(value) {
    if (value === "")
        return { ok: false, reason: "empty" };
    if (/[^0-9-]/.test(value))
        return { ok: false, reason: "invalid_character" };
    if (!/^(?:-*[0-9]){7}-*$/.test(value))
        return { ok: false, reason: "invalid_length" };
    if (!/^\d{3}-?\d{4}$/.test(value))
        return { ok: false, reason: "invalid_separator" };
    return { ok: true };
}
export function isPostalCodeJP(value) {
    return validatePostalCodeJP(value).ok;
}
// MIC Notice No. 441 of 2024 excludes 060 numbers whose fourth digit is 0.
const mobilePhonePrefix = "(?:060(?=-?[1-9])|070|080|090)";
const mobilePhonePattern = new RegExp(String.raw `^${mobilePhonePrefix}-?\d{4}-?\d{4}$`);
const strictMobilePhonePattern = new RegExp(String.raw `^${mobilePhonePrefix}(-?)\d{4}\1\d{4}$`);
export function isMobilePhoneJP(value) {
    return mobilePhonePattern.test(value);
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
    mobile: (value) => strictMobilePhonePattern.test(value),
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
function matchingPhoneNumberKinds(domesticNumber, possibleKinds, kindMatching) {
    if (kindMatching === "specific") {
        const digits = domesticNumber.replace(/-/g, "");
        const kind = domesticPhoneNumberKinds.find((candidate) => strictPhoneValidators[candidate](digits));
        if (kind === undefined || !possibleKinds.includes(kind) || !strictPhoneValidators[kind](domesticNumber)) {
            return [];
        }
        return [kind];
    }
    return possibleKinds.filter((kind) => strictPhoneValidators[kind](domesticNumber));
}
export function validateStrictPhoneNumberJP(value, { kinds = defaultPhoneNumberKinds, format = "domestic", kindMatching = "specific", } = {}) {
    if (value === "")
        return { ok: false, reason: "empty" };
    const inputFormat = value.startsWith("+") ? "international" : "domestic";
    const domesticNumber = inputFormat === "international" ? toDomesticPhoneNumber(value) : value;
    if (domesticNumber === undefined)
        return { ok: false, reason: "invalid_format" };
    const possibleKinds = inputFormat === "international" ? internationalPhoneNumberKinds : domesticPhoneNumberKinds;
    const matchingKinds = matchingPhoneNumberKinds(domesticNumber, possibleKinds, kindMatching);
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
export function validateFurigana(value) {
    if (value === "")
        return { ok: false, reason: "empty" };
    if (!/^[ァ-ヶー・ 　]+$/.test(value))
        return { ok: false, reason: "invalid_character" };
    if (!/[ァ-ヶ]/.test(value))
        return { ok: false, reason: "missing_katakana" };
    return { ok: true };
}
export function isFurigana(value) {
    return validateFurigana(value).ok;
}
export function validateZenkaku(value, { rejectHalfwidthKana = false } = {}) {
    if (value.length === 0)
        return { ok: false, reason: "empty" };
    if (/[ -~]/.test(value))
        return { ok: false, reason: "printable_ascii" };
    if (rejectHalfwidthKana && /[\uFF66-\uFF9F]/.test(value)) {
        return { ok: false, reason: "halfwidth_kana" };
    }
    return { ok: true };
}
export function isZenkaku(value, options) {
    return validateZenkaku(value, options).ok;
}
