import { useState } from 'react';
import { Send, Zap, Key, BookOpen, MessageCircle, Music, Calendar, Brain } from 'lucide-react';
import { AppScreen } from '../components/AppScreen';
import { ListGroup, Row } from '../components/ui';
import { Modal } from '../components/Sheet';
import type { ApiConfig, AppSettings } from '../types';

type Msg = { role: 'user' | 'assistant'; content: string };

const QUICK_ITEMS = [
  { id: 'assistant', label: '羊羊助手', desc: '羊羊机使用问题随时问我', icon: '🐑', color: '#8b5cf6' },
  { id: 'apiPreset', label: '快速换 API 预设', desc: '一键切换不同 API 配置', icon: '⚡', color: '#f59e0b' },
  { id: 'chat', label: '聊天', desc: '与 AI 角色一对一对话', icon: '💬', color: '#3b82f6' },
  { id: 'contacts', label: '通讯录', desc: '管理联系人和 AI 角色', icon: '📇', color: '#10b981' },
  { id: 'worldbook', label: '世界书', desc: '配置游戏中世界观设定', icon: '📖', color: '#ec4899' },
  { id: 'generator', label: '人设生成', desc: 'AI 自动生成角色人设', icon: '🔮', color: '#6366f1' },
  { id: 'period', label: '经期助手', desc: '记录生理周期与健康', icon: '❤️', color: '#f472b6' },
  { id: 'me', label: '我的', desc: '管理用户身份和设置', icon: '👤', color: '#6b7280' },
];

const WELCOME_MSG: Msg = {
  role: 'assistant',
  content: '你好呀，我是羊羊助手！🐑\n\n欢迎使用羊羊机——一个网页版手机风格 AI 角色聊天系统。\n\n我对羊羊机的各种功能都很熟悉，有什么关于使用羊羊机的问题尽管问我。\n\n你也可以点击下方的快捷入口快速跳转到对应功能。',
};

export function AssistantScreen({
  api,
  settings,
  onOpenApp,
  onBack,
}: {
  api: ApiConfig;
  settings?: AppSettings;
  onOpenApp?: (id: string) => void;
  onBack: () => void;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const next = [...msgs, { role: 'user' as const, content: text }];
    setMsgs(next);
    setLoading(true);
    try {
      const reply = await callChat(api.chat, next);
      setMsgs([...next, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMsgs([...next, { role: 'assistant', content: `出错了：${(e as Error).message}。请先在「API 预设」或「我的 → API 配置中心」配置 Chat 接口。` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen title="羊羊" onBack={onBack} noPad>
      <div className="flex flex-col h-full">
        {/* 快捷入口网格 */}
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <div className="text-[12px] txt-faint mb-2">快捷入口</div>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => onOpenApp?.(item.id)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl glass hover:border-[var(--accent)]/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[20px]" style={{ background: `${item.color}15` }}>
                  {item.icon}
                </div>
                <span className="text-[11px] text-center leading-tight">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 对话区域 */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3 space-y-3">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-[14px] leading-relaxed ${
                  m.role === 'user' ? 'rounded-br-md text-white' : 'glass rounded-bl-md'
                }`}
                style={m.role === 'user' ? { background: 'var(--accent)', color: 'var(--bg)' } : undefined}
              >
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="glass rounded-2xl rounded-bl-md px-3.5 py-3 flex items-center gap-1">
                {[0,1,2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-current txt-faint animate-pulse-soft" style={{ animationDelay: `${i*0.2}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="px-3 py-2 border-t border-[var(--border)] flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="问点什么…"
            className="flex-1 glass rounded-full px-4 h-10 text-[14px] outline-none bg-transparent placeholder:text-[var(--text-faint)]"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="tap w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40"
            style={{ background: 'var(--accent)', color: 'var(--bg)' }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </AppScreen>
  );
}

async function callChat(chat: ApiConfig['chat'], history: Msg[]): Promise<string> {
  if (!chat.baseUrl) throw new Error('未配置 Chat API');
  const base = chat.baseUrl.replace(/\/+$/, '');

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${chat.apiKey}`
      },
      body: JSON.stringify({
        model: chat.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: '你是「羊羊助手」，羊羊机（一个网页版手机风格 AI 角色聊天系统）的内置帮助助手。你对羊羊机的功能了如指掌，专门解答用户关于羊羊机使用方法的问题。\n\n羊羊机的主要功能模块包括：\n- 桌面框架：仿手机桌面，多页滑动、小组件（音乐/日历/相册）、快捷方式球\n- API 配置中心：配置 Chat/语音/绘图 三类 OpenAI 兼容接口，支持「拉取」按钮自动获取可用模型列表\n- API 预设：保存多套 API 配置一键切换\n- 主题：多种主题可切换（深夜/月光/石灰/薄雾/樱花/天青/暖沙/浅金/薰衣草/霜蓝/竹影/日落/海洋/玫瑰/薄荷/蜜桃/梦幻/云雾等）\n- 用户身份：创建多个身份（含头像、签名、绘图模板），可设主副号\n- 分区与对应关系：将用户与角色分组管理\n- 本地资源：导入本地音乐和图片\n- 数据备份：导出/导入全部数据\n- 通讯录：管理联系人，可关联 AI 角色，发起聊天或短信\n- 聊天 / 短信：与 AI 角色对话，支持短信模式、群聊、线上/线下模式\n- 朋友圈 / 小红书 / 论坛 / 广场：AI 生成内容的社交场景\n- 小说：阅读小说并记录进度\n- 商城 / 外卖：模拟购物与点餐\n- 世界书：配置关键词触发的世界观设定，聊天中自动注入\n- 音乐 / 相册：本地资源播放与浏览\n- 人设生成：三种生成器（用户人设/虚拟人设/世界书），支持200-20000字\n- 经期助手：记录生理周期，AI 角色主动关怀\n- 表情包：导入图床链接发送表情\n- 视频/语音通话：模拟真实手机通话\n\n回答要精炼友好，用中文。如果用户问的不是羊羊机相关问题，可以简短引导回羊羊机话题。' },
          ...history.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '未知错误');
      throw new Error(`API请求失败 (HTTP ${res.status}): ${errorText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '(空回复)';
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查API地址是否正确或网络是否正常');
    }
    throw error;
  }
}
