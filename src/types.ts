// Global type definitions for 羊羊机

export type ID = string;

/* ---------- Theme ---------- */
export interface ThemeDef {
  id: string;
  name: string;
  vars: Record<string, string>;
}

/* ---------- API config ---------- */
export type ChatApiConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
};
export type VoiceApiConfig = {
  provider: 'minimax' | 'custom';
  baseUrl: string;
  apiKey: string;
  model: string;
};
export type ImageApiConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  stylePrompt: string; // global style prompt prepended to every image generation
};
export interface ApiConfig {
  chat: ChatApiConfig;
  voice: VoiceApiConfig;
  image: ImageApiConfig;
}

/* API presets: named snapshots of chat/voice/image configs */
export type ApiPreset = {
  id: string;
  name: string;
  chat: ChatApiConfig;
  voice: VoiceApiConfig;
  image: ImageApiConfig;
};

/* ---------- User identity ---------- */
export interface UserIdentity {
  id: ID;
  nickname: string;
  avatar?: string; // data URL
  signature: string;
  faceRef?: string; // data URL, face reference image
  imagePromptTemplate: string; // for image generation as this user
  isAlt: boolean; // small account / alt
  parentId?: ID; // if alt, who it belongs to
  createdAt: number;
  // v3.0 新增：扩展字段
  persona?: string; // 用户人设描述（最大50000字符）
  worldbook?: string; // 用户专属世界书（最大50000字符）
  chatPersona?: string; // 聊天时的人设（最大20000字符）
  remark?: string; // 备注名
  onlineName?: string; // 网名
  altAccounts?: ID[]; // 关联的小号列表
}

/* ---------- Partition / pairing ---------- */
export interface Partition {
  id: ID;
  name: string;
  userIds: ID[];
  charIds: ID[];
}

/* ---------- Desktop layout ---------- */
export type WidgetType = 'music' | 'calendar' | 'album';
export interface WidgetDef {
  id: ID;
  type: WidgetType;
  page: number;
}
export interface DesktopLayout {
  pages: ID[][];
  widgets: WidgetDef[];
  wallpaper?: string;
}

/* ---------- Characters (AI personas) ---------- */
export interface Character {
  id: ID;
  name: string;
  avatar?: string;
  signature: string;
  persona: string;      // system prompt describing the character (最大50000字符)
  greeting: string;     // opening message
  partitionId?: ID;
  imagePromptTemplate: string; // appearance prompt for generating images of this character
  faceRef?: string;     // data URL, uploaded face reference image
  balance?: number;     // wallet balance
  createdAt: number;
  // v3.0 新增：扩展字段
  worldbook?: string;   // 角色专属世界书（最大50000字符）
  chatPersona?: string; // 聊天时的人设（最大20000字符，与世界书分离）
  remark?: string;      // 用户给角色设置的备注名
  onlineName?: string;  // 角色的网名
  altAccounts?: ID[];   // 角色的小号列表
  isAlt?: boolean;      // 是否是小号
  parentId?: ID;        // 如果是小号，主号的ID
  coupleAvatar?: string; // 情头（与用户配对的头像）
  phoneLockedBy?: ID;   // 被哪个角色锁定了手机（情侣空间功能）
  homeAddress?: string; // 家园地址（用于同居功能）
  // v3.0 自动档功能
  autoMode?: boolean;   // 是否开启自动档（角色主动发消息、朋友圈等）
  autoModeInterval?: number; // 自动行为间隔（分钟），默认30
  lastAutoActionTime?: number; // 上次自动行为时间
  autoActions?: {
    sendMessage: boolean;    // 主动发消息
    sendMoment: boolean;     // 主动发朋友圈
    sendImage: boolean;      // 主动发图片
    useSocial: boolean;      // 主动使用社交功能（微博、X等）
    useApps: boolean;        // 主动使用其他应用
  };
}

