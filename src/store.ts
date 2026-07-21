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
      // 第2页 - 12个图标（填满，memory在倒数第二位，alt_accounts最后）
      ['generator', 'social', 'truth_or_dare', 'period', 'notes_app', 'weather', 'calculator', 'browser', 'diary', 'wallet', 'memory', 'alt_accounts'],
      // 第3页 - 14个图标（memory移走，me移到第一位）
      ['me', 'anniversary', 'group_chat', 'phone_check', 'offline_mode', 'couple_space', 'home_system', 'kitchen', 'turtle_soup', 'games', 'weibo', 'twitter', 'weight', 'discover', 'closet']
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
  squarePosts: [],
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
    if (!raw) return { version: 1, settings: defaultSettings() };
    const parsed = JSON.parse(raw) as PersistShape;
    const defs = defaultSettings();
    if (!parsed.settings) parsed.settings = defs;
    // shallow merge to fill new fields
    parsed.settings = { ...defs, ...parsed.settings };
    parsed.settings.api = { ...defs.api, ...parsed.settings.api };
    // ensure presets/activePresetId exist (added in redesign)
    if (!parsed.settings.presets) parsed.settings.presets = [];
    if (!parsed.settings.activePresetId) parsed.settings.activePresetId = null;
    if (!parsed.settings.friendRequests) parsed.settings.friendRequests = [];
    if (!parsed.settings.memos) parsed.settings.memos = [];
    if (!parsed.settings.diaries) parsed.settings.diaries = [];
    if (!parsed.settings.installedWebApps) parsed.settings.installedWebApps = [];
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
  } catch {
    return { version: 1, settings: defaultSettings() };
  }
}

export function saveState(state: PersistShape) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('save failed', e);
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
