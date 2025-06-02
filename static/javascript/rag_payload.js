/** @format */

function getPayloadDoc(prompt) {
  return {
    model: "",
    temperature: 0.3,
    //top_p": 1,
    max_tokens: 1024,
    stream: false,
    //stop: "</s>",
    random_seed: 42,
    messages: [{ role: "user", content: prompt }],
    //AAA response_format: {
    //   type: "text",
    // },
    // tools: [
    //     {
    //     type: "function",
    //     function: {
    //         name: "string",
    //         description: "",
    //         parameters: {}
    //     }
    //     }
    // ],
    // tool_choice: "auto",
    // presence_penalty: 0,
    // frequency_penalty: 0,
    // n: 1,
    safe_prompt: false,
  };
}

function getPayloadBuildContext(prompt) {
  return {
    model: "",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 2000,
    stream: false,
    safe_prompt: false,
    random_seed: 42,
  };
}

function getPayloadWithContext(prompt) {
  return {
    model: "",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 2000,
    stream: false,
    safe_prompt: false,
    random_seed: 42,
  };
}

function getPayloadThread(prompt) {
  return {
    model: "",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2000,
    stream: false,
    safe_prompt: false,
    random_seed: 42,
  };
}

function getPayloadThreadRows(rows, query) {
  const rows2msgs = (rows, query) => {
    let result = [];
    for (let i = 0; i < rows.length; i++) {
      let q = rows[i][0];
      let a = rows[i][1];
      if (!q) continue;
      result.push({ role: "user", content: q });
      result.push({ role: "assistant", content: a });
    }
    result.push({ role: "user", content: query });
    return result;
  };
  const msgs = rows2msgs(rows, query);
  return {
    model: "",
    messages: msgs,
    temperature: 0.7,
    max_tokens: 2000,
    stream: false,
    safe_prompt: false,
    random_seed: 42,
  };
}