/* ---------- Chat ---------- */
export type InteractionMode = 'online' | 'offline'; // 线上=微信聊天，线下=模拟现实见面
export type MessageMedia =
  | { kind: 'image'; url: string }
  | { kind: 'voice'; url: string; duration?: number; text?: string };
export interface ChatMessage {
  id: ID;
  role: 'user' | 'assistant';
  content: string;
  ts: number;
  media?: MessageMedia[];
  innerThought?: string;
  // v3.0 新增
  deliveryOrder?: DeliveryOrder; // 外卖代付订单
  senderAltId?: ID; // 发送者小号ID（支持用户/角色切换小号发消息）
  mode?: InteractionMode; // 消息的交互模式（线上/线下）
}
export interface ChatThread {
  id: ID;
  characterId: ID;
  userId?: ID; // The user identity who is chatting in this thread
  charAltName?: string; // If this thread is with a character's alt-account, store the fake name
  charAltAvatar?: string; // Optional fake avatar/emoji
  messages: ChatMessage[];
  updatedAt: number;
  // v3.0 新增
  isGroup?: boolean; // 是否是群聊
  groupMembers?: ID[]; // 群成员ID列表（用户+角色）
  groupName?: string; // 群名称
  groupAvatar?: string; // 群头像
  onlineStatus?: 'online' | 'offline' | 'busy'; // 在线状态（查手机功能）
  isChecking?: boolean; // 是否正在被查手机
  interactionMode?: InteractionMode; // 当前会话的交互模式（默认online）
  sharedMemory: ChatMessage[]; // 线上线下共享的记忆（两种模式互通）
}

/* ---------- Friend Request (好友申请) ---------- */
export interface FriendRequest {
  id: ID;
  type: 'incoming' | 'outgoing'; // incoming: Character alt-account testing user; outgoing: User alt-account testing Character
  userId: ID; // Which user identity (could be main or alt-account) this request is for/from
  characterId: ID; // Which AI Character is involved
  charAltName?: string; // If incoming, the fake name/alt-account used by the AI Character to test the user (e.g. "神秘少女")
  charAltAvatar?: string; // Optional fake avatar/emoji
  intro: string; // The verification message / testing message / self-introduction
  status: 'pending' | 'accepted' | 'declined';
  reply?: string; // AI Character's accept/decline quote
  ts: number;
}

/* ---------- Contacts ---------- */
export interface Contact {
  id: ID;
  name: string;
  avatar?: string;
  phone: string;
  signature: string;
  characterId?: ID;  // linked AI character (if any)
  createdAt: number;
  // v3.0 新增
  remark?: string; // 备注名
  onlineName?: string; // 网名
  relationship?: string; // 关系标签（朋友/同事/家人等）
  isStranger?: boolean; // 是否是陌生人（可能感兴趣的人）
  mutualFriends?: number; // 共同好友数量
  canComment?: boolean; // 是否可以互相评论（不认识的角色）
}

/* ---------- SMS ---------- */
export interface SmsMessage {
  id: ID;
  from: 'me' | 'them';
  content: string;
  ts: number;
}
export interface SmsThread {
  id: ID;
  contactId: ID;     // who we're texting
  messages: SmsMessage[];
  updatedAt: number;
}

/* ---------- Mail ---------- */
export interface Mail {
  id: ID;
  from: string;
  to: string;
  subject: string;
  body: string;
  ts: number;
  read: boolean;
  starred: boolean;
  folder: 'inbox' | 'sent' | 'draft' | 'trash';
}

/* ---------- Moments (朋友圈) ---------- */
export interface Moment {
  id: ID;
  authorId: ID;       // user id or character id
  authorName: string;
  authorAvatar?: string;
  text: string;
  images: string[];   // data URLs
  likes: string[];    // names of likers
  comments: { id: ID; authorName: string; text: string; ts: number }[];
  ts: number;
  aiGenerated?: boolean;
}

