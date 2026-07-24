import type { AppSettings, PersistShape } from './types';

const KEY = 'yangyangji:v1';

export const defaultSettings = (): AppSettings => ({
  themeId: 'midnight',
  api: {
    chat: { baseUrl: '', apiKey: '', model: '' },
    voice: { provider: 'minimax', baseUrl: '', apiKey: '', model: '' },
    image: { baseUrl: '', apiKey: '', model: '', stylePrompt: '' },
  },
  users: [],
  activeUserId: null,
  presets: [],
  activePresetId: null,
  partitions: [],
  desktop: {
    pages: [
      // 第1页 - 11个图标
      ['moments', 'contacts', 'sms', 'mail', 'waimai', 'xiaohongshu', 'novel', 'shop', 'forum', 'calendar', 'worldbook'],
      // 第2页 - 12个图标（account_manager在最后）
      ['generator', 'social', 'truth_or_dare', 'period', 'notes_app', 'weather', 'calculator', 'browser', 'diary', 'wallet', 'memory', 'account_manager'],
      // 第3页 - 14个图标
      ['me', 'anniversary', 'group_chat', 'phone_check', 'couple_space', 'home_system', 'kitchen', 'turtle_soup', 'games', 'weibo', 'twitter', 'weight', 'discover', 'closet', 'time_perception']
    ],
    widgets: [
      // 第1页小部件
      { id: 'weather-widget', type: 'weather', page: 0, position: { x: 0, y: 0 }, size: { w: 2, h: 1 } },
      { id: 'calendar-widget', type: 'calendar', page: 0, position: { x: 2, y: 0 }, size: { w: 2, h: 1 } },

      // 第2页小部件
      { id: 'memo-widget', type: 'memo', page: 1, position: { x: 0, y: 0 }, size: { w: 2, h: 1 } },
      { id: 'todo-widget', type: 'todo', page: 1, position: { x: 2, y: 0 }, size: { w: 2, h: 1 } },

      // 第3页小部件
      { id: 'clock-widget', type: 'clock', page: 2, position: { x: 0, y: 0 }, size: { w: 2, h: 1 } },
      { id: 'battery-widget', type: 'battery', page: 2, position: { x: 2, y: 0 }, size: { w: 2, h: 1 } },

      // 第4页小部件（v3.0新功能）
      { id: 'music-widget', type: 'music', page: 3, position: { x: 0, y: 0 }, size: { w: 2, h: 1 } },
      { id: 'shortcuts-widget', type: 'shortcuts', page: 3, position: { x: 2, y: 0 }, size: { w: 2, h: 1 } },

      // 第5页小部件（统计和快捷）
      { id: 'stats-widget', type: 'stats', page: 4, position: { x: 0, y: 0 }, size: { w: 2, h: 1 } },
      { id: 'recent-widget', type: 'recent', page: 4, position: { x: 2, y: 0 }, size: { w: 2, h: 1 } },
    ],
  },
  music: [],
  albumImages: [],
  calendarEvents: [],
  characters: [],
  autoNpc: true,
  activeInteractMode: 'manual',
  activeInteractEnabled: true,
  storyEvents: [],
  chatThreads: [],
  contacts: [],
  smsThreads: [],
  mails: [],
  moments: [],
  notes: [],
  memos: [],
  diaries: [],
  novels: [],
  products: [],
  cart: [],
  orders: [],
  forumPosts: [],
  worldEntries: [],
  squarePosts: [
    {
      id: 'square-init-1',
      authorName: '路过的云',
      authorAvatar: '☁️',
      text: '今天天气真好！阳光明媚，心情也跟着好起来了 ☀️',
      likes: 12,
      comments: [
        { id: 'sq-c1', authorName: '微风', text: '确实！出去走走吧', ts: Date.now() - 2 * 3600 * 1000 }
      ],
      ts: Date.now() - 5 * 3600 * 1000,
      aiGenerated: false
    },
    {
      id: 'square-init-2',
      authorName: '夜猫子',
      authorAvatar: '🦉',
      text: '深夜食堂营业中...有人一起吃夜宵吗 🍜',
      imageDescription: '温馨的深夜拉面店，暖黄色灯光',
      likes: 23,
      comments: [],
      ts: Date.now() - 8 * 3600 * 1000,
      aiGenerated: false
    },
    {
      id: 'square-init-3',
      authorName: '书虫',
      authorAvatar: '📚',
      text: '刚读完一本好书，推荐给大家！#读书分享',
      likes: 8,
      comments: [
        { id: 'sq-c2', authorName: '爱书人', text: '什么书？求书名！', ts: Date.now() - 6 * 3600 * 1000 }
      ],
      ts: Date.now() - 12 * 3600 * 1000,
      aiGenerated: false
    }
  ],
  socialPosts: [
    // 微博预置帖子
    {
      id: 'weibo-init-1',
      platform: 'weibo',
      authorId: 'weibo-user-1',
      authorName: '美食探店家',
      authorAvatar: '🍜',
      content: '今天打卡了一家超赞的日料店！新鲜的三文鱼简直入口即化 🍣✨ #美食推荐 #日料',
      imageDescription: '精致的日式料理拼盘，三文鱼刺身特写',
      likes: 156,
      reposts: 23,
      comments: [
        { id: 'wb-c1', authorName: '吃货小王', content: '地址在哪？我也想去！', ts: Date.now() - 2 * 3600 * 1000 }
      ],
      isHot: true,
      topic: '美食推荐',
      ts: Date.now() - 4 * 3600 * 1000
    },
    {
      id: 'weibo-init-2',
      platform: 'weibo',
      authorId: 'weibo-user-2',
      authorName: '旅行达人',
      authorAvatar: '✈️',
      content: '周末去爬山啦！山顶的风景真的太美了，空气清新，心情舒畅 🏔️ #周末去哪玩',
      imageDescription: '山顶俯瞰城市全景，蓝天白云',
      likes: 89,
      reposts: 12,
      comments: [],
      topic: '周末去哪玩',
      ts: Date.now() - 10 * 3600 * 1000
    },
    {
      id: 'weibo-init-3',
      platform: 'weibo',
      authorId: 'weibo-user-3',
      authorName: '数码科技',
      authorAvatar: '💻',
      content: '新入手的耳机音质真不错！降噪效果也很棒，推荐给需要的朋友们 🎧',
      likes: 67,
      reposts: 8,
      comments: [
        { id: 'wb-c2', authorName: '科技迷', content: '什么牌子的？多少钱？', ts: Date.now() - 5 * 3600 * 1000 }
      ],
      ts: Date.now() - 15 * 3600 * 1000
    },
    // 推特预置帖子
    {
      id: 'twitter-init-1',
      platform: 'twitter',
      authorId: 'twitter-user-1',
      authorName: 'CodeNinja',
      authorAvatar: '👨‍💻',
      content: 'Just shipped a new feature! 🚀 Feeling productive today #coding #developer',
      likes: 42,
      reposts: 7,
      comments: [],
      ts: Date.now() - 3 * 3600 * 1000
    },
    {
      id: 'twitter-init-2',
      platform: 'twitter',
      authorId: 'twitter-user-2',
      authorName: 'CoffeeLover',
      authorAvatar: '☕',
      content: 'Morning coffee hits different when the sun is shining ☀️✨',
      imageDescription: '一杯精美的拿铁咖啡，阳光洒在桌面上',
      likes: 128,
      reposts: 15,
      comments: [
        { id: 'tw-c1', authorName: 'BaristaLife', content: 'Looks amazing! ☕', ts: Date.now() - 1 * 3600 * 1000 }
      ],
      ts: Date.now() - 6 * 3600 * 1000
    },
    {
      id: 'twitter-init-3',
      platform: 'twitter',
      authorId: 'twitter-user-3',
      authorName: 'MusicVibes',
      authorAvatar: '🎵',
      content: 'New playlist for the weekend! Perfect for chilling 🎶 #music #weekend',
      likes: 91,
      reposts: 23,
      comments: [],
      ts: Date.now() - 9 * 3600 * 1000
    }
  ],
  restaurants: [],
  friendRequests: [],
  periodRecords: [],
  periodCycleDays: 28,
  periodDurationDays: 5,
  userBalance: 5240,
  walletFlows: [
    {
      id: 'flow-init-1',
      type: 'income',
      amount: 5000,
      fromName: '系统银行',
      toName: '我的钱包',
      category: '系统发放',
      description: '羊羊机账户初始化赠送基础资金',
      ts: Date.now() - 4 * 24 * 3600 * 1000
    },
    {
      id: 'flow-init-2',
      type: 'income',
      amount: 300,
      fromName: '主线任务',
      toName: '我的钱包',
      category: '每日签到',
      description: '连续登录羊羊机4天福利礼包',
      ts: Date.now() - 2 * 24 * 3600 * 1000
    },
    {
      id: 'flow-init-3',
      type: 'expense',
      amount: 60,
      fromName: '我的钱包',
      toName: '外卖商家',
      category: '购买外卖',
      description: '点了份香辣烤鱼外卖单人套餐',
      ts: Date.now() - 1 * 24 * 3600 * 1000
    }
  ]
});

