import { useState, useCallback } from 'react';
import { Plus, Search, Eye, MessageSquare, Pin, Trash2, Send, Sparkles, RefreshCcw } from 'lucide-react';
import { AppScreen } from '../components/AppScreen';
import { Modal, Confirm } from '../components/Sheet';
import { ListGroup, Row } from '../components/ui';
import { uid } from '../utils';
import { askAI } from '../api';
import type { ApiConfig, ForumPost, UserIdentity, Character } from '../types';

const BOARDS = ['综合', '技术', '日常', '故事', '求助'];

export function ForumScreen({
  api,
  me,
  posts,
  characters,
  onChange,
  onRefresh,
  onBack,
}: {
  api: ApiConfig;
  me?: UserIdentity;
  posts: ForumPost[];
  characters: Character[];
  onChange: (p: ForumPost[]) => void;
  onRefresh: () => Promise<void>;
  onBack: () => void;
}) {
  const [board, setBoard] = useState('综合');
  const [q, setQ] = useState('');
  const [active, setActive] = useState<ForumPost | null>(null);
  const [composing, setComposing] = useState(false);
  const [confirmDel, setConfirmDel] = useState<ForumPost | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [aiWriting, setAiWriting] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null); // 正在回复哪条评论

  const [selectedAuthor, setSelectedAuthor] = useState<{ id: string; name: string; avatar?: string } | null>(me ? { id: me.id, name: me.nickname, avatar: me.avatar } : null);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const filtered = posts.filter((p) => (board === '综合' || p.board === board) && (p.title.includes(q) || p.body.includes(q)));
  const sorted = [...filtered].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.ts - a.ts);

  const update = (id: string, fn: (p: ForumPost) => ForumPost) => onChange(posts.map((p) => p.id === id ? fn(p) : p));

  const publish = () => {
    if (!title.trim() || !selectedAuthor) return;
    const p: ForumPost = { id: uid(), title: title.trim(), authorName: selectedAuthor.name, authorAvatar: selectedAuthor.avatar, body: body.trim(), board: board === '综合' ? '日常' : board, views: 0, replies: [], ts: Date.now() };
    onChange([p, ...posts]); setTitle(''); setBody(''); setComposing(false);
  };

  const aiPost = async () => {
    setAiWriting(true);
    try {
      const sys = `你在模拟论坛发帖。角色：${selectedAuthor?.name || '匿名'}。请生成一个有趣的帖子，标题+正文，正文100-200字，口语化。只输出"标题\n正文"，不要额外解释。`;
      const raw = await askAI(api, sys, `板块：${board === '综合' ? '日常' : board}\n请生成一条帖子：`, { temperature: 0.9, maxTokens: 400 });
      const [t, ...rest] = raw.split('\n');
      const p: ForumPost = { id: uid(), title: t.trim(), authorName: selectedAuthor?.name || 'AI', authorAvatar: selectedAuthor?.avatar, body: rest.join('\n').trim(), board: board === '综合' ? '日常' : board, views: Math.floor(Math.random()*200), replies: [], ts: Date.now() };
      onChange([p, ...posts]); setComposing(false);
    } catch (e) { alert(`AI生成失败：${(e as Error).message}`); }
    finally { setAiWriting(false); }
  };

  const reply = (p: ForumPost) => {
    if (!replyText.trim() || !selectedAuthor) return;

    if (replyingTo) {
      // 回复某条评论（楼中楼）
      const newReply = {
        id: uid(),
        authorName: selectedAuthor.name,
        authorAvatar: selectedAuthor.avatar,
        text: replyText.trim(),
        replyTo: replyingTo.name,
        ts: Date.now()
      };

      // 递归查找并添加到对应评论的 replies
      const addReplyToComment = (replies: any[]): any[] => {
        return replies.map(r => {
          if (r.id === replyingTo.id) {
            return { ...r, replies: [...(r.replies || []), newReply] };
          }
          if (r.replies && r.replies.length > 0) {
            return { ...r, replies: addReplyToComment(r.replies) };
          }
          return r;
        });
      };

      update(p.id, (x) => ({ ...x, replies: addReplyToComment(x.replies) }));
      setActive((a) => a ? { ...a, replies: addReplyToComment(a.replies) } : a);
    } else {
      // 一级评论
      const r = { id: uid(), authorName: selectedAuthor.name, authorAvatar: selectedAuthor.avatar, text: replyText.trim(), ts: Date.now() };
      update(p.id, (x) => ({ ...x, replies: [...x.replies, r] }));
      setActive((a) => a ? { ...a, replies: [...a.replies, r] } : a);
    }

    setReplyText('');
    setReplyingTo(null);
  };

  const aiReply = async (p: ForumPost) => {
    setAiWriting(true);
    try {
      const sys = `你在论坛回帖，以网友身份简短回复，10-50字，口语化。角色：${selectedAuthor?.name || '网友'}. 只输出回复内容。`;
      const text = await askAI(api, sys, `帖子标题：${p.title}\n正文：${p.body}\n请回复：`, { temperature: 0.9, maxTokens: 100 });
      const r = { id: uid(), authorName: selectedAuthor?.name || '网友', authorAvatar: selectedAuthor?.avatar, text: text.trim(), ts: Date.now() };
      update(p.id, (x) => ({ ...x, replies: [...x.replies, r] }));
      setActive((a) => a ? { ...a, replies: [...a.replies, r] } : a);
    } catch (e) { alert(`生成失败：${(e as Error).message}`); }
    finally { setAiWriting(false); }
  };

  const del = (p: ForumPost) => onChange(posts.filter((x) => x.id !== p.id));

  if (active) {
    const p = posts.find((x) => x.id === active.id) ?? active;
    return (
      <AppScreen title={p.title} onBack={() => setActive(null)} noPad right={<div><button onClick={handleRefresh} className="tap txt-dim mr-3"><RefreshCcw size={18} className={refreshing ? 'animate-spin' : ''} /></button><button onClick={() => del(p)} className="tap txt-dim"><Trash2 size={18} /></button></div>}>
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4">
            <div className="font-title text-lg mb-2">{p.title}</div>
            <div className="flex items-center gap-2 mb-3">
              {p.authorAvatar ? <img src={p.authorAvatar} className="w-7 h-7 rounded-full object-cover" alt="" /> : <div className="w-7 h-7 rounded-full icon-bg flex items-center justify-center text-[11px] txt-accent">{(p.authorName[0] || '?')}</div>}
              <span className="text-[13px] txt-dim">{p.authorName}</span>
              <span className="text-[11px] txt-faint">{new Date(p.ts).toLocaleDateString('zh-CN')}</span>
              <span className="ml-auto text-[11px] txt-faint flex items-center gap-0.5"><Eye size={11} /> {p.views}</span>
            </div>
            <div className="text-[14px] leading-relaxed txt-dim whitespace-pre-wrap mb-5">{p.body}</div>
            <div className="border-t border-[var(--border)] pt-4">
              <div className="text-[13px] txt-dim mb-3 flex items-center gap-1"><MessageSquare size={14} /> {p.replies.length}条回复</div>
              {p.replies.length === 0 && <div className="text-[13px] txt-faint mb-3">还没有回复，来抢沙发</div>}
              {p.replies.map((r) => {
                // 递归渲染评论组件
                const renderReply = (reply: any, level: number = 0) => (
                  <div key={reply.id} className={level > 0 ? 'ml-8 mt-2' : 'mb-4'}>
                    <div className="flex gap-2.5">
                      {reply.authorAvatar ? (
                        <img src={reply.authorAvatar} className="w-7 h-7 rounded-full object-cover shrink-0" alt="" />
                      ) : (
                        <div className="w-7 h-7 rounded-full icon-bg flex items-center justify-center text-[11px] txt-accent shrink-0">
                          {(reply.authorName[0] || '?')}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] txt-dim font-medium">{reply.authorName}</span>
                          {reply.replyTo && <span className="text-[11px] txt-faint">回复 @{reply.replyTo}</span>}
                          <span className="text-[11px] txt-faint ml-auto">{new Date(reply.ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="text-[14px] txt-dim mt-1">{reply.text}</div>
                        <button
                          onClick={() => setReplyingTo({ id: reply.id, name: reply.authorName })}
                          className="text-[11px] txt-faint hover:txt-accent mt-1.5 tap"
                        >
                          回复
                        </button>
                        {/* 递归渲染子回复 */}
                        {reply.replies && reply.replies.length > 0 && (
                          <div className="mt-2">
                            {reply.replies.map((subReply: any) => renderReply(subReply, level + 1))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );

                return renderReply(r);
              })}
            </div>
          </div>
          <div className="px-3 py-2 border-t border-[var(--border)] shrink-0">
            {/* 角色选择器 */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] txt-faint">回复身份：</span>
              <select
                value={selectedAuthor?.id || ''}
                onChange={(e) => {
                  const char = characters.find(c => c.id === e.target.value);
                  if (char) setSelectedAuthor({ id: char.id, name: char.name, avatar: char.avatar });
                  else if (me && e.target.value === me.id) setSelectedAuthor({ id: me.id, name: me.nickname, avatar: me.avatar });
                }}
                className="text-[12px] glass rounded-lg px-2 py-1 outline-none bg-transparent"
              >
                {me && <option value={me.id}>{me.nickname} (我)</option>}
                {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {/* 正在回复提示 */}
            {replyingTo && (
              <div className="flex items-center gap-2 mb-2 text-[11px] txt-faint">
                <span>回复 @{replyingTo.name}</span>
                <button onClick={() => setReplyingTo(null)} className="tap txt-accent">取消</button>
              </div>
            )}
            {/* 回复输入框 */}
            <div className="flex items-center gap-2">
              <input value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && reply(p)} placeholder={replyingTo ? `回复 @${replyingTo.name}...` : "回复…"} className="flex-1 glass rounded-full px-4 h-10 text-[14px] outline-none bg-transparent" />
              <button onClick={() => aiReply(p)} disabled={aiWriting} className="tap w-10 h-10 rounded-full glass flex items-center justify-center disabled:opacity-50"><Sparkles size={18} className="txt-accent" /></button>
              <button onClick={() => reply(p)} disabled={!replyText.trim()} className="tap w-10 h-10 rounded-full flex items-center justify-center text-[var(--bg)] disabled:opacity-40" style={{ background: 'var(--accent)' }}><Send size={18} /></button>
            </div>
          </div>
        </div>
        {aiWriting && <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 glass-strong rounded-full px-4 py-2 text-[12px] animate-sheet-up">AI 生成中…</div>}
      </AppScreen>
    );
  }

  return (
    <AppScreen title="论坛" onBack={onBack} right={<button onClick={() => setComposing(true)} className="tap text-[var(--accent)]"><Plus size={22} /></button>}>
      <div className="flex gap-1.5 mb-3 overflow-x-auto no-scrollbar">
        <button onClick={handleRefresh} className="tap shrink-0 w-8 h-8 rounded-full glass flex items-center justify-center txt-accent"><RefreshCcw size={16} className={refreshing ? 'animate-spin' : ''} /></button>
        {BOARDS.map((b) => <button key={b} onClick={() => setBoard(b)} className={`tap shrink-0 px-3 h-8 rounded-full text-[12px] ${board === b ? 'icon-bg-active txt-accent font-medium' : 'glass txt-dim'}`}>{b}</button>)}
      </div>
      <div className="flex items-center gap-2 glass rounded-xl px-3 h-10 mb-4"><Search size={16} className="txt-faint" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索帖子" className="flex-1 bg-transparent outline-none text-[14px]" /></div>
      {sorted.length === 0 ? (
        <div className="glass rounded-2xl py-10 text-center txt-faint text-sm">还没有帖子，点右上角 + 发帖</div>
      ) : (
        <ListGroup>
          {sorted.map((p) => (
            <Row
              key={p.id}
              label={<span className="flex items-center gap-1.5">{p.pinned && <Pin size={13} className="txt-accent" />}{p.title}</span>}
              hint={<span>{p.authorName} · {p.replies.length}回复 · {p.views}浏览</span>}
              onClick={() => { setActive(p); update(p.id, (x) => ({ ...x, views: x.views + 1 })); }}
              right={<button onClick={(e) => { e.stopPropagation(); setConfirmDel(p); }} className="tap txt-dim"><Trash2 size={15} /></button>}
            />
          ))}
        </ListGroup>
      )}

      <Modal open={composing} onClose={() => setComposing(false)} title="发帖">
        <div className="text-[12px] txt-dim mb-1">选择角色：</div>
        <select value={selectedAuthor?.id} onChange={(e) => {
          const char = characters.find(c => c.id === e.target.value);
          if (char) setSelectedAuthor({ id: char.id, name: char.name, avatar: char.avatar });
          else if (me && e.target.value === me.id) setSelectedAuthor({ id: me.id, name: me.nickname, avatar: me.avatar });
        }} className="w-full glass rounded-xl px-3 h-11 text-[14px] outline-none bg-transparent mb-3">
          {me && <option value={me.id}>{me.nickname} (我)</option>}
          {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="text-[12px] txt-dim mb-1">板块：{board === '综合' ? '日常' : board}</div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="标题" className="w-full glass rounded-xl px-3 h-11 text-[14px] outline-none bg-transparent mb-3" autoFocus />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="正文" rows={5} className="w-full glass rounded-xl px-3 py-2.5 text-[14px] outline-none bg-transparent resize-none mb-3" />
        <div className="flex gap-3">
          <button onClick={aiPost} disabled={aiWriting} className="tap flex-1 h-11 rounded-full glass font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"><Sparkles size={16} className="txt-accent" /> {aiWriting ? '生成中…' : 'AI 发帖'}</button>
          <button onClick={publish} disabled={!title.trim()} className="tap flex-1 h-11 rounded-full font-medium text-[var(--bg)] disabled:opacity-50" style={{ background: 'var(--accent)' }}>发布</button>
        </div>
      </Modal>

      <Confirm open={!!confirmDel} title="删除帖子" message={`确定删除「${confirmDel?.title}」？`} danger onConfirm={() => { if (confirmDel) del(confirmDel); setConfirmDel(null); }} onCancel={() => setConfirmDel(null)} />
    </AppScreen>
  );
}
