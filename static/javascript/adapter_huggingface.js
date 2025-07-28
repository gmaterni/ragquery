window.HuggingFaceAdapter = {
  buildUrl: (model) => `https://router.huggingface.co/v1/chat/completions`,
  buildHeaders: (apiKey) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  }),
  adaptPayload: (genericPayload) => {
    const adapted = {
      model: genericPayload.model,
      messages: genericPayload.messages,
      temperature: genericPayload.temperature,
      max_tokens: genericPayload.max_tokens,
      top_p: genericPayload.top_p,
      top_k: genericPayload.top_k,
      stop: genericPayload.stop,
    };
    for (const key in adapted) {
      if (adapted[key] === undefined) {
        delete adapted[key];
      }
    }
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