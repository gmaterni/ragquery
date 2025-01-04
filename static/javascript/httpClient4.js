/** @format */
const API_KEY = "YhGMPy8ntz9wjJzacynYqOZc29RRGBFO";

// Classe personalizzata per gli errori di Mistral
class MistralError extends Error {
  constructor(message, statusCode = null, originalError = null) {
    super(message);
    this.name = "MistralError";
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

const mistralClient = {
  endpoint: "https://api.mistral.ai",
  apiKey: API_KEY,
  controller: new AbortController(),
  retryAttempts: 3,
  retryDelay: 1000,

  async chat({ model, messages, tools, temperature, maxTokens, topP, randomSeed, safeMode, safePrompt, toolChoice, responseFormat }, { signal } = {}) {
    try {
      if (!this.apiKey) {
        throw new MistralError("API key is not configured", 401);
      }

      if (!messages || messages.length === 0) {
        throw new MistralError("Messages array cannot be empty", 400);
      }

      const request = {
        model: model ?? this.modelDefault,
        messages: messages,
        tools: tools ?? undefined,
        temperature: temperature ?? undefined,
        max_tokens: maxTokens ?? undefined,
        top_p: topP ?? undefined,
        random_seed: randomSeed ?? undefined,
        stream: false,
        safe_prompt: (safeMode || safePrompt) ?? undefined,
        tool_choice: toolChoice ?? undefined,
        response_format: responseFormat ?? undefined,
      };

      let lastError;
      for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
        try {
          const response = await this._request("post", "v1/chat/completions", request, this.controller.signal);
          return response;
        } catch (error) {
          lastError = error;

          if (error.name === "AbortError") {
            throw new MistralError("Request was cancelled", null, error);
          }

          if (error.statusCode === 429) {
            console.warn(`Rate limit exceeded, attempt ${attempt + 1}/${this.retryAttempts}`);
            await this.delay(this.retryDelay * Math.pow(2, attempt));
            continue;
          }

          if (error.statusCode >= 500) {
            console.warn(`Server error, attempt ${attempt + 1}/${this.retryAttempts}`);
            await this.delay(this.retryDelay * Math.pow(2, attempt));
            continue;
          }

          throw error;
        }
      }

      throw new MistralError(`Failed after ${this.retryAttempts} attempts`, null, lastError);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },

  cancelRequest() {
    try {
      this.controller.abort();
      this.controller = new AbortController();
      console.log("Request cancelled successfully");
    } catch (error) {
      throw new MistralError("Failed to cancel request", null, error);
    }
  },

  handleError(error) {
    let errorMessage = "An error occurred: ";

    switch (error.statusCode) {
      case 400:
        errorMessage += "Bad request - Please check your input parameters";
        break;
      case 401:
        errorMessage += "Unauthorized - Please check your API key";
        break;
      case 403:
        errorMessage += "Forbidden - You don't have permission to access this resource";
        break;
      case 404:
        errorMessage += "Not found - The requested resource doesn't exist";
        break;
      case 429:
        errorMessage += "Too many requests - Please slow down";
        break;
      case 500:
        errorMessage += "Server error - Please try again later";
        break;
      default:
        errorMessage += error.message || "Unknown error occurred";
    }

    console.error({
      message: errorMessage,
      statusCode: error.statusCode,
      originalError: error.originalError,
      timestamp: new Date().toISOString(),
    });
  },

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
};

const infoError = {
  set(error) {
    this.error = error;
  },
  get_message() {
    return this.error.message;
  },
  get_type() {
    return this.error.type;
  },
  get_code() {
    return this.error.code;
  },
  get_details_message() {
    return this.error.details.message;
  },
  get_details_type() {
    return this.error.details.type;
  },
  get_details_param() {
    return this.error.details.param;
  },
  get_details_code() {
    return this.error.details.code;
  },
};

const infoResponse = {
  set(response) {
    this.response = response;
  },
  get_id() {
    return this.response.id;
  },
  get_created() {
    return this.response.created;
  },
  get_model() {
    return this.response.model;
  },
  get_index() {
    return this.response.choices[0].index;
  },
  get_role() {
    return this.response.choices[0].message.role;
  },
  get_tool_calls() {
    return this.response.choices[0].message.tool_calls;
  },
  get_content() {
    return this.response.choices[0].message.content;
  },
  get_finish_reason() {
    return this.response.choices[0].finish_reason;
  },
  get_prompt_tokens() {
    return this.response.usage.prompt_tokens;
  },
  get_total_tokens() {
    return this.response.usage.total_tokens;
  },
  get_completion_tokens() {
    return this.response.usage.completion_tokens;
  },
};

const calcTokens = {
  sum_input_tokens: 0,
  sum_generate_tokens: 0,
  init() {
    this.sum_input_tokens = 0;
    this.sum_generate_tokens = 0;
  },
  add(response) {
    if (!response) return;
    this.sum_input_tokens += response.usage.total_tokens;
    this.sum_generate_tokens += response.usage.completion_tokens;
  },
  get_sum_input_tokens() {
    return this.sum_input_tokens;
  },
  get_sum_generate_tokens() {
    return this.sum_generate_tokens;
  },
};

const errorDumps = (err) => {
  const s = JSON.stringify(err, null, 2);
  return s;
};

const errorMsg = (err) => {
  const s = err.details.message;
  return s;
};
