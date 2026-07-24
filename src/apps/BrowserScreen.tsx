import { useState, useEffect } from 'react';
import { Search, RefreshCw, ArrowLeft, ArrowRight, Home, Globe, ThumbsUp, MessageCircle, Share2 } from 'lucide-react';
import { AppScreen } from '../components/AppScreen';
import { askAIJson, askAI } from '../api';
import type { ApiConfig } from '../types';

interface SimulatedPage {
  title: string;
  header: string;
  content: Array<{
    type: 'text' | 'image' | 'link' | 'comment';
    data: any;
  }>;
}

interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  likes: number;
  time: string;
}

const BOOKMARKS = [
  { name: '羊羊百科', url: 'https://wiki.yangyang.com', emoji: '📖', desc: '了解羊羊机的世界设定' },
  { name: '今日吐槽', url: 'https://news.tucao.net', emoji: '📰', desc: '全网最犀利的热门吐槽' },
  { name: '猫咪论坛', url: 'https://cat.meow.com', emoji: '🐱', desc: '云吸猫与吸狗爱好者基地' },
  { name: 'AI 乌托邦', url: 'https://ai.utopia.org', emoji: '✨', desc: '探索赛博意识的交汇处' },
];

export function BrowserScreen({
  api,
  initialUrl,
  onBack,
}: {
  api: ApiConfig;
  settings?: any;
  updateSettings?: any;
  initialUrl?: string;
  onBack: () => void;
}) {
  const [url, setUrl] = useState(initialUrl || '');
  const [currentUrl, setCurrentUrl] = useState(initialUrl || '');
  const [pageData, setPageData] = useState<SimulatedPage | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>(initialUrl ? [initialUrl] : []);
  const [historyIndex, setHistoryIndex] = useState(initialUrl ? 0 : -1);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (initialUrl) {
      navigateTo(initialUrl);
    }
  }, [initialUrl]);

  const navigateTo = async (targetUrl: string, addToHistory = true) => {
    let cleanUrl = targetUrl.trim();
    if (!cleanUrl) return;

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    setUrl(cleanUrl);
    setCurrentUrl(cleanUrl);
    setLoading(true);
    setPageData(null);
    setShowComments(false);

    // 更新历史记录
    if (addToHistory) {
      const nextHistory = history.slice(0, historyIndex + 1);
      nextHistory.push(cleanUrl);
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
    }

    // 使用AI生成真实的网页内容
    try {
      const prompt = `请模拟这个网址的内容：${cleanUrl}

生成一个真实的网页内容，包括：
1. 标题
2. 正文内容（3-5段，真实自然）
3. 相关链接（3-5个）

返回JSON格式：
{
  "title": "网页标题",
  "header": "网站名称",
  "paragraphs": ["段落1", "段落2", "段落3"],
  "links": [{"text": "链接文字", "url": "链接地址"}]
}`;

      const result = await askAIJson<any>(api, '你是网页内容生成助手', prompt, { temperature: 0.8 });

      // 转换为页面数据
      const content: any[] = [];
      result.paragraphs?.forEach((p: string) => {
        content.push({ type: 'text', data: p });
      });
      result.links?.forEach((l: any) => {
        content.push({ type: 'link', data: l });
      });

      setPageData({
        title: result.title || '加载中',
        header: result.header || cleanUrl,
        content,
      });

      // 生成评论
      await generateComments(result.title);
    } catch (err) {
      console.error('Failed to generate page:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateComments = async (pageTitle: string) => {
    try {
      const prompt = `为这个网页标题生成3-5条真实的用户评论：${pageTitle}

返回JSON数组，每条评论包含：
{
  "author": "用户名",
  "avatar": "emoji头像",
  "content": "评论内容",
  "likes": 点赞数,
  "time": "发布时间（如：2小时前）"
}`;

      const result = await askAIJson<Comment[]>(api, '你是评论生成助手', prompt, { temperature: 0.9, maxTokens: 500 });

      const commentsWithIds = result.map((c, i) => ({
        ...c,
        id: `comment-${i}`,
      }));

      setComments(commentsWithIds);
    } catch (err) {
      console.error('Failed to generate comments:', err);
    }
  };

  const handleGoBack = () => {
    if (historyIndex > 0) {
      const prevUrl = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      navigateTo(prevUrl, false);
    }
  };

  const handleGoForward = () => {
    if (historyIndex < history.length - 1) {
      const nextUrl = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      navigateTo(nextUrl, false);
    }
  };

  const handleGoHome = () => {
    setCurrentUrl('');
    setPageData(null);
    setUrl('');
    setShowComments(false);
  };

  const handleRefresh = () => {
    if (currentUrl) {
      navigateTo(currentUrl, false);
    }
  };

  const handleLike = (commentId: string) => {
    setComments(comments.map(c =>
      c.id === commentId ? { ...c, likes: c.likes + 1 } : c
    ));
  };

  return (
    <AppScreen title="浏览器" onBack={onBack} noPad>
      <div className="flex flex-col h-full bg-neutral-900 text-white">
        {/* 浏览器顶部导航栏 */}
        <div className="p-3 bg-neutral-950 border-b border-neutral-800 space-y-2.5 shrink-0">
          <div className="flex items-center gap-2">
            {/* 导航按钮 */}
            <button
              onClick={handleGoBack}
              disabled={historyIndex <= 0}
              className="tap p-1.5 rounded-lg text-neutral-400 disabled:text-neutral-700"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              onClick={handleGoForward}
              disabled={historyIndex >= history.length - 1}
              className="tap p-1.5 rounded-lg text-neutral-400 disabled:text-neutral-700"
            >
              <ArrowRight size={16} />
            </button>
            <button
              onClick={handleGoHome}
              className="tap p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-900"
            >
              <Home size={16} />
            </button>

            {/* 地址栏 */}
            <div className="flex-1 flex items-center gap-1.5 bg-neutral-900 rounded-xl px-2.5 h-8 border border-neutral-800 focus-within:border-indigo-500/50">
              <Globe size={11} className="text-neutral-500" />
              <input
                type="text"
                placeholder="输入网址或搜索..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && navigateTo(url)}
                className="flex-1 bg-transparent outline-none text-[11px] text-neutral-200 placeholder-neutral-600 min-w-0"
              />

              {currentUrl && (
                <button
                  onClick={handleRefresh}
                  className={`tap p-1 text-neutral-500 hover:text-white ${loading ? 'animate-spin' : ''}`}
                >
                  <RefreshCw size={11} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 浏览器内容区域 */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-neutral-950">
          {loading ? (
            /* 加载状态 */
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <span className="text-xs text-indigo-400 font-semibold animate-pulse">正在加载...</span>
            </div>
          ) : currentUrl && pageData ? (
            /* 网页内容 */
            <div className="max-w-2xl mx-auto p-4 space-y-4">
              {/* 网页头部 */}
              <div className="space-y-2">
                <div className="text-xs text-neutral-500">{pageData.header}</div>
                <h1 className="text-xl font-bold">{pageData.title}</h1>
              </div>

              {/* 网页内容 */}
              <div className="space-y-4">
                {pageData.content.map((item, idx) => {
                  if (item.type === 'text') {
                    return (
                      <p key={idx} className="text-sm text-neutral-300 leading-relaxed">
                        {item.data}
                      </p>
                    );
                  }
                  if (item.type === 'link') {
                    return (
                      <button
                        key={idx}
                        onClick={() => navigateTo(item.data.url)}
                        className="block w-full text-left p-3 glass rounded-xl tap text-sm text-indigo-400 hover:text-indigo-300"
                      >
                        🔗 {item.data.text}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>

              {/* 互动按钮 */}
              <div className="flex items-center gap-4 pt-4 border-t border-neutral-800">
                <button className="flex items-center gap-2 text-sm text-neutral-400 hover:text-indigo-400 tap">
                  <ThumbsUp size={16} />
                  <span>点赞</span>
                </button>
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="flex items-center gap-2 text-sm text-neutral-400 hover:text-indigo-400 tap"
                >
                  <MessageCircle size={16} />
                  <span>评论 ({comments.length})</span>
                </button>
                <button className="flex items-center gap-2 text-sm text-neutral-400 hover:text-indigo-400 tap">
                  <Share2 size={16} />
                  <span>分享</span>
                </button>
              </div>

              {/* 评论区 */}
              {showComments && (
                <div className="space-y-3 pt-4 border-t border-neutral-800">
                  <div className="text-sm font-medium">评论区</div>
                  {comments.map((comment) => (
                    <div key={comment.id} className="glass rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="text-2xl">{comment.avatar}</div>
                        <div className="flex-1">
                          <div className="text-xs font-medium">{comment.author}</div>
                          <div className="text-[10px] text-neutral-500">{comment.time}</div>
                        </div>
                      </div>
                      <div className="text-sm text-neutral-300">{comment.content}</div>
                      <button
                        onClick={() => handleLike(comment.id)}
                        className="flex items-center gap-1 text-xs text-neutral-500 hover:text-indigo-400 tap"
                      >
                        <ThumbsUp size={12} />
                        <span>{comment.likes}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* 首页 - 书签 */
            <div className="p-4 space-y-4">
              <div className="text-center space-y-2 py-8">
                <div className="text-4xl">🌐</div>
                <h2 className="text-lg font-bold">欢迎使用浏览器</h2>
                <p className="text-xs text-neutral-500">输入网址或选择下方书签开始浏览</p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-neutral-500 px-2">📚 常用书签</div>
                <div className="grid grid-cols-2 gap-2">
                  {BOOKMARKS.map((bm) => (
                    <button
                      key={bm.url}
                      onClick={() => navigateTo(bm.url)}
                      className="glass rounded-2xl p-4 text-left tap space-y-2"
                    >
                      <div className="text-2xl">{bm.emoji}</div>
                      <div className="text-sm font-medium">{bm.name}</div>
                      <div className="text-[10px] text-neutral-500 line-clamp-2">{bm.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppScreen>
  );
}
