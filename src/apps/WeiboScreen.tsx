import { useState } from 'react';
import { Heart, MessageCircle, Share2, Search, Plus, TrendingUp, RefreshCw } from 'lucide-react';
import { AppScreen } from '../components/AppScreen';
import type { ApiConfig, SocialPost, UserIdentity, Character } from '../types';

// 全新预设数据 v2.1
const INITIAL_POSTS: SocialPost[] = [
  {
    id: 'weibo-preset-1',
    platform: 'weibo',
    authorId: 'npc-chef',
    authorName: '深夜食堂老板娘',
    authorAvatar: '🍜',
    content: `今天店里来了一位特别的客人，一个人坐在角落里静静地吃着拉面。看她的样子应该是加班到很晚，眼睛里都是疲惫。我给她加了个温泉蛋，她抬起头对我笑了笑，说"谢谢老板娘，这是今天最温暖的时刻"。

其实开这家小店这么多年，见过太多这样的都市人。白天西装革履在写字楼里奔波，深夜一个人来到小店，卸下伪装，享受一碗热腾腾的面。有时候我觉得，我这碗面治愈的不只是肚子，更是那些疲惫的心灵。

生活不易，但总有温暖的瞬间。希望每个深夜回家的你，都能找到属于自己的那碗面🍜❤️

#深夜食堂 #城市温度 #一碗面的故事`,
    likes: 1256,
    comments: [],
    shares: 8234,
    ts: Date.now() - 6 * 60 * 60 * 1000,
    images: [],
    topics: ['深夜食堂']
  },
  {
    id: 'weibo-preset-2',
    platform: 'weibo',
    authorId: 'npc-photographer',
    authorName: '旅行摄影师Leo',
    authorAvatar: '📷',
    content: `今天在西藏拍到了此生最震撼的日出！

凌晨4点就起床，顶着零下的温度爬到山顶。等待的过程中冷得发抖，相机都快冻僵了。但当第一缕阳光穿过云层，照亮雪山的那一刻，所有的辛苦都值了。

这趟西藏之行已经是第15天了，从拉萨到纳木错，从羊卓雍措到珠峰大本营，每一个地方都让我震撼。高反、缺氧、路况艰险...这些都不算什么，因为眼前的美景让一切都变得渺小。

有人问我，为什么要这么辛苦地去旅行？我想说，当你站在世界屋脊，看着太阳从雪山升起，你会明白什么叫做"人生值得"。那种感动，那种震撼，是任何语言都无法形容的。

明天继续前行，下一站：冈仁波齐。期待更多的奇迹🏔️✨

#西藏旅行 #日出 #人生必去的50个地方`,
    likes: 3421,
    comments: [],
    shares: 1892,
    ts: Date.now() - 12 * 60 * 60 * 1000,
    images: [],
    topics: ['西藏旅行']
  }
];

export function WeiboScreen({
  onBack,
}: {
  api: ApiConfig;
  me?: UserIdentity;
  characters: Character[];
  posts: SocialPost[];
  onChange: (p: SocialPost[]) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'home' | 'trending'>('home');
  const [displayPosts, setDisplayPosts] = useState<SocialPost[]>(INITIAL_POSTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      // 刷新时重新加载预设数据
      setDisplayPosts([...INITIAL_POSTS]);
      setRefreshing(false);
    }, 1000);
  };

  const handleLike = (postId: string) => {
    setDisplayPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, likes: p.likes + 1 } : p
    ));
  };

  const filteredPosts = searchQuery
    ? displayPosts.filter(p =>
        p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.authorName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : displayPosts;

  return (
    <AppScreen title="微博" onBack={onBack}>
      <div className="flex flex-col h-full">
        {/* 搜索栏 */}
        <div className="p-3 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索微博、用户、话题"
                className="w-full bg-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/40"
              />
            </div>
            <button className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-medium flex items-center gap-1">
              <Plus className="w-4 h-4" />
              发微博
            </button>
          </div>
        </div>

        {/* 标签栏 */}
        <div className="flex border-b border-white/10 bg-white/5">
          <button
            onClick={() => setTab('home')}
            className={`flex-1 py-3 text-sm font-medium relative ${
              tab === 'home' ? 'text-red-500' : 'text-white/60'
            }`}
          >
            首页
            {tab === 'home' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-red-500" />
            )}
          </button>
          <button
            onClick={() => setTab('trending')}
            className={`flex-1 py-3 text-sm font-medium relative ${
              tab === 'trending' ? 'text-red-500' : 'text-white/60'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4" />
              热搜
            </div>
            {tab === 'trending' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-red-500" />
            )}
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'home' && (
            <div>
              {/* 刷新按钮 */}
              <div className="p-3 border-b border-white/10 flex justify-end">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* 帖子列表 */}
              {filteredPosts.length === 0 ? (
                <div className="p-8 text-center text-white/40">
                  {searchQuery ? '没有找到相关内容' : '还没有微博'}
                </div>
              ) : (
                filteredPosts.map(post => (
                  <div key={post.id} className="p-4 border-b border-white/10">
                    {/* 用户信息 */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-2xl">{post.authorAvatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{post.authorName}</span>
                          <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded">热</span>
                        </div>
                        <div className="text-xs text-white/40 mt-1">
                          {new Date(post.ts).toLocaleString('zh-CN', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>

                    {/* 内容 */}
                    <div className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap mb-3">
                      {post.content}
                    </div>

                    {/* 话题标签 */}
                    {post.topics && post.topics.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.topics.map((topic, idx) => (
                          <span key={idx} className="text-blue-400 text-sm">#{topic}</span>
                        ))}
                      </div>
                    )}

                    {/* 互动按钮 */}
                    <div className="flex items-center gap-6 text-white/60">
                      <button
                        onClick={() => handleLike(post.id)}
                        className="flex items-center gap-1 text-sm hover:text-red-500 transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                        <span>{post.likes}</span>
                      </button>
                      <button className="flex items-center gap-1 text-sm hover:text-blue-500 transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments?.length || 0}</span>
                      </button>
                      <button className="flex items-center gap-1 text-sm hover:text-green-500 transition-colors">
                        <Share2 className="w-4 h-4" />
                        <span>{post.shares}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'trending' && (
            <div className="p-4">
              <div className="text-center text-white/40 py-8">
                热搜功能开发中...
              </div>
            </div>
          )}
        </div>
      </div>
    </AppScreen>
  );
}