/* ---------- Xiaohongshu (小红书) ---------- */
export interface Note {
  id: ID;
  title: string;
  authorName: string;
  authorAvatar?: string;
  cover: string;      // image URL
  body: string;
  likes: number;
  collects: number;
  comments: { id: ID; authorName: string; text: string; ts: number }[];
  tags: string[];
  ts: number;
}

/* ---------- Memos (备忘录) ---------- */
export interface MemoNote {
  id: ID;
  title: string;
  content: string;
  category: string;
  updatedAt: number;
}

/* ---------- Diary (日记) ---------- */
export interface DiaryEntry {
  id: ID;
  authorId: ID; // "user" or a Character's ID
  authorName: string;
  authorAvatar?: string;
  title: string;
  content: string;
  keywords?: string[];
  ts: number;
}

/* ---------- Novel (小说) ---------- */
export interface Novel {
  id: ID;
  title: string;
  author: string;
  cover: string;
  chapters: { id: ID; title: string; content: string }[];
  addedAt: number;
  lastReadChapter?: ID;
  lastReadOffset?: number;
  // v3.0 新增
  aiGenerated?: boolean; // 是否AI生成
  genre?: string; // 类型（言情/玄幻/科幻等）
  tags?: string[]; // 标签
  rating?: number; // 评分
  wordCount?: number; // 字数
  status?: 'ongoing' | 'completed'; // 连载状态
}

/* ---------- Shop (商城) ---------- */
export interface Product {
  id: ID;
  name: string;
  price: number;
  originalPrice?: number;
  cover: string;
  images: string[];
  desc: string;
  category: string;
  rating: number;
  sales: number;
  tags: string[];
}
export interface CartItem {
  productId: ID;
  qty: number;
}
export interface Order {
  id: ID;
  items: { productId: ID; name: string; price: number; qty: number; cover: string }[];
  total: number;
  status: 'pending' | 'paid' | 'shipped' | 'done';
  ts: number;
}

/* ---------- Forum (论坛) ---------- */
export interface ForumPost {
  id: ID;
  title: string;
  authorName: string;
  authorAvatar?: string;
  body: string;
  board: string;      // board name
  views: number;
  replies: ForumReply[];
  ts: number;
  pinned?: boolean;
}
export interface ForumReply {
  id: ID;
  authorName: string;
  authorAvatar?: string;
  text: string;
  ts: number;
}

/* ---------- Story events (cross-character plot perception) ---------- */
export interface StoryEvent {
  id: ID;
  characterId: ID;       // the character who should know about this
  sourceThreadId: ID;     // which conversation it came from
  sourceCharName: string;  // the character who mentioned it
  summary: string;        // what happened (e.g. "user told char they went to find NPC")
  ts: number;
  consumed?: boolean;     // whether the target character has acknowledged it
}

/* ---------- Worldbook (世界书) ---------- */
export interface WorldEntry {
  id: ID;
  key: string;        // trigger keyword
  content: string;    // lore text injected when keyword appears (最大50000字符)
  priority: number;
  // v3.0 新增
  type?: 'character' | 'user' | 'global'; // 分类：角色专属/用户专属/全局
  ownerId?: ID;       // 所属角色或用户的ID
  category?: string;  // 分类标签
  enabled?: boolean;  // 是否启用
}

/* ---------- Social / Square (广场) ---------- */
export interface SquarePost {
  id: ID;
  authorName: string;
  authorAvatar?: string;
  text: string;
  image?: string;
  likes: number;
  comments: { id: ID; authorName: string; text: string; ts: number }[];
  ts: number;
  aiGenerated?: boolean;
}

/* ---------- Waimai (外卖) ---------- */
export interface Dish {
  id: ID;
  name: string;
  price: number;
  desc: string;
  image: string;
  popular?: boolean;
}
export interface Restaurant {
  id: ID;
  name: string;
  cover: string;
  rating: number;
  sales: number;
  deliveryFee: number;
  deliveryTime: string;
  tags: string[];
  dishes: Dish[];
}

import type { CalendarEvent } from './apps/CalendarScreen';

