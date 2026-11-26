import { landlineAreaCodeRules, landlineNumberPattern } from "./landline-metadata.js";
export function validatePostalCodeJP(value, { includeDetails = false } = {}) {
    if (value === "")
        return { ok: false, reason: "empty" };
    const invalidCharacter = /[^0-9-]/u.exec(value);
    if (invalidCharacter) {
        return includeDetails
            ? { ok: false, reason: "invalid_character", index: invalidCharacter.index, character: invalidCharacter[0] }
            : { ok: false, reason: "invalid_character" };
    }
    if (!/^(?:-*[0-9]){7}-*$/.test(value)) {
        return includeDetails
            ? { ok: false, reason: "invalid_length", digitCount: value.replace(/-/g, "").length }
            : { ok: false, reason: "invalid_length" };
    }
    if (!/^\d{3}-?\d{4}$/.test(value)) {
        if (!includeDetails)
            return { ok: false, reason: "invalid_separator" };
        const firstHyphen = value.indexOf("-");
        const index = firstHyphen === 3 ? value.indexOf("-", firstHyphen + 1) : firstHyphen;
        return { ok: false, reason: "invalid_separator", index, character: "-" };
    }
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
function checkStrictPhoneNumber(value, { kinds = defaultPhoneNumberKinds, format = "domestic", kindMatching = "specific", } = {}) {
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
function hasMissingPhoneSeparators(value, options) {
    if (!/^\+?\d+(?:-\d+)+$/.test(value))
        return false;
    const international = value.startsWith("+");
    const groups = value.split("-");
    if (groups.length >= (international ? 4 : 3))
        return false;
    const unhyphenated = groups.join("");
    if (!checkStrictPhoneNumber(unhyphenated, options).ok)
        return false;
    const existingSeparators = [];
    let offset = 0;
    for (const group of groups.slice(0, -1)) {
        offset += group.length;
        existingSeparators.push(offset);
    }
    const countryCodeEnd = international ? "+81".length : 0;
    const countryCode = international ? "+81-" : "";
    const areaLengths = international ? [1, 2, 3, 4] : [2, 3, 4, 5];
    // Try the group sizes supported by the validators, preserving every supplied hyphen.
    const subscriberLengths = international ? [4] : [3, 4];
    for (const areaLength of areaLengths) {
        const areaEnd = countryCodeEnd + areaLength;
        for (const subscriberLength of subscriberLengths) {
            const exchangeEnd = unhyphenated.length - subscriberLength;
            const separators = international ? [countryCodeEnd, areaEnd, exchangeEnd] : [areaEnd, exchangeEnd];
            if (!existingSeparators.every((position) => separators.includes(position)))
                continue;
            const candidate = countryCode + [
                unhyphenated.slice(countryCodeEnd, areaEnd),
                unhyphenated.slice(areaEnd, exchangeEnd),
                unhyphenated.slice(exchangeEnd),
            ].join("-");
            if (checkStrictPhoneNumber(candidate, options).ok)
                return true;
        }
    }
    return false;
}
function strictPhoneNumberFormatDetail(value, options) {
    const withoutTrunkPrefix = value.replace(/^(\+81-?)0/, "$1");
    if (withoutTrunkPrefix !== value && checkStrictPhoneNumber(withoutTrunkPrefix, options).ok) {
        return "domestic_trunk_prefix";
    }
    if (hasMissingPhoneSeparators(value, options))
        return "partial_separator";
    return undefined;
}
export function validateStrictPhoneNumberJP(value, options = {}) {
    const result = checkStrictPhoneNumber(value, options);
    if (!options.includeDetails || result.ok || result.reason !== "invalid_format")
        return result;
    const detail = strictPhoneNumberFormatDetail(value, options);
    return detail ? { ...result, detail } : result;
}
export function isStrictPhoneNumberJP(value, options = {}) {
    return checkStrictPhoneNumber(value, options).ok;
}
export function isKatakana(value) {
    return /^[ァ-ヶー・\s　]+$/.test(value);
}
export function validateFurigana(value, { normalization = "none" } = {}) {
    const text = normalization === "NFC" ? value.normalize("NFC") : value;
    if (text === "")
        return { ok: false, reason: "empty" };
    if (!/^[ァ-ヶー・ 　]+$/.test(text))
        return { ok: false, reason: "invalid_character" };
    if (!/[ァ-ヶ]/.test(text))
        return { ok: false, reason: "missing_katakana" };
    return { ok: true };
}
export function isFurigana(value, options) {
    return validateFurigana(value, options).ok;
}
function zenkakuCharacterFailure(reason, match, includeInvalidCharacter) {
    return includeInvalidCharacter
        ? { ok: false, reason, index: match.index, character: match[0] }
        : { ok: false, reason };
}
export function validateZenkaku(value, { rejectHalfwidthKana = false, rejectControlCharacters = false, includeInvalidCharacter = false, } = {}) {
    if (value.length === 0)
        return { ok: false, reason: "empty" };
    const ascii = /[ -~]/.exec(value);
    if (ascii)
        return zenkakuCharacterFailure("printable_ascii", ascii, includeInvalidCharacter);
    const kana = rejectHalfwidthKana ? /[\uFF66-\uFF9F]/.exec(value) : null;
    if (kana)
        return zenkakuCharacterFailure("halfwidth_kana", kana, includeInvalidCharacter);
    const control = rejectControlCharacters ? /[\u0000-\u001F\u007F-\u009F]/.exec(value) : null;
    if (control)
        return zenkakuCharacterFailure("control_character", control, includeInvalidCharacter);
    return { ok: true };
}
export function isZenkaku(value, options) {
    return validateZenkaku(value, options).ok;
}
