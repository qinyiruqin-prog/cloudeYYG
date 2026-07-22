import type { ID } from './types';

export interface AppMeta {
  id: ID;
  name: string;
  icon: string;
  available: boolean;
  /** a movable ball on desktop that opens a shortcuts sheet */
  shortcutBall?: boolean;
  /** emoji glyph rendered instead of a lucide icon */
  emoji?: string;
}

export const APPS: AppMeta[] = [
  // 原有应用
  { id: 'moments',      name: '朋友圈',  icon: 'Camera',           available: true },
  { id: 'contacts',     name: '通讯录',  icon: 'Contact',          available: true },
  { id: 'sms',          name: '短信',    icon: 'MessageSquare',    available: true },
  { id: 'mail',         name: '邮箱',    icon: 'Mail',             available: true },
  { id: 'waimai',       name: '外卖',    icon: 'UtensilsCrossed',  available: true },
  { id: 'xiaohongshu',  name: '小红书',  icon: 'BookHeart',        available: true },
  { id: 'novel',        name: '小说',    icon: 'BookOpen',         available: true },
  { id: 'shop',         name: '商城',    icon: 'ShoppingBag',      available: true },
  { id: 'me',           name: '我的',    icon: 'UserRound',        available: true }, // 保留用于兼容性
  { id: 'forum',        name: '论坛',    icon: 'MessagesSquare',   available: true },
  { id: 'chat',         name: '聊天',    icon: 'MessageCircle',    available: true },
  { id: 'calendar',     name: '日历',    icon: 'CalendarDays',     available: true },
  { id: 'worldbook',    name: '世界书',  icon: 'BookMarked',       available: true },
  { id: 'generator',    name: '人设生成', icon: 'Sparkles',          available: true },
  { id: 'album',        name: '相册',    icon: 'Images',           available: true },
  { id: 'music',        name: '音乐',    icon: 'Music',            available: true },
  { id: 'social',       name: '广场',    icon: 'Globe',            available: true },
  { id: 'truth_or_dare', name: '真心话大冒险', icon: 'Dice5',      available: true },
  { id: 'period',       name: '经期助手',  icon: 'Heart',          available: true },
  { id: 'notes_app',    name: '备忘录',    icon: 'FileText',       available: true },
  { id: 'diary',        name: '日记',      icon: 'BookOpen',       available: true },
  { id: 'wallet',       name: '钱包',      icon: 'Wallet',         available: true },
  { id: 'weather',      name: '天气',      icon: 'CloudSun',       available: true },
  { id: 'calculator',   name: '计算器',    icon: 'Calculator',     available: true },
  { id: 'browser',      name: '浏览器',    icon: 'Compass',        available: true },

  // v3.0 新增应用
  { id: 'anniversary',    name: '纪念日',     icon: 'Gift',           available: true, emoji: '🎁' },
  { id: 'group_chat',     name: '群聊',       icon: 'Users',          available: false, emoji: '👥' },
  { id: 'phone_check',    name: '查手机',     icon: 'Search',         available: true, emoji: '🔍' },
  { id: 'offline_mode',   name: '线下模式',   icon: 'MapPin',         available: false, emoji: '📍' },
  { id: 'couple_space',   name: '情侣空间',   icon: 'Heart',          available: true, emoji: '💑' },
  { id: 'home_system',    name: '家园',       icon: 'Home',           available: true, emoji: '🏠' },
  { id: 'kitchen',        name: '厨房',       icon: 'ChefHat',        available: true, emoji: '👨‍🍳' },
  { id: 'closet',         name: '衣橱',       icon: 'Shirt',          available: true, emoji: '👔' },
  { id: 'turtle_soup',    name: '海龟汤',     icon: 'Brain',          available: true, emoji: '🐢' },
  { id: 'games',          name: '游戏',       icon: 'Gamepad2',       available: true, emoji: '🎮' },
  { id: 'weibo',          name: '微博',       icon: 'MessageCircle',  available: true, emoji: '📱' },
  { id: 'twitter',        name: 'X',          icon: 'Twitter',        available: true, emoji: '🐦' },
  { id: 'memory',         name: '记忆',       icon: 'Brain',          available: true, emoji: '🧠' },
  { id: 'weight',         name: '体重管理',   icon: 'Scale',          available: true, emoji: '⚖️' },
  { id: 'discover',       name: '发现',       icon: 'Sparkles',       available: true, emoji: '✨' },
  { id: 'alt_accounts',   name: '小号',       icon: 'Users',          available: true, emoji: '👤' },
  { id: 'time_perception', name: '时间感知', icon: 'Clock', available: true, emoji: '⏰' },

  // 快捷球
  { id: 'sheep',        name: '羊羊',    icon: '',                 available: true, shortcutBall: true, emoji: '🐑' },
];

export const APP_MAP: Record<string, AppMeta> = Object.fromEntries(APPS.map((a) => [a.id, a]));
export const getApp = (id: string): AppMeta | undefined => {
  if (id.startsWith('web-')) {
    try {
      const raw = localStorage.getItem('yangyangji:v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        const webApps = parsed?.settings?.installedWebApps || [];
        const found = webApps.find((w: any) => w.id === id);
        if (found) {
          return {
            id: found.id,
            name: found.name,
            icon: 'Globe',
            available: true,
            emoji: found.emoji || '🌐',
            shortcutBall: true,
          };
        }
      }
    } catch (e) {
      console.warn(e);
    }
  }
  return APP_MAP[id];
};

/** ids that live in the dock (not in the grid) */
export const DOCK_IDS = ['chat', 'album', 'music', 'me'];
/** the single shortcut ball */
export const SHORTCUT_BALL_ID = 'sheep';
