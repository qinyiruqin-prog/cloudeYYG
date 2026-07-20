import type { Character, ChatMessage, Moment, AppSettings } from './types';
import { callChatRich, generateImage } from './api';

/**
 * 角色自动行为系统
 * 负责处理角色的主动行为：发消息、发朋友圈、发图片等
 */

export interface AutoActionResult {
  type: 'message' | 'moment' | 'image' | 'social' | 'app';
  characterId: string;
  content?: string;
  media?: { kind: 'image'; url: string }[];
  targetApp?: string;
  timestamp: number;
}

/**
 * 检查角色是否应该执行自动行为
 */
export function shouldCharacterAct(char: Character, now: number): boolean {
  if (!char.autoMode) return false;

  const interval = (char.autoModeInterval || 30) * 60 * 1000; // 转换为毫秒
  const lastAction = char.lastAutoActionTime || 0;

  return now - lastAction >= interval;
}

/**
 * 决定角色应该执行什么行为
 */
export function decideAction(char: Character): AutoActionResult['type'] {
  const actions = char.autoActions || {
    sendMessage: true,
    sendMoment: true,
    sendImage: true,
    useSocial: true,
    useApps: true,
  };

  // 收集启用的行为
  const enabledActions: AutoActionResult['type'][] = [];
  if (actions.sendMessage) enabledActions.push('message');
  if (actions.sendMoment) enabledActions.push('moment');
  if (actions.sendImage) enabledActions.push('image');
  if (actions.useSocial) enabledActions.push('social');
  if (actions.useApps) enabledActions.push('app');

  if (enabledActions.length === 0) return 'message'; // 默认发消息

  // 随机选择一个行为
  return enabledActions[Math.floor(Math.random() * enabledActions.length)];
}

/**
 * 生成角色主动发送的消息
 */
export async function generateAutoMessage(
  char: Character,
  settings: AppSettings
): Promise<string> {
  const prompt = `你现在是${char.name}。根据你的人设和当前情境，主动给用户发一条消息。

人设：${char.chatPersona || char.persona}

要求：
- 自然、真实，符合角色性格
- 可以是问候、分享、询问、闲聊等
- 100字以内
- 不要太频繁地问相同的问题
- 可以根据时间（${new Date().getHours()}点）调整内容

直接输出消息内容，不要任何前缀。`;

  try {
    const response = await callChatRich(
      [{ role: 'user', content: prompt }],
      settings.api.chat,
      false
    );
    return response.text || '在吗？';
  } catch (err) {
    console.error('生成自动消息失败:', err);
    return '在干嘛呢？';
  }
}

/**
 * 生成角色主动发送的朋友圈
 */
export async function generateAutoMoment(
  char: Character,
  settings: AppSettings
): Promise<{ text: string; shouldGenerateImage: boolean }> {
  const prompt = `你现在是${char.name}。根据你的人设，发一条朋友圈动态。

人设：${char.chatPersona || char.persona}

要求：
- 真实、生活化
- 可以是心情、照片、分享、吐槽等
- 150字以内
- 如果适合配图（风景、自拍、美食等），在末尾加上[配图]

直接输出朋友圈内容。`;

  try {
    const response = await callChatRich(
      [{ role: 'user', content: prompt }],
      settings.api.chat,
      false
    );

    const text = response.text || '今天天气不错~';
    const shouldGenerateImage = text.includes('[配图]');

    return {
      text: text.replace('[配图]', '').trim(),
      shouldGenerateImage,
    };
  } catch (err) {
    console.error('生成自动朋友圈失败:', err);
    return { text: '心情不错~', shouldGenerateImage: false };
  }
}

/**
 * 为角色生成图片
 */
export async function generateAutoImage(
  char: Character,
  settings: AppSettings,
  context: string
): Promise<string | null> {
  const prompt = `${char.imagePromptTemplate}, ${context}`;

  try {
    const imageUrl = await generateImage(prompt, settings.api.image);
    return imageUrl;
  } catch (err) {
    console.error('生成自动图片失败:', err);
    return null;
  }
}

/**
 * 执行角色的自动行为
 */
export async function executeAutoAction(
  char: Character,
  actionType: AutoActionResult['type'],
  settings: AppSettings
): Promise<AutoActionResult> {
  const now = Date.now();

  switch (actionType) {
    case 'message': {
      const content = await generateAutoMessage(char, settings);
      return {
        type: 'message',
        characterId: char.id,
        content,
        timestamp: now,
      };
    }

    case 'moment': {
      const { text, shouldGenerateImage } = await generateAutoMoment(char, settings);
      let media: { kind: 'image'; url: string }[] | undefined;

      if (shouldGenerateImage) {
        const imageUrl = await generateAutoImage(char, settings, text);
        if (imageUrl) {
          media = [{ kind: 'image', url: imageUrl }];
        }
      }

      return {
        type: 'moment',
        characterId: char.id,
        content: text,
        media,
        timestamp: now,
      };
    }

    case 'image': {
      const content = await generateAutoMessage(char, settings);
      const imageUrl = await generateAutoImage(char, settings, '日常生活照片');

      return {
        type: 'message',
        characterId: char.id,
        content,
        media: imageUrl ? [{ kind: 'image', url: imageUrl }] : undefined,
        timestamp: now,
      };
    }

    case 'social': {
      // 微博/Twitter等社交平台
      const { text } = await generateAutoMoment(char, settings);
      return {
        type: 'social',
        characterId: char.id,
        content: text,
        targetApp: 'weibo',
        timestamp: now,
      };
    }

    case 'app': {
      // 使用其他应用（外卖、购物等）
      const content = await generateAutoMessage(char, settings);
      return {
        type: 'app',
        characterId: char.id,
        content,
        targetApp: 'waimai',
        timestamp: now,
      };
    }

    default:
      return {
        type: 'message',
        characterId: char.id,
        content: '在吗？',
        timestamp: now,
      };
  }
}

/**
 * 处理所有角色的自动行为
 */
export async function processAllAutoActions(
  settings: AppSettings
): Promise<AutoActionResult[]> {
  const now = Date.now();
  const results: AutoActionResult[] = [];

  for (const char of settings.characters) {
    if (shouldCharacterAct(char, now)) {
      const actionType = decideAction(char);
      try {
        const result = await executeAutoAction(char, actionType, settings);
        results.push(result);

        // 更新角色的上次行为时间
        char.lastAutoActionTime = now;
      } catch (err) {
        console.error(`角色 ${char.name} 自动行为执行失败:`, err);
      }
    }
  }

  return results;
}

/**
 * 检查是否应该执行自动刷新
 */
export function shouldAutoRefresh(settings: AppSettings, now: number): boolean {
  if (!settings.autoRefreshEnabled) return false;

  const interval = (settings.autoRefreshInterval || 300) * 1000; // 默认5分钟
  const lastRefresh = settings.lastAutoRefreshTime || 0;

  return now - lastRefresh >= interval;
}