export function loadState(): PersistShape {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      console.log('📂 首次加载，使用默认设置');
      return { version: 1, settings: defaultSettings() };
    }
    const parsed = JSON.parse(raw) as PersistShape;
    const defs = defaultSettings();
    if (!parsed.settings) parsed.settings = defs;

    // 深度合并，确保所有字段都存在
    parsed.settings = { ...defs, ...parsed.settings };
    parsed.settings.api = { ...defs.api, ...parsed.settings.api };

    // 确保关键数组字段存在且是数组
    if (!Array.isArray(parsed.settings.characters)) parsed.settings.characters = [];
    if (!Array.isArray(parsed.settings.worldEntries)) parsed.settings.worldEntries = [];
    if (!Array.isArray(parsed.settings.forumPosts)) parsed.settings.forumPosts = [];

    console.log(`📂 加载数据: 角色 ${parsed.settings.characters.length} 个, 世界书 ${parsed.settings.worldEntries.length} 条, 论坛帖子 ${parsed.settings.forumPosts.length} 个`);

    // ensure presets/activePresetId exist (added in redesign)
    if (!parsed.settings.presets) parsed.settings.presets = [];
    if (!parsed.settings.activePresetId) parsed.settings.activePresetId = null;
    if (!parsed.settings.friendRequests) parsed.settings.friendRequests = [];
    if (!parsed.settings.memos) parsed.settings.memos = [];
    if (!parsed.settings.diaries) parsed.settings.diaries = [];
    if (!parsed.settings.installedWebApps) parsed.settings.installedWebApps = [];

    // 确保社交媒体帖子存在
    if (!parsed.settings.squarePosts || parsed.settings.squarePosts.length === 0) {
      parsed.settings.squarePosts = defs.squarePosts;
    }
    if (!parsed.settings.socialPosts || parsed.settings.socialPosts.length === 0) {
      parsed.settings.socialPosts = defs.socialPosts;
    }

    if (!parsed.settings.users || parsed.settings.users.length === 0) {
      const defaultUser = {
        id: 'default-owner',
        nickname: '主人',
        signature: '好好生活，慢慢相遇',
        imagePromptTemplate: '一个温和的年轻读者',
        isAlt: false,
        createdAt: Date.now(),
      };
      parsed.settings.users = [defaultUser];
      parsed.settings.activeUserId = defaultUser.id;
    }
    // ensure desktop has valid pages with known app ids; refresh if stale
    const known = new Set([...defs.desktop.pages.flat(), 'sheep', 'generator', 'period', 'notes_app', 'weather', 'calculator', 'browser', 'diary', 'wallet']);
    const pages = parsed.settings.desktop?.pages ?? [];
    const allValid = pages.length === 3 && pages.every((p) => p.every((id) => known.has(id) || id.startsWith('web-')));
    if (!allValid) {
      parsed.settings.desktop = defs.desktop;
    }
    // ensure shortcut ball is present on page 1 (first page)
    if (!parsed.settings.desktop.pages[0]?.includes('sheep')) {
      const p0 = [...(parsed.settings.desktop.pages[0] ?? [])];
      p0.unshift('sheep');
      parsed.settings.desktop.pages[0] = p0;
    }
    // migrate: add generator app to desktop if missing
    const allIds = parsed.settings.desktop.pages.flat();
    if (!allIds.includes('generator')) {
      const last = parsed.settings.desktop.pages.length - 1;
      parsed.settings.desktop.pages[last] = [...(parsed.settings.desktop.pages[last] ?? []), 'generator'];
    }
    // migrate: add diary app to desktop if missing
    if (!allIds.includes('diary')) {
      const last = parsed.settings.desktop.pages.length - 1;
      parsed.settings.desktop.pages[last] = [...(parsed.settings.desktop.pages[last] ?? []), 'diary'];
    }
    // migrate: add wallet app to desktop if missing
    if (!allIds.includes('wallet')) {
      const last = parsed.settings.desktop.pages.length - 1;
      parsed.settings.desktop.pages[last] = [...(parsed.settings.desktop.pages[last] ?? []), 'wallet'];
    }
    // migrate: add kitchen app to desktop if missing
    if (!allIds.includes('kitchen')) {
      // 添加到第4页（索引3）
      const targetPage = 3;
      if (parsed.settings.desktop.pages[targetPage]) {
        parsed.settings.desktop.pages[targetPage] = [...parsed.settings.desktop.pages[targetPage], 'kitchen'];
      } else {
        const last = parsed.settings.desktop.pages.length - 1;
        parsed.settings.desktop.pages[last] = [...(parsed.settings.desktop.pages[last] ?? []), 'kitchen'];
      }
    }
    // migrate: wallet settings
    if (parsed.settings.userBalance === undefined) parsed.settings.userBalance = defs.userBalance;
    if (parsed.settings.walletFlows === undefined) parsed.settings.walletFlows = defs.walletFlows;

    // migrate: image config stylePrompt field
    parsed.settings.api.image = { ...defs.api.image, ...parsed.settings.api.image };
    if (typeof parsed.settings.api.image.stylePrompt !== 'string') parsed.settings.api.image.stylePrompt = '';
    // migrate: character imagePromptTemplate / faceRef fields
    parsed.settings.characters = parsed.settings.characters.map((c, idx) => ({
      ...c,
      imagePromptTemplate: typeof c.imagePromptTemplate === 'string' ? c.imagePromptTemplate : '',
      faceRef: c.faceRef,
      balance: typeof c.balance === 'number' ? c.balance : 1500 + (idx * 250) % 1200,
    }));
    return parsed;
  } catch (err) {
    console.error('❌ 加载数据失败:', err);
    return { version: 1, settings: defaultSettings() };
  }
}

export function saveState(state: PersistShape) {
  try {
    const serialized = JSON.stringify(state);
    const sizeInMB = (new Blob([serialized]).size / 1024 / 1024).toFixed(2);
    console.log(`[💾 保存] 数据大小: ${sizeInMB}MB, 角色数: ${state.settings.characters?.length || 0}, 世界书条目: ${state.settings.worldEntries?.length || 0}`);
    localStorage.setItem(KEY, serialized);
    console.log('✅ 数据保存成功');
  } catch (e) {
    console.error('❌ 保存失败:', e);
    // 如果是 QuotaExceededError，尝试清理旧数据
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      alert('存储空间不足！数据可能无法保存。请导出备份后清理数据。');
    } else {
      console.warn('save failed', e);
    }
  }
}

export function clearState() {
  localStorage.removeItem(KEY);
}

/* ---------- export / import a single backup file ---------- */
export function exportData(state: PersistShape): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  a.download = `yangyangji-backup-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function importData(file: File): Promise<PersistShape> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as PersistShape;
        if (!parsed.settings) throw new Error('文件格式不正确');
        resolve(parsed);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
