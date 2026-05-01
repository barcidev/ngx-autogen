import * as readline from "readline";

export function askInput(question: string, defaultValue?: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const suffix = defaultValue ? ` (${defaultValue})` : "";
  return new Promise((resolve) => {
    rl.question(`${question}${suffix}: `, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || "");
    });
  });
}

export function askConfirm(question: string, defaultValue = false): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const hint = defaultValue ? "(Y/n)" : "(y/N)";
  return new Promise((resolve) => {
    rl.question(`${question} ${hint}: `, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      if (normalized === "") return resolve(defaultValue);
      resolve(normalized === "y" || normalized === "yes");
    });
  });
}
