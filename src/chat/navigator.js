import { TodoBasicSchema } from "../shared/todo_schema";
import { zodTextFormat } from "openai/helpers/zod";

const today = new Date();

const formatted = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
}).format(today);

const todoPlaintextPrompt = 
          `The user will pass in a large text blob talking about their week. Take in what the user has given and create a
            to-do list for them to tackle all of the items that they've talked about. Group common tasks into sections such as "health", "academics", "work", etc.
            
            REQUIREMENTS:
            Use bulleted lists.  
            The hierarchy is 'section', 'task', 'subtask'.
            
            Sections should be broad, overarching ideas such as "health" "academics" "work" "doctors" "extracurriculars" "shopping" "family", they are very broad.
            Consider each task a larger object, and break down tasks into smaller, manageable subtasks.

            Tasks are individual items, like "do homework" or "finish assignment".
            [TASK NAME] - [DUE DATE] - [EST TIME] - Description: [DESCRIPTION]
            
            Subtasks are the steps to complete a task.
            [SUBTASK NAME] - [EST TIME]
            
            Give time estimations to both tasks and subtasks.
            Give due dates to tasks. Do NOT give due dates to subtasks.
            Output only plain markdown bulleted lists, do NOT use html tags for formatting, emojis, or asterisks/latex/any other special features.
            Print out only the list, nothing else. Do not add extraneous text at the beginning or end, nor talk to the user.
            For context, the current date is ${formatted}.`

const todoJSONPrompt =
          `
          The user will pass in a markdown-formatted list of a to-do list. The structure is as follows:
          [SECTION]
          - [TASK NAME] - [DUE DATE] - [EST TIME] - Description: [DESCRIPTION]
            - [SUBTASK NAME] - [EST TIME]
          
          Generate structured output based on the passed in input, following the JSON schema. Infer fields if none are provided.
          \`date\` fields are the fields where the due date goes.
          \`time\` fields are the fields where the projected time to finish the assignment goes.
          `



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
            content: todoPlaintextPrompt,
          },
          {
            role: "user",
            content: userQuery,
          },
        ],
        verbosity: "low",
        reasoning_effort: "high",
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

  const response = await fetch("https://api.ai.it.ufl.edu/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-oss-120b",
      reasoning: { effort: "low" },
      input: [
        { role: "system", content: todoJSONPrompt },
        { role: "user", content: llm1_output },
      ],
      text: {
        format: zodTextFormat(TodoBasicSchema, "todo_basic"),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return await response.json();
}

