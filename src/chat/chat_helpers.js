import { TodoBasicSchema } from "../shared/todo_schema";

export const tooWhitespacey = (s) => {
    const len = s.length || 1;
    const ws = (s.match(/\s/g) || []).length;
    const maxRun = Math.max(...(s.match(/\n+/g) || [""]).map((x) => x.length));
    return ws / len > 0.45 || maxRun > 20;
  };

export const isInjectionLike = (input) => {
  const suspicious = [
    "ignore",
    "admin",
    "instructions",
    "system prompt",
    "override",
    "developer mode"
  ];

  const lower = input.toLowerCase();
  return suspicious.some(word => lower.includes(word));
};

export const extractValidatedTodo = (responseJSON) => {
  const textBlocks = responseJSON.output
    .flatMap((o) => o.content)
    .filter((c) => c.type === "output_text" && typeof c.text === "string");

  const outputJSON = textBlocks[textBlocks.length - 1].text;

  if (tooWhitespacey(outputJSON)) return null;

  const candidate = JSON.parse(outputJSON);

  const validated = TodoBasicSchema.safeParse(candidate);
  return validated.success ? validated.data : null;
};

