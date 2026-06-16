export type LLMProviderName = "zhipu" | "claude";

export type LLMTask = "grade_essay" | "summarize";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LLMRequest = {
  task: LLMTask;
  messages: ChatMessage[];
  jsonMode?: boolean;
};

export type LLMResponse = {
  provider: LLMProviderName;
  content: string;
};

function pickProvider(task: LLMTask): LLMProviderName {
  const forced = process.env.LLM_PROVIDER?.toLowerCase();
  if (forced === "zhipu" || forced === "claude") return forced;

  if (process.env.LLM_PROVIDER === "auto" || !forced) {
    if (process.env.ZHIPU_API_KEY) return "zhipu";
    if (process.env.ANTHROPIC_API_KEY) return "claude";
    throw new Error("未配置 ZHIPU_API_KEY 或 ANTHROPIC_API_KEY");
  }

  if (task === "grade_essay" && process.env.ZHIPU_API_KEY) return "zhipu";
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  if (process.env.ZHIPU_API_KEY) return "zhipu";

  throw new Error("未配置可用的大模型 API Key");
}

async function callZhipu(request: LLMRequest): Promise<string> {
  const apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey) throw new Error("ZHIPU_API_KEY 未设置");

  const model =
    request.task === "grade_essay" ? "glm-4-flash" : "glm-4-flash";

  const res = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: request.messages,
      temperature: 0.2,
      response_format: request.jsonMode ? { type: "json_object" } : undefined,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`智谱 API 错误 ${res.status}: ${text}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

async function callClaude(request: LLMRequest): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY 未设置");

  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });

  const model =
    request.task === "grade_essay"
      ? "claude-sonnet-4-20250514"
      : "claude-3-5-haiku-latest";

  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    temperature: 0.2,
    system: request.messages.find((m) => m.role === "system")?.content,
    messages: request.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
  });

  const block = response.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text.trim() : "";
}

export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
  const provider = pickProvider(request.task);
  const content =
    provider === "zhipu" ? await callZhipu(request) : await callClaude(request);

  return { provider, content };
}