/* ---------- v3.0 新增类型 ---------- */

/* 纪念日 */
export interface Anniversary {
  id: ID;
  title: string;
  date: string; // YYYY-MM-DD
  type: 'birthday' | 'anniversary' | 'holiday' | 'custom';
  repeat: boolean; // 是否每年重复
  characterId?: ID; // 关联的角色
  notes?: string;
  reminder?: number; // 提前提醒天数
  ts: number;
}

/* 外卖订单（代付功能） */
export interface DeliveryOrder {
  id: ID;
  restaurantId: ID;
  items: { dishId: ID; name: string; price: number; qty: number }[];
  total: number;
  status: 'pending' | 'paid' | 'preparing' | 'delivering' | 'completed';
  payerId?: ID; // 付款人ID（角色或用户）
  receiverId?: ID; // 收货人ID
  isPaidByOther: boolean; // 是否被代付
  ts: number;
}

/* 线下模式记录 */
export interface OfflineActivity {
  id: ID;
  characterId: ID;
  activityType: 'date' | 'movie' | 'dinner' | 'travel' | 'shopping' | 'custom';
  title: string;
  description: string;
  location?: string;
  photos?: string[]; // 照片
  startTime: number;
  endTime?: number;
  mood?: string;
  tags?: string[];
  ts: number;
}

/* 海龟汤 */
export interface TurtleSoup {
  id: ID;
  title: string; // 谜面
  truth: string; // 真相
  authorId: ID;
  authorName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string; // 分类
  hints?: string[]; // 提示
  questions: { id: ID; question: string; answer: string; askedBy: string; ts: number }[];
  solved: boolean;
  solvedBy?: string;
  ts: number;
}

/* 情侣空间 */
export interface CoupleSpace {
  id: ID;
  userId: ID;
  characterId: ID;
  coupleAvatar1?: string; // 情头1
  coupleAvatar2?: string; // 情头2
  anniversary: string; // 纪念日 YYYY-MM-DD
  loveDays: number; // 恋爱天数
  photos: string[]; // 情侣相册
  timeline: { id: ID; content: string; photos?: string[]; ts: number }[]; // 时间轴
  phoneLocked: boolean; // 手机是否被锁定
  lockedUntil?: number; // 锁定到什么时候
  ts: number;
}

/* 微博/X (原推特) */
export interface SocialPost {
  id: ID;
  platform: 'weibo' | 'twitter';
  authorId: ID;
  authorName: string;
  authorAvatar?: string;
  content: string;
  images?: string[];
  likes: number;
  reposts: number;
  comments: { id: ID; authorName: string; content: string; ts: number }[];
  isHot?: boolean; // 是否热门
  topic?: string; // 话题标签
  ts: number;
}

/* 记忆系统 */
export interface Memory {
  id: ID;
  characterId: ID; // 哪个角色的记忆
  userId?: ID; // 关联的用户
  type: 'important' | 'conversation' | 'event' | 'emotion';
  title: string;
  content: string;
  embedding?: number[]; // 向量嵌入（用于相似度搜索）
  importance: number; // 重要度 0-100
  tags?: string[];
  relatedMemories?: ID[]; // 关联记忆
  ts: number;
  lastAccessed?: number; // 最后访问时间
}

/* 小游戏记录 */
export interface GameRecord {
  id: ID;
  gameType: 'mahjong' | 'doudizhu' | 'poker' | 'custom';
  players: { id: ID; name: string; score: number }[];
  winner?: ID;
  rounds: number;
  startTime: number;
  endTime: number;
  replay?: string; // 回放数据（JSON）
  ts: number;
}

/* 家园系统 */
export interface Home {
  id: ID;
  ownerId: ID; // 房主ID（用户或角色）
  cohabitants?: ID[]; // 同居者列表
  rooms: HomeRoom[];
  furniture: HomeFurniture[];
  packages: HomePackage[]; // 快递包裹
  ts: number;
}

