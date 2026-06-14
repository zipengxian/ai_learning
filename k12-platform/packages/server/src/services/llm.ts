type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
}

interface SSEChunkDelta {
  content?: string;
}

interface SSEChunkChoice {
  delta?: SSEChunkDelta;
}

interface SSEChunk {
  choices?: SSEChunkChoice[];
}

type TokenCallback = (token: string) => void;

// ============================================================
// 判断可用的 LLM 提供商
// ============================================================
function getLLMProvider(): 'deepseek' | 'qwen' | 'fallback' {
  if (process.env.DEEPSEEK_API_KEY) return 'deepseek';
  if (process.env.DASHSCOPE_API_KEY) return 'qwen';
  return 'fallback';
}

// ============================================================
// DeepSeek API（流式，兼容 OpenAI 格式）
// ============================================================
async function callDeepSeek(
  messages: ChatMessage[],
  onToken: TokenCallback
): Promise<void> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${text}`);
  }

  const body = response.body;
  if (!body) throw new Error('No response body from DeepSeek');

  await parseSSEStream(body, (data) => {
    const content = data.choices?.[0]?.delta?.content;
    if (content) onToken(content);
  });
}

// ============================================================
// 通义千问 API（DashScope，流式，兼容 OpenAI 格式）
// ============================================================
async function callQwen(
  messages: ChatMessage[],
  onToken: TokenCallback
): Promise<void> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  const response = await fetch(
    'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages,
        stream: true,
        stream_options: { include_usage: true },
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Qwen API error ${response.status}: ${text}`);
  }

  const body = response.body;
  if (!body) throw new Error('No response body from Qwen');

  await parseSSEStream(body, (data) => {
    const content = data.choices?.[0]?.delta?.content;
    if (content) onToken(content);
  });
}

// ============================================================
// SSE 流解析器（通用）
// ============================================================
async function parseSSEStream(
  body: ReadableStream<Uint8Array>,
  onData: (data: SSEChunk) => void
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const jsonStr = trimmed.slice(5).trim();
        if (jsonStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(jsonStr) as SSEChunk;
          onData(parsed);
        } catch {
          // 忽略无法解析的行
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ============================================================
// 降级方案：模拟流式输出预设回复
// ============================================================
const FALLBACK_REPLIES: Record<string, string> = {
  default:
    '你好！我是你的 AI 学习助手。我可以帮你解答学习问题、讲解题目思路、批改作文等。请随时向我提问！',
  数学: '学习数学最重要的是理解概念和掌握方法。建议你从基础概念入手，多做练习，遇到不会的题目先独立思考，再去寻找解题思路。数学是一门需要积累的学科，保持耐心和信心很重要！',
  语文: '语文学习要多读多写。阅读经典作品可以帮助你积累词汇、提升语感；写作则需要不断练习，可以先从日记、读后感开始。同时，注意积累好词好句，这对写作很有帮助。',
  英语: '英语学习需要听说读写全面发展。每天坚持背一定量的单词，多听英语材料磨耳朵，大胆开口说英语。语法方面可以通过做题来巩固，阅读则要培养语感和理解能力。',
  物理: '物理是一门研究自然规律的学科。学习物理的关键是理解公式背后的物理意义，而不仅仅是记忆公式。遇到难题时，先分析题目的物理情景，画出受力图或示意图，再逐步推导。',
  化学: '化学学习要注重实验和理论相结合。理解化学反应的原理比死记硬背方程式更重要。建议你多做总结，把零散的知识点串成知识网络，这样记忆更牢固。',
  生物: '生物学是研究生命现象的学科。学习生物学要善于观察和归纳。可以通过画图、列表等方式整理知识点，把结构和功能联系起来理解，这样记忆效果更好。',
  历史: '学习历史要理清时间线，理解历史事件之间的因果关系。不要死记硬背年代和人名，而是去理解"为什么"和"带来了什么影响"。可以制作时间轴来帮助记忆。',
  地理: '地理学习要图文结合。多看地图，理解地理事物的空间分布规律。自然地理注重理解原理，人文地理注重联系实际。做题时要善于从地图中获取信息。',
  政治: '学习政治要理论联系实际。理解基本概念和原理的内涵，关注时政热点，学会用所学知识分析现实问题。答题时要注意逻辑清晰、要点完整。',
};

function matchFallbackReply(message: string): string {
  const lower = message.toLowerCase();
  for (const [keyword, reply] of Object.entries(FALLBACK_REPLIES)) {
    if (lower.includes(keyword)) {
      return reply;
    }
  }
  return FALLBACK_REPLIES.default;
}

async function callFallback(
  message: string,
  onToken: TokenCallback
): Promise<void> {
  const reply = matchFallbackReply(message);
  const chars = [...reply];
  const delayMs = 50;

  for (let i = 0; i < chars.length; i++) {
    await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
    onToken(chars[i]);
  }
}

// ============================================================
// 统一 LLM 调用入口
// ============================================================
async function callLLM(
  messages: ChatMessage[],
  onToken: TokenCallback
): Promise<void> {
  const provider = getLLMProvider();

  switch (provider) {
    case 'deepseek':
      return callDeepSeek(messages, onToken);
    case 'qwen':
      return callQwen(messages, onToken);
    case 'fallback': {
      const userMessage = [...messages].reverse().find((m) => m.role === 'user');
      let content = '';
      if (typeof userMessage?.content === 'string') {
        content = userMessage.content;
      } else if (Array.isArray(userMessage?.content)) {
        const textPart = userMessage.content.find((p) => p.type === 'text');
        content = textPart?.text || '';
      }
      return callFallback(content, onToken);
    }
  }
}

export type { ChatMessage, ContentPart, TokenCallback };
export { callLLM, callDeepSeek, callQwen, callFallback, getLLMProvider };