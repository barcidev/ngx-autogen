export const classify = (str: string) =>
  str.replace(/(^\w|-\w)/g, (s) => s.replace('-', '').toUpperCase());

export const camelize = (str: string) => {
  const p = classify(str);
  return p.charAt(0).toLowerCase() + p.slice(1);
};

export const dasherize = (str: string) =>
  str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');

export const toSelectorName = (str: string) =>
  'app-' + dasherize(str);

export function pluralize(name: string, lang: 'en' | 'es' = 'en'): string {
  if (lang === 'es') {
    return /[aeiouáéíóú]$/i.test(name) ? `${name}s` : `${name}es`;
  }
  if (/(?:s|x|z|ch|sh)$/i.test(name)) return `${name}es`;
  if (/[^aeiou]y$/i.test(name)) return name.slice(0, -1) + 'ies';
  return `${name}s`;
}

// Aliases for backward compatibility if needed, but we'll use the new ones
export const toPascalCase = classify;
export const toCamelCase = camelize;
export const toKebabCase = dasherize;
