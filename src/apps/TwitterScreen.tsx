import { useState } from 'react';
import { Heart, MessageCircle, Repeat2, Share2, Search, Edit3, RefreshCw } from 'lucide-react';
import { AppScreen } from '../components/AppScreen';
import type { ApiConfig, SocialPost, UserIdentity, Character } from '../types';

// 全新预设数据 v2.1
const INITIAL_POSTS: SocialPost[] = [
  {
    id: 'twitter-preset-1',
    platform: 'twitter',
    authorId: 'npc-tech',
    authorName: 'TechGuru',
    authorAvatar: '💻',
    content: `Just deployed my first AI-powered app to production! 🚀

The journey was incredible - from the initial idea to dealing with edge cases, optimizing performance, and finally seeing real users interact with it. There were moments of frustration, debugging sessions that lasted until 3 AM, but every challenge taught me something new.

Key learnings:
- Always plan for scale from day one
- User feedback is gold, listen to it
- Good documentation saves lives (including your own)
- Testing is not optional, it's essential

To everyone building something: keep going. That thing you're working on right now? It matters. Every line of code, every bug fix, every feature - it all adds up to something amazing. 💪

#DevLife #AI #BuildInPublic`,
    likes: 2847,
    comments: [],
    shares: 892,
    retweets: 456,
    ts: Date.now() - 8 * 60 * 60 * 1000,
    images: [],
  },
  {
    id: 'twitter-preset-2',
    platform: 'twitter',
    authorId: 'npc-writer',
    authorName: 'StoryTeller',
    authorAvatar: '📚',
    content: `Morning thoughts on creativity:

The blank page isn't your enemy. It's a canvas waiting for your voice. Every great story started with someone brave enough to write the first word, even when they had no idea what would come next.

I spent years waiting for "the perfect moment" to write. Spoiler: it never came. What did come was the realization that the perfect moment is when you decide to begin. Not when conditions are ideal, not when you feel inspired, but when you choose to show up.

Writing is like breathing - some days it flows naturally, other days you have to remind yourself to do it. But both are essential. Both keep you alive in different ways.

So here's to the messy drafts, the deleted paragraphs, the stories that will never see the light of day. They're all part of the journey. Every word you write makes you a better writer. 🖋️✨

#WritingCommunity #Creativity #MondayMotivation`,
    likes: 5621,
    comments: [],
    shares: 1234,
    retweets: 789,
    ts: Date.now() - 15 * 60 * 60 * 1000,
    images: [],
  }
];

export function TwitterScreen({
  onBack,
}: {
  api: ApiConfig;
  me?: UserIdentity;
  characters: Character[];
  posts: SocialPost[];
  onChange: (p: SocialPost[]) => void;
  onBack: () => void;
  autoTranslateEnabled?: boolean;
}) {
  const [tab, setTab] = useState<'foryou' | 'following'>('foryou');
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
    <AppScreen title="X" onBack={onBack}>
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
                placeholder="Search"
                className="w-full bg-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/40"
              />
            </div>
            <button className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors">
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 标签栏 */}
        <div className="flex border-b border-white/10 bg-white/5">
          <button
            onClick={() => setTab('foryou')}
            className={`flex-1 py-3 text-sm font-medium relative ${
              tab === 'foryou' ? 'text-white' : 'text-white/60'
            }`}
          >
            For you
            {tab === 'foryou' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setTab('following')}
            className={`flex-1 py-3 text-sm font-medium relative ${
              tab === 'following' ? 'text-white' : 'text-white/60'
            }`}
          >
            Following
            {tab === 'following' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-full" />
            )}
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto">
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
              {searchQuery ? 'No results found' : 'No posts yet'}
            </div>
          ) : (
            filteredPosts.map(post => (
              <div key={post.id} className="p-4 border-b border-white/10 hover:bg-white/5 transition-colors">
                {/* 用户信息 */}
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{post.authorAvatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">{post.authorName}</span>
                      <span className="text-white/40 text-sm">
                        · {new Date(post.ts).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    {/* 内容 */}
                    <div className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap mb-3">
                      {post.content}
                    </div>

                    {/* 互动按钮 */}
                    <div className="flex items-center justify-between text-white/60 max-w-md">
                      <button className="flex items-center gap-2 text-sm hover:text-blue-500 transition-colors group">
                        <div className="p-2 rounded-full group-hover:bg-blue-500/10">
                          <MessageCircle className="w-4 h-4" />
                        </div>
                        <span>{post.comments?.length || 0}</span>
                      </button>
                      <button className="flex items-center gap-2 text-sm hover:text-green-500 transition-colors group">
                        <div className="p-2 rounded-full group-hover:bg-green-500/10">
                          <Repeat2 className="w-4 h-4" />
                        </div>
                        <span>{post.retweets || 0}</span>
                      </button>
                      <button
                        onClick={() => handleLike(post.id)}
                        className="flex items-center gap-2 text-sm hover:text-pink-500 transition-colors group"
                      >
                        <div className="p-2 rounded-full group-hover:bg-pink-500/10">
                          <Heart className="w-4 h-4" />
                        </div>
                        <span>{post.likes}</span>
                      </button>
                      <button className="flex items-center gap-2 text-sm hover:text-blue-500 transition-colors group">
                        <div className="p-2 rounded-full group-hover:bg-blue-500/10">
                          <Share2 className="w-4 h-4" />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppScreen>
  );
}
