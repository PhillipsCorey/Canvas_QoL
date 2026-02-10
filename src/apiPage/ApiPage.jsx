import { useState } from 'react';

const API_KEY = import.meta.env.VITE_API_KEY

function ApiPage() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  
  const handleTestGemini = async () => {
    setLoading(true);
    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    if (!API_KEY) {
      setResponse("Error: API Key is missing from environment variables.");
      return;
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const data = await res.json();
      const reply = data.candidates[0].content.parts[0].text;
      setResponse(reply);
    } catch (error) {
      console.error("Error calling Gemini:", error);
      setResponse("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <h1>Gemini API Test</h1>
      <textarea 
        placeholder="Enter prompt here..." 
        value={prompt} 
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
      />
      <button onClick={handleTestGemini} disabled={loading}>
        {loading ? 'Sending...' : 'Test Gemini'}
      </button>
      <textarea 
        placeholder="Response will appear here..." 
        value={response} 
        readOnly 
        rows={10}
      />
    </div>
  );
}

export default ApiPage;
