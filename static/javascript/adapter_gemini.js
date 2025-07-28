window.GeminiAdapter = {
  buildUrl: (model, apiKey) => {
    const baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/";
    return `${baseUrl}${model}:generateContent?key=${apiKey}`;
  },
  buildHeaders: () => ({
    "Content-Type": "application/json",
  }),
  adaptPayload: (genericPayload) => {
    const HarmCategory = {
      HARM_CATEGORY_HARASSMENT: "HARM_CATEGORY_HARASSMENT",
      HARM_CATEGORY_HATE_SPEECH: "HARM_CATEGORY_HATE_SPEECH",
      HARM_CATEGORY_SEXUALLY_EXPLICIT: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      HARM_CATEGORY_DANGEROUS_CONTENT: "HARM_CATEGORY_DANGEROUS_CONTENT",
    };
    const HarmBlockThreshold = {
      BLOCK_NONE: "BLOCK_NONE",
    };
    const geminiArgs = {};
    const messages = genericPayload.messages || [];
    const geminiContents = [];
    let systemInstruction = null;
    for (const msg of messages) {
      if (msg.role === "system") {
        systemInstruction = msg.content;
        continue;
      }
      geminiContents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
    geminiArgs.contents = geminiContents;
    if (systemInstruction) {
      geminiArgs.system_instruction = { parts: [{ text: systemInstruction }] };
    }
    const generationConfig = {
      maxOutputTokens: genericPayload.max_tokens,
      temperature: genericPayload.temperature,
      topP: genericPayload.top_p,
      topK: genericPayload.top_k,
      candidateCount: 1,
      stopSequences: genericPayload.stop || [],
    };
    for (const key in generationConfig) {
      if (generationConfig[key] === undefined || generationConfig[key] === null) {
        delete generationConfig[key];
      }
    }
    geminiArgs.generationConfig = generationConfig;
    if (genericPayload.safe_prompt === false) {
      geminiArgs.safetySettings = Object.values(HarmCategory).map((category) => ({
        category,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      }));
    }
    return geminiArgs;
  },
  parseResponse: (responseJson) => {
    try {
      return responseJson.candidates[0].content.parts[0].text;
    } catch (e) {
      return null;
    }
  },
};