export interface HomeRoom {
  id: ID;
  type: 'kitchen' | 'bedroom' | 'living' | 'bathroom' | 'closet' | 'custom';
  name: string;
  furniture: ID[]; // 房间内的家具ID
  decoration?: string; // 装修风格
}

export interface HomeFurniture {
  id: ID;
  name: string;
  type: 'table' | 'chair' | 'bed' | 'sofa' | 'appliance' | 'decoration';
  icon?: string;
  position?: { x: number; y: number }; // 摆放位置
  functional?: boolean; // 是否有功能（如厨房可以做饭）
}

export interface HomePackage {
  id: ID;
  recipientId: ID; // 收件人
  senderName: string; // 寄件人
  content: string;
  status: 'delivering' | 'arrived' | 'received' | 'helped'; // 是否被代收
  helperName?: string; // 代收人
  arrivedAt?: number;
  ts: number;
}

/* 厨房做饭 */
export interface Recipe {
  id: ID;
  name: string;
  ingredients: { name: string; amount: string }[];
  steps: string[];
  image?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  time: number; // 制作时间（分钟）
  category: string;
}

export interface CookingRecord {
  id: ID;
  recipeId: ID;
  cookId: ID; // 厨师ID
  result: 'success' | 'normal' | 'failed';
  photo?: string;
  taste?: number; // 味道评分
  sharedWith?: ID[]; // 分享给谁
  ts: number;
}

/* 衣橱换装 */
export interface Outfit {
  id: ID;
  name: string;
  characterId?: ID; // 属于哪个角色
  pieces: { type: 'top' | 'bottom' | 'dress' | 'shoes' | 'accessory'; image: string }[];
  style: string; // 风格（休闲/正式/运动等）
  occasion?: string; // 场合
  favorite: boolean;
  ts: number;
}

/* 体重管理 */
export interface WeightRecord {
  id: ID;
  userId: ID;
  weight: number; // kg
  height?: number; // cm
  bmi?: number;
  bodyFat?: number; // 体脂率
  notes?: string;
  mood?: string;
  photo?: string; // 对比照
  ts: number;
}

export interface WeightGoal {
  id: ID;
  userId: ID;
  targetWeight: number;
  startWeight: number;
  currentWeight: number;
  deadline: string; // YYYY-MM-DD
  plan?: string; // 计划
  progress: number; // 进度百分比
  ts: number;
}

/* 打卡目标（日历监督） */
export interface DailyGoal {
  id: ID;
  title: string;
  description?: string;
  characterId?: ID; // 监督的角色
  frequency: 'daily' | 'weekly' | 'custom';
  targetDays?: number[]; // 每周的哪几天（0-6）
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  checkIns: { date: string; checked: boolean; note?: string; encouragement?: string }[];
  rewards?: string; // 完成奖励
  ts: number;
}

/* 角色卡导入格式 */
export interface CharacterCard {
  name: string;
  description?: string;
  personality?: string;
  scenario?: string;
  first_mes?: string;
  mes_example?: string;
  avatar?: string;
  // Tavern格式支持
  spec?: string;
  spec_version?: string;
  data?: {
    name: string;
    description: string;
    personality: string;
    scenario: string;
    first_mes: string;
    mes_example: string;
    [key: string]: any;
  };
}

/* 查手机记录 */
export interface PhoneCheckRecord {
  id: ID;
  checkerId: ID; // 查看者（通常是用户）
  targetId: ID; // 被查看者（角色）
  type: 'chat' | 'moments' | 'album' | 'contacts' | 'full';
  discovered?: string[]; // 发现的内容
  caught: boolean; // 是否被发现
  reaction?: string; // 角色反应
  ts: number;
}

export interface WalletTransaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  fromName: string;
  toName: string;
  category: string; // e.g. "系统发放", "转账", "购买外卖", "聊天打赏", "小说订阅"
  description: string;
  ts: number;
}

