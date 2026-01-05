/**
 * Shared LLM utilities for Temple OS Edge Functions
 */

export interface LLMCallSpec {
  model: string;
  system_prompt: string;
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  temperature: number;
  max_tokens: number;
  tools?: any[];
  stop_sequences?: string[] | null;
}

export interface LLMCallResult {
  raw_response: string;
  parsed_content: string | Record<string, any>;
  used_tools: any[];
  token_usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function callLLM(spec: LLMCallSpec, provider: 'openai' | 'anthropic' = 'openai'): Promise<LLMCallResult> {
  if (provider === 'openai') {
    return callOpenAI(spec);
  } else {
    return callAnthropic(spec);
  }
}

async function callOpenAI(spec: LLMCallSpec): Promise<LLMCallResult> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const messages = [
    { role: 'system', content: spec.system_prompt },
    ...spec.messages,
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: spec.model || 'gpt-4-turbo-preview',
      messages,
      temperature: spec.temperature,
      max_tokens: spec.max_tokens,
      tools: spec.tools,
      stop: spec.stop_sequences,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const choice = data.choices[0];

  return {
    raw_response: JSON.stringify(data),
    parsed_content: choice.message.content,
    used_tools: choice.message.tool_calls || [],
    token_usage: {
      prompt_tokens: data.usage.prompt_tokens,
      completion_tokens: data.usage.completion_tokens,
      total_tokens: data.usage.total_tokens,
    },
  };
}

async function callAnthropic(spec: LLMCallSpec): Promise<LLMCallResult> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: spec.model || 'claude-3-5-sonnet-20241022',
      system: spec.system_prompt,
      messages: spec.messages,
      temperature: spec.temperature,
      max_tokens: spec.max_tokens,
      tools: spec.tools,
      stop_sequences: spec.stop_sequences,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();

  return {
    raw_response: JSON.stringify(data),
    parsed_content: data.content[0].text,
    used_tools: data.content.filter((c: any) => c.type === 'tool_use'),
    token_usage: {
      prompt_tokens: data.usage.input_tokens,
      completion_tokens: data.usage.output_tokens,
      total_tokens: data.usage.input_tokens + data.usage.output_tokens,
    },
  };
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI Embedding API error: ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}
