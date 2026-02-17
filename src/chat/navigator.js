import { TodoBasicSchema } from "../shared/todo_schema";
import { zodTextFormat } from "openai/helpers/zod";


async function getApiKey() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["apiKey"], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }

      if (!result.apiKey) {
        reject(new Error("API key not found."));
        return;
      }

      resolve(result.apiKey);
    });
  });
}

export async function todoPlaintext(userQuery) {
  const apiKey = await getApiKey();

  const response = await fetch(
    "https://api.ai.it.ufl.edu/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: `The user will pass in a large text blob talking about their week. Take in what the user has given and create a
            to-do list for them to tackle all of the items that they've talked about. Group common tasks into sections such as "health", "academics", "work", etc.
            
            Use bulleted lists, and provide time estimations for each task where possible. If a task is sufficiently complex, you can add subtasks to that task.
            Output only plain markdown, do NOT use html tags for formatting or emojis.
            Print out only the list, nothing else. Do not add extraneous text at the beginning or end, nor talk to the user.`,
          },
          {
            role: "user",
            content: userQuery,
          },
        ],
        verbosity: "medium",
        reasoning_effort: "low",
        temperature: 0.2
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

export async function todoJSON(llm1_output) {
  const apiKey = await getApiKey();

  const response = await fetch(
    "https://api.ai.it.ufl.edu/v1/responses",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        "model": "gpt-oss-120b",
        "reasoning": { "effort": "medium" },
        "input": [
            {
            "role": "system",
            "content": `The user will pass in a markdown-formatted list of a to-do list. Generate structured output based on the passed in input, following the JSON schema. Infer fields if none are provided.`
            },
            {
            "role": "user",
            "content": llm1_output
            }
        ],
        "text": {
           format: zodTextFormat(TodoBasicSchema, "todo_basic"),
        }
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const data = await response.json();
  return data;
}