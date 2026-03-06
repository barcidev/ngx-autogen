export const pluralizeEs = (name: string): string => {
  if (!name) return name;
  const lastChar = name.slice(-1).toLowerCase();
  const vowels = ["a", "e", "i", "o", "u"];
  if (vowels.includes(lastChar)) return name + "s";
  if (lastChar === "z") return name.slice(0, -1) + "ces";
  return name + "es";
};

export const pluralizeEn = (name: string): string => {
  if (!name) return name;
  const lastChar = name.slice(-1).toLowerCase();
  const vowels = ["a", "e", "i", "o", "u"];
  if (lastChar === "y" && !vowels.includes(name.slice(-2, -1).toLowerCase())) {
    return name.slice(0, -1) + "ies";
  }
  if (
    ["s", "x", "z", "ch", "sh"].some((end) => name.toLowerCase().endsWith(end))
  ) {
    return name + "es";
  }
  return name + "s";
};
