"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toKebabCase = exports.toCamelCase = exports.toPascalCase = exports.toSelectorName = exports.dasherize = exports.camelize = exports.classify = void 0;
exports.pluralize = pluralize;
const classify = (str) => str.replace(/(^\w|-\w)/g, (s) => s.replace('-', '').toUpperCase());
exports.classify = classify;
const camelize = (str) => {
    const p = (0, exports.classify)(str);
    return p.charAt(0).toLowerCase() + p.slice(1);
};
exports.camelize = camelize;
const dasherize = (str) => str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
exports.dasherize = dasherize;
const toSelectorName = (str) => 'app-' + (0, exports.dasherize)(str);
exports.toSelectorName = toSelectorName;
function pluralize(name, lang = 'en') {
    if (lang === 'es') {
        return /[aeiouáéíóú]$/i.test(name) ? `${name}s` : `${name}es`;
    }
    if (/(?:s|x|z|ch|sh)$/i.test(name))
        return `${name}es`;
    if (/[^aeiou]y$/i.test(name))
        return name.slice(0, -1) + 'ies';
    return `${name}s`;
}
// Aliases for backward compatibility if needed, but we'll use the new ones
exports.toPascalCase = exports.classify;
exports.toCamelCase = exports.camelize;
exports.toKebabCase = exports.dasherize;
//# sourceMappingURL=string.utils.js.map