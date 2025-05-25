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
