import { getApiKey } from './config.js';

export class OpenAIClientError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'OpenAIClientError';
    this.details = details;
  }
}

export async function createResponse({ model, instructions, input, temperature = 0.2 }) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new OpenAIClientError('OPENAI_API_KEY is not set. Run in dry mode or export OPENAI_API_KEY.');
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      instructions,
      input,
      temperature
    })
  });

  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!response.ok) {
    throw new OpenAIClientError(`OpenAI request failed with HTTP ${response.status}.`, json);
  }

  return json;
}

export function extractText(response) {
  if (typeof response.output_text === 'string') return response.output_text;
  const chunks = [];
  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && content.text) chunks.push(content.text);
      if (content.type === 'text' && content.text) chunks.push(content.text);
    }
  }
  return chunks.join('\n').trim();
}
