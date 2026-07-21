// Shared AI/HTTP helpers used by chat, moments, forum, etc.
import type { ApiConfig, ChatApiConfig } from './types';

export interface ChatMsg {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/* Call an OpenAI-compatible chat completions endpoint. Returns assistant text. */
export async function callChat(chat: ChatApiConfig, messages: ChatMsg[], opts?: { temperature?: number; maxTokens?: number }): Promise<string> {
  if (!chat.baseUrl) throw new Error('未配置 Chat API');
  if (!chat.apiKey) throw new Error('未配置 API Key');

  const base = chat.baseUrl.replace(/\/+$/, '');

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${chat.apiKey}` },
      body: JSON.stringify({
        model: chat.model || 'gpt-4o-mini',
        messages,
        temperature: opts?.temperature ?? 0.8,
        max_tokens: opts?.maxTokens,
      }),
    });

    if (!res.ok) {
      let errorMsg = `HTTP ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData.error?.message) {
          errorMsg = errorData.error.message;
        } else if (errorData.message) {
          errorMsg = errorData.message;
        }
      } catch {
        // 无法解析JSON错误
      }

      if (res.status === 401) {
        throw new Error('API Key无效或过期');
      } else if (res.status === 403) {
        throw new Error('没有权限访问此API');
      } else if (res.status === 404) {
        throw new Error('API接口不存在，请检查地址');
      } else if (res.status === 429) {
        throw new Error('API配额已用完或请求过多');
      } else if (res.status >= 500) {
        throw new Error('API服务器错误');
      }

      throw new Error(errorMsg);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    if (!text) throw new Error('API返回空内容');
    return String(text);
  } catch (e) {
    const error = e as Error;
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('网络错误：无法连接到API服务器');
    }
    throw error;
  }
}

/* Convenience: single-turn prompt with a system instruction. */
export async function askAI(api: ApiConfig, system: string, user: string, opts?: { temperature?: number; maxTokens?: number }): Promise<string> {
  return callChat(api.chat, [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ], opts);
}

/* Ask AI to produce a JSON object/array. Strips markdown fences and parses. */
export async function askAIJson<T = unknown>(api: ApiConfig, system: string, user: string, opts?: { temperature?: number; maxTokens?: number }): Promise<T> {
  const raw = await askAI(api, system, user, opts);
  return extractJson<T>(raw);
}

