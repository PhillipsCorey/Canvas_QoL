import { getSetting, setSetting } from "../shared/storage.js";

document.getElementById("btn").addEventListener("click", async () => {
  const key = "clickCount";
  const current = (await getSetting(key)) ?? 0;
  const next = current + 1;
  await setSetting(key, next);
  document.getElementById("out").textContent = `clickCount = ${next}`;
});

// Replace with your actual key for testing
const API_KEY = process.env.API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

async function testGemini() {
  const requestBody = {
    contents: [{
      parts: [{ text: "Hello! Can you hear me? Summarize your purpose in one sentence." }]
    }]
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    // The response path is a bit nested in the Gemini API
    const reply = data.candidates[0].content.parts[0].text;
    console.log("Gemini says:", reply);
    alert("Success! Gemini responded: " + reply);

  } catch (error) {
    console.error("Error calling Gemini:", error);
  }
}

console.log("Print");

testGemini();
