window.GroqAdapter = {
  buildUrl: () => "https://api.groq.com/openai/v1/chat/completions",
  buildHeaders: (apiKey) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  }),
  adaptPayload: (genericPayload) => {
    const adapted = { ...genericPayload };
    delete adapted.safe_prompt;
    delete adapted.random_seed;
    return adapted;
  },
  parseResponse: (responseJson) => {
    try {
      return responseJson.choices[0].message.content;
    } catch (e) {
      return null;
    }
  },
};