export function extractJson<T>(raw: string): T {
  let s = raw.trim();
  // strip ```json ... ``` fences
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  // find first { or [ and last } or ]
  const start = s.search(/[{[]/);
  const end = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'));
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return JSON.parse(s) as T;
}

export function nowTs(): number { return Date.now(); }

/* Structured rich reply: text + optional inner thought + media intent. */
export interface RichReply {
  content: string;
  innerThought?: string;
  sendImage?: boolean;
  imagePrompt?: string;
  sendVoice?: boolean;
  voiceText?: string;
}
export async function callChatRich(chat: ChatApiConfig, messages: ChatMsg[], opts?: { temperature?: number; maxTokens?: number }): Promise<RichReply> {
  const sys: ChatMsg = {
    role: 'system',
    content:
      '你是角色扮演聊天系统。请在回复时输出 JSON，字段：\n' +
      '{"content":"回复正文","innerThought":"角色内心真实想法（用户看不到，除非长按）","sendImage":false,"imagePrompt":"如果配图就写英文绘图提示词","sendVoice":false,"voiceText":"如果发语音就写语音对应的中文文字"}\n' +
      '规则：innerThought 总是给出，体现角色真实心理，可能和表面 content 不同。sendImage/sendVoice 根据对话自然节奏偶尔为 true（不要每次都发）。imagePrompt 只在 sendImage 时填。voiceText 只在 sendVoice 时填。只输出 JSON。',
  };
  const raw = await callChat(chat, [sys, ...messages], { temperature: opts?.temperature ?? 0.85, maxTokens: opts?.maxTokens ?? 800 });
  try {
    const parsed = extractJson<RichReply>(raw);
    if (!parsed.content) throw new Error('no content');
    return parsed;
  } catch {
    return { content: raw };
  }
}

/* Generate an image via OpenAI-compatible image endpoint. Returns image URL. */
export async function generateImage(
  image: ApiConfig['image'],
  prompt: string,
  opts?: { stylePrompt?: string; faceRef?: string },
): Promise<string> {
  if (!image.baseUrl) throw new Error('未配置绘图 API');
  const base = image.baseUrl.replace(/\/+$/, '');
  const parts: string[] = [];
  const style = (opts?.stylePrompt ?? image.stylePrompt ?? '').trim();
  if (style) parts.push(style);
  if (prompt.trim()) parts.push(prompt.trim());
  const finalPrompt = parts.join(', ');
  const body: Record<string, unknown> = {
    model: image.model || 'dall-e-3',
    prompt: finalPrompt,
    n: 1,
    size: '1024x1024',
  };
  // face reference image — sent when supported by the endpoint
  if (opts?.faceRef) {
    const b64 = opts.faceRef.startsWith('data:') ? opts.faceRef.split(',')[1] : opts.faceRef;
    body.image = b64;
  }
  const res = await fetch(`${base}/images/generations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${image.apiKey}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`绘图 HTTP ${res.status}`);
  const data = await res.json();
  const url = data?.data?.[0]?.url ?? data?.data?.[0]?.b64_json;
  if (!url) throw new Error('绘图无返回');
  return url;
}

/* Text-to-speech via OpenAI-compatible /audio/speech endpoint. Returns a data URL. */
export async function textToSpeech(voice: ApiConfig['voice'], text: string): Promise<{ url: string; duration: number }> {
  if (!voice.baseUrl) throw new Error('未配置语音 API');
  const base = voice.baseUrl.replace(/\/+$/, '');
  const res = await fetch(`${base}/audio/speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${voice.apiKey}` },
    body: JSON.stringify({
      model: voice.model || 'tts-1',
      input: text,
      voice: 'alloy',
      response_format: 'mp3',
    }),
  });
  if (!res.ok) throw new Error(`语音 HTTP ${res.status}`);
  const blob = await res.blob();
  const url = await blobToDataURL(blob);
  const duration = await audioDuration(url);
  return { url, duration };
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

function audioDuration(dataUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const a = new Audio(dataUrl);
    a.addEventListener('loadedmetadata', () => resolve(Math.ceil(a.duration) || 0));
    a.addEventListener('error', () => resolve(0));
  });
}

/* Fetch available model list from an OpenAI-compatible /models endpoint. */
export async function fetchModels(baseUrl: string, apiKey: string): Promise<string[]> {
  if (!baseUrl) throw new Error('请先填写接口地址');
  if (!apiKey) throw new Error('请先填写API Key');

  const base = baseUrl.replace(/\/+$/, '');

  try {
    const res = await fetch(`${base}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      let errorMsg = `HTTP ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData.error?.message) {
          errorMsg = errorData.error.message;
        } else if (errorData.message) {
          errorMsg = errorData.message;
        }
      } catch {
        // 无法解析JSON错误
      }

      if (res.status === 401) {
        throw new Error('API Key无效或过期');
      } else if (res.status === 403) {
        throw new Error('没有权限访问模型列表，请检查API Key权限');
      } else if (res.status === 404) {
        throw new Error('API不支持/models接口，请手动输入模型名称');
      } else if (res.status === 429) {
        throw new Error('请求过多，请稍后再试');
      } else if (res.status >= 500) {
        throw new Error('API服务器错误');
      }

      throw new Error(errorMsg);
    }

    const data = await res.json();
    const list = data?.data ?? data?.models ?? [];
    const ids = list.map((m: { id?: string; name?: string }) => m.id ?? m.name).filter(Boolean);
    if (!ids.length) throw new Error('API未返回模型列表，请手动输入模型名称');
    return ids as string[];
  } catch (e) {
    const error = e as Error;
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('网络错误：无法连接到API服务器');
    }
    throw error;
  }
}

/* ---------- Persona / Worldbook generator ---------- */
export interface GeneratedCharCard {
  name: string;
  signature: string;
  persona: string;
  greeting: string;
  imagePromptTemplate: string;
}
export interface GeneratedUserCard {
  nickname: string;
  signature: string;
  imagePromptTemplate: string;
}
export interface GeneratedWorldEntry {
  key: string;
  content: string;
  priority: number;
}
export interface GeneratedPack {
  char: GeneratedCharCard;
  user: GeneratedUserCard;
  world: GeneratedWorldEntry[];
}

export async function generatePersonaPack(
  api: ApiConfig,
  keyword: string,
  wordCount: number,
): Promise<GeneratedPack> {
  if (!api.chat.baseUrl) throw new Error('未配置 Chat API');
  const sys =
    '你是角色卡与世界书设计专家。根据关键词生成一套完整的角色卡组合：一个AI角色（char）人设卡、一个用户（user）人设卡、以及配套的世界书词条。只返回JSON。';
  const user =
    `关键词：「${keyword}」\n` +
    `总字数要求：约 ${wordCount} 字（各部分内容丰富度按此控制）\n\n` +
    `请生成：\n` +
    `1. char角色卡：name（角色名）、signature（一句话签名）、persona（详细人设：性格、身份、背景、说话风格、与user的关系，丰富生动）、greeting（开场白，符合角色语气）、imagePromptTemplate（该角色的外观生图提示词，用于生成角色图片时的统一外观描述）\n` +
    `2. user人设卡：nickname（用户昵称）、signature（用户签名）、imagePromptTemplate（生成该用户相关图片时的统一外观描述提示词）\n` +
    `3. world世界书：3-6条词条，每条含key（触发关键词）、content（世界观设定内容）、priority（0-10，越重要越高）\n\n` +
    `返回格式：\n` +
    '{"char":{"name":"","signature":"","persona":"","greeting":"","imagePromptTemplate":""},"user":{"nickname":"","signature":"","imagePromptTemplate":""},"world":[{"key":"","content":"","priority":0}]}\n' +
    `只输出JSON，不要额外文字。总字数约${wordCount}字。`;
  return askAIJson<GeneratedPack>(api, sys, user, { temperature: 0.9, maxTokens: 2400 });
}

/* ---------- Auto NPC generation ---------- */
export interface NpcSuggestion {
  name: string;
  persona: string;
  greeting: string;
  signature: string;
  reason: string;
}
export interface NpcDetectResult {
  npcs: NpcSuggestion[];
}

/* Analyze recent dialogue and suggest new NPC characters that appeared in the conversation. */
export async function detectNpcs(
  api: ApiConfig,
  charName: string,
  recentMessages: string,
  existingNames: string[],
): Promise<NpcSuggestion[]> {
  if (!api.chat.baseUrl) return [];
  const sys = '你是剧情分析助手。分析对话内容，识别其中出现的、尚未存在的角色（NPC）。只返回 JSON。';
  const user = `当前角色：${charName}\n已有角色名单：${existingNames.join('、') || '（无）'}\n\n最近对话内容：\n${recentMessages}\n\n请识别对话中新出现的、值得创建为独立 NPC 的角色（被提及并有互动或剧情关联的人）。对每个新角色返回：\n{"npcs":[{"name":"角色名","persona":"性格/身份/与主角关系","greeting":"该角色的开场白","signature":"一句话个性签名","reason":"为什么需要创建这个角色"}]}\n如果没有新角色，返回 {"npcs":[]}。只输出 JSON。`;
  try {
    const result = await askAIJson<NpcDetectResult>(api, sys, user, { temperature: 0.6, maxTokens: 600 });
    return (result.npcs ?? []).filter((n) => n.name && !existingNames.includes(n.name));
  } catch {
    return [];
  }
}

/* ---------- Plot event detection ---------- */
export interface PlotEventResult {
  events: { targetName: string; summary: string }[];
}

/* Analyze dialogue for events that other characters should know about. */
export async function detectPlotEvents(
  api: ApiConfig,
  charName: string,
  recentMessages: string,
  otherCharNames: string[],
): Promise<{ targetName: string; summary: string }[]> {
  if (!api.chat.baseUrl || otherCharNames.length === 0) return [];
  const sys = '你是剧情分析助手。分析对话内容，判断其中是否有关其他角色的剧情信息，这些角色应该知道的部分。只返回 JSON。';
  const user = `当前说话角色：${charName}\n其他已知角色：${otherCharNames.join('、')}\n\n最近对话：\n${recentMessages}\n\n判断这段对话中是否产生了其他角色应该感知到的剧情信息。例如：user对当前角色说去找了某个角色、某个角色发生了什么事等。只返回那些其他角色确实应该知道的信息（不是所有提及）。返回：\n{"events":[{"targetName":"应该知道的角色名","summary":"该角色应该知道的内容摘要"}]}\n如果没有，返回 {"events":[]}。只输出 JSON。`;
  try {
    const result = await askAIJson<PlotEventResult>(api, sys, user, { temperature: 0.4, maxTokens: 400 });
    return (result.events ?? []).filter((e) => e.targetName && e.summary && otherCharNames.includes(e.targetName));
  } catch {
    return [];
  }
}

/* ---------- Testing Friend Requests (小号试探/好友申请) ---------- */
export interface EvaluationResult {
  accepted: boolean;
  reply: string;
}

export async function evaluateOutgoingRequest(
  api: ApiConfig,
  char: { name: string; persona: string },
  userAltNickname: string,
  userAltSignature: string,
  intro: string
): Promise<EvaluationResult> {
  if (!api.chat.baseUrl) return { accepted: true, reply: '好的，我们已经是好友啦！' };
  const sys = `你正在扮演角色「${char.name}」。
人设性格：${char.persona}
现在，有一个陌生的小号（可能是你熟人的试探小号，也可能是真正的陌生人）向你发送好友申请。
申请人昵称：${userAltNickname}
申请人签名：${userAltSignature}
申请验证信息：${intro}

你需要根据你的角色性格、设定，来判断是否要接受他的好友申请，并写一句你通过申请或拒绝申请时的回复。
输出 JSON 格式如下：
{
  "accepted": true/false,
  "reply": "你通过或拒绝时对他说的话（字数简短，50字以内）"
}
只返回 JSON，不要返回任何额外解释！`;

  try {
    return await askAIJson<EvaluationResult>(api, sys, '请评估并返回结果：', { temperature: 0.8, maxTokens: 300 });
  } catch (e) {
    return { accepted: true, reply: `（已自动通过申请。遇到错误：${(e as Error).message}）` };
  }
}

export interface IncomingRequestResult {
  charAltName: string;
  charAltAvatar: string;
  intro: string;
}

export async function generateIncomingRequest(
  api: ApiConfig,
  char: { name: string; persona: string },
  userNickname: string,
  userSignature: string
): Promise<IncomingRequestResult> {
  if (!api.chat.baseUrl) return { charAltName: '神秘网友', charAltAvatar: '🕵️', intro: '你好呀，在吗？' };
  const sys = `你正在扮演角色「${char.name}」。你的设定是：${char.persona}
现在，你要开一个「试探小号（匿名小号）」去主动加用户「${userNickname}」为好友，试图试探/调戏他，看看他的反应。
用户的签名是：${userSignature}

你需要为自己设计：
1. 一个试探小号的名字（不要使用你自己的真名 ${char.name}。可以使用代号，或者假装成他的同学、隔壁班女生、陌生推销员、网友、神秘暗恋者等，比如“神秘少女”、“小猫钓鱼”、“吃货学妹”、“午夜电台”等）
2. 一个契合小号风格的Emoji头像（如 🦊, 🕵️, 🐱, 🌸, 🎮 等单个 emoji 字符）
3. 一句有趣的申请验证信息，字数少于50字，要能吸引用户通过，并充满试探或悬念

输出 JSON 格式如下：
{
  "charAltName": "小号名字",
  "charAltAvatar": "头像单个Emoji",
  "intro": "验证申请信息"
}
只返回 JSON，不要返回任何额外解释！`;

  try {
    return await askAIJson<IncomingRequestResult>(api, sys, '请设计并返回小号试探信息：', { temperature: 0.9, maxTokens: 300 });
  } catch (e) {
    return { charAltName: '匿名小熊', charAltAvatar: '🧸', intro: '哈喽哈喽，通过一下呗？' };
  }
}