/* ---------- App settings ---------- */
export interface AppSettings {
  themeId: string;
  api: ApiConfig;
  users: UserIdentity[];
  activeUserId: ID | null;
  presets: ApiPreset[];
  activePresetId: ID | null;
  partitions: Partition[];
  desktop: DesktopLayout;
  // imported local assets
  music: MusicTrack[];
  albumImages: AlbumImage[];
  // user-created data
  calendarEvents: CalendarEvent[];
  characters: Character[];
  autoNpc: boolean;
  activeInteractMode?: 'manual' | 'auto';
  activeInteractEnabled?: boolean;
  storyEvents: StoryEvent[];
  chatThreads: ChatThread[];
  contacts: Contact[];
  smsThreads: SmsThread[];
  mails: Mail[];
  moments: Moment[];
  notes: Note[];
  memos?: MemoNote[];
  diaries?: DiaryEntry[];
  novels: Novel[];
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  forumPosts: ForumPost[];
  worldEntries: WorldEntry[];
  squarePosts: SquarePost[];
  restaurants: Restaurant[];
  friendRequests?: FriendRequest[];
  fontSize?: 'md' | 'lg' | 'xl';
  notifSoundEnabled?: boolean;
  notifProactiveFrequency?: 'high' | 'medium' | 'low' | 'off';
  periodRecords?: PeriodRecord[];
  periodCycleDays?: number;
  periodDurationDays?: number;
  userBalance?: number;
  walletFlows?: WalletTransaction[];
  installedWebApps?: InstalledWebApp[];

  // v3.0 新增功能数据
  anniversaries?: Anniversary[]; // 纪念日
  deliveryOrders?: DeliveryOrder[]; // 外卖订单
  offlineActivities?: OfflineActivity[]; // 线下模式
  turtleSoups?: TurtleSoup[]; // 海龟汤
  coupleSpaces?: CoupleSpace[]; // 情侣空间
  socialPosts?: SocialPost[]; // 微博/Twitter
  memories?: Memory[]; // 记忆系统
  gameRecords?: GameRecord[]; // 游戏记录
  homes?: Home[]; // 家园
  recipes?: Recipe[]; // 菜谱
  cookingRecords?: CookingRecord[]; // 做饭记录
  outfits?: Outfit[]; // 衣橱
  weightRecords?: WeightRecord[]; // 体重记录
  weightGoals?: WeightGoal[]; // 体重目标
  dailyGoals?: DailyGoal[]; // 打卡目标
  phoneCheckRecords?: PhoneCheckRecord[]; // 查手机记录

  // 功能开关
  offlineMode?: boolean; // 线下模式开关
  enableVectorMemory?: boolean; // 向量记忆开关
  swipeBackEnabled?: boolean; // 侧边滑动返回
  floatingBallEnabled?: boolean; // 悬浮球
  innerThoughtOpacity?: number; // 心声透明度 0-1
  autoSaveCharImages?: boolean; // 自动保存角色发送的图片到相册

  // v3.0 自动刷新系统
  autoRefreshEnabled?: boolean; // 是否开启全局自动刷新
  autoRefreshInterval?: number; // 自动刷新间隔（秒），默认300（5分钟）
  lastAutoRefreshTime?: number; // 上次自动刷新时间
  manualRefreshEnabled?: boolean; // 是否允许手动刷新（始终为true）
}

export interface InstalledWebApp {
  id: string;
  name: string;
  url: string;
  emoji: string;
}

export interface PeriodRecord {
  id: ID;
  startDate: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  symptoms: string[];
  flow?: 'light' | 'medium' | 'heavy';
  mood?: string;
  notes?: string;
  ts: number;
}

export interface MusicTrack {
  id: ID;
  name: string;
  artist?: string;
  url: string;
  duration?: number;
}

export interface AlbumImage {
  id: ID;
  url: string;
  tag?: string;
}

/* ---------- Persistence shape ---------- */
export interface PersistShape {
  version: number;
  settings: AppSettings;
}
