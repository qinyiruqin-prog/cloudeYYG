import { useState, useRef, useEffect } from 'react';
import { Send, Plus, MessageCircle, Trash2, Play, Pause, Eye, Mic, Sparkles, X, UserCheck, UserX, UserPlus, Smile, RefreshCw, Layers, Settings, Wifi, WifiOff } from 'lucide-react';
import { AppScreen } from '../components/AppScreen';
import { Modal, Confirm } from '../components/Sheet';
import { ListGroup, Row } from '../components/ui';
import { uid } from '../utils';
import { getPeriodPrompt } from './PeriodScreen';
import { callChatRich, generateImage, textToSpeech, detectNpcs, detectPlotEvents, evaluateOutgoingRequest, generateIncomingRequest, askAI, type ChatMsg } from '../api';
import type { ApiConfig, Character, ChatThread, ChatMessage, WorldEntry, MessageMedia, StoryEvent, UserIdentity, FriendRequest, AppSettings } from '../types';

export function ChatScreen({
  api,
  characters,
  threads,
  worldEntries,
  storyEvents,
  autoNpc,
  users,
  activeUserId,
  friendRequests,
  activeInteractMode,
  activeInteractEnabled,
  updateSettings,
  initialThreadId,
  onClearInitialThreadId,
  onChange,
  onChangeFriendRequests,
  onAddCharacter,
  onAddStoryEvents,
  onConsumeStoryEvents,
  onBack,
  settings,
}: {
  api: ApiConfig;
  characters: Character[];
  threads: ChatThread[];
  worldEntries: WorldEntry[];
  storyEvents: StoryEvent[];
  autoNpc: boolean;
  users: UserIdentity[];
  activeUserId: string | null;
  friendRequests: FriendRequest[];
  activeInteractMode?: 'manual' | 'auto';
  activeInteractEnabled?: boolean;
  updateSettings: (patch: any) => void;
  initialThreadId?: string | null;
  onClearInitialThreadId?: () => void;
  onChange: (threads: ChatThread[]) => void;
  onChangeFriendRequests: (reqs: FriendRequest[]) => void;
  onAddCharacter: (char: Character) => void;
  onAddStoryEvents: (events: StoryEvent[]) => void;
  onConsumeStoryEvents: (ids: string[]) => void;
  onBack: () => void;
  settings: AppSettings;
}) {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  useEffect(() => {
    if (initialThreadId) {
      setActiveThreadId(initialThreadId);
      if (onClearInitialThreadId) {
        onClearInitialThreadId();
      }
    }
  }, [initialThreadId, onClearInitialThreadId]);

  const [pickingChar, setPickingChar] = useState(false);
  const [pickingForGroup, setPickingForGroup] = useState(false);
  const [selectedGroupChars, setSelectedGroupChars] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [confirmDel, setConfirmDel] = useState<ChatThread | null>(null);
  const [confirmDelAll, setConfirmDelAll] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pendingNpc, setPendingNpcs] = useState<Character[] | null>(null);

  // Tabs for main Chat Screen
  const [activeTab, setActiveTab] = useState<'chats' | 'requests'>('chats');
  
  // Friend requests states
  const [reqTab, setReqTab] = useState<'received' | 'sent'>('received');
  const [composingReq, setComposingReq] = useState(false);
  const [reqSenderId, setReqSenderId] = useState('');
  const [reqCharId, setReqCharId] = useState('');
  const [reqIntro, setReqIntro] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);
  const [generatingIncoming, setGeneratingIncoming] = useState(false);
  const [revealedChars, setRevealedChars] = useState<Record<string, boolean>>({});

  // Account creation state
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newNick, setNewNick] = useState('');
  const [newSig, setNewSig] = useState('');
  const [newIsAlt, setNewIsAlt] = useState(true);

  // Probing trigger state
  const [triggeringProbe, setTriggeringProbe] = useState(false);
  const [probeCharId, setProbeCharId] = useState('');
  const [probeUserId, setProbeUserId] = useState('');

  const currentUser = users.find((u) => u.id === activeUserId) ?? users[0];

  // Filter threads for active user identity
  const myThreads = threads.filter((t) => !t.userId || t.userId === activeUserId);

  const active = threads.find((t) => t.id === activeThreadId) ?? null;
  const activeChar = characters.find((c) => c.id === active?.characterId) ?? null;

  const updateThread = (id: string, fn: (t: ChatThread) => ChatThread) => {
    onChange(threads.map((t) => (t.id === id ? fn(t) : t)));
  };

  const startChat = (charId: string) => {
    const char = characters.find((c) => c.id === charId);
    if (!char) return;
    const existing = myThreads.find((t) => t.characterId === charId && !t.charAltName && !t.isGroup);
    if (existing) { setActiveThreadId(existing.id); setPickingChar(false); return; }
    const t: ChatThread = {
      id: uid(),
      characterId: charId,
      userId: activeUserId || undefined,
      messages: [{ id: uid(), role: 'assistant', content: char.greeting || `你好，我是${char.name}。`, ts: Date.now() }],
      updatedAt: Date.now(),
    };
    onChange([t, ...threads]);
    setActiveThreadId(t.id);
    setPickingChar(false);
  };

  const createGroupChat = () => {
    if (selectedGroupChars.length < 2) {
      setToast('请至少选择2个角色创建群聊');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const finalGroupName = groupName.trim() || selectedGroupChars.map(id => characters.find(c => c.id === id)?.name).filter(Boolean).join('、');
    const t: ChatThread = {
      id: uid(),
      characterId: selectedGroupChars[0], // 主角色ID
      userId: activeUserId || undefined,
      isGroup: true,
      groupMembers: selectedGroupChars,
      groupName: finalGroupName,
      messages: [{
        id: uid(),
        role: 'assistant',
        content: `欢迎来到群聊「${finalGroupName}」！`,
        ts: Date.now()
      }],
      updatedAt: Date.now(),
    };
    onChange([t, ...threads]);
    setActiveThreadId(t.id);
    setPickingForGroup(false);
    setSelectedGroupChars([]);
    setGroupName('');
    setToast(`群聊「${finalGroupName}」创建成功！`);
    setTimeout(() => setToast(null), 3000);
  };

  const handleQuickCreateUser = () => {
    if (!newNick.trim()) return;
    const newUser: UserIdentity = {
      id: uid(),
      nickname: newNick.trim(),
      signature: newSig.trim(),
      imagePromptTemplate: '',
      isAlt: newIsAlt,
      createdAt: Date.now(),
    };
    updateSettings({
      users: [...users, newUser],
      activeUserId: newUser.id
    });
    setReqSenderId(newUser.id);
    setIsCreatingUser(false);
    setNewNick('');
    setNewSig('');
    setNewIsAlt(true);
    setToast(`成功创建并切换至账号「${newUser.nickname}」！`);
    setTimeout(() => setToast(null), 3000);
  };

  // Trigger Incoming Request from Character
  const triggerCharacterProbing = async (targetCharId?: string, targetUserId?: string) => {
    if (characters.length === 0) {
      setToast('请先在「我的」创建一些 AI 角色！');
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setGeneratingIncoming(true);
    try {
      // Pick selected or random character
      const char = targetCharId 
        ? characters.find((c) => c.id === targetCharId) 
        : characters[Math.floor(Math.random() * characters.length)];
      
      if (!char) throw new Error('未找到所选角色');

      const targetUser = targetUserId 
        ? users.find((u) => u.id === targetUserId)
        : currentUser;

      const res = await generateIncomingRequest(
        api,
        char,
        targetUser?.nickname || '主人',
        targetUser?.signature || ''
      );
      
      const req: FriendRequest = {
        id: uid(),
        type: 'incoming',
        userId: targetUser?.id || activeUserId || currentUser?.id || 'default-owner',
        characterId: char.id,
        charAltName: res.charAltName,
        charAltAvatar: res.charAltAvatar,
        intro: res.intro,
        status: 'pending',
        ts: Date.now()
      };
      
      onChangeFriendRequests([req, ...friendRequests]);
      setToast(`收到来自「${res.charAltName}」对「${targetUser?.nickname}」的好友申请！`);
      setTimeout(() => setToast(null), 3000);
      setTriggeringProbe(false);
    } catch (e) {
      setToast(`生成失败：${(e as Error).message}`);
      setTimeout(() => setToast(null), 3000);
    } finally {
      setGeneratingIncoming(false);
    }
  };

  // Submit User Alt outgoing friend request
  const submitOutgoingRequest = async () => {
    if (!reqCharId || !reqIntro.trim()) return;
    const sender = users.find((u) => u.id === reqSenderId) ?? currentUser;
    const char = characters.find((c) => c.id === reqCharId);
    if (!char || !sender) return;

    setSubmittingReq(true);
    try {
      const res = await evaluateOutgoingRequest(
        api,
        char,
        sender.nickname,
        sender.signature,
        reqIntro.trim()
      );

      const req: FriendRequest = {
        id: uid(),
        type: 'outgoing',
        userId: sender.id,
        characterId: char.id,
        intro: reqIntro.trim(),
        status: res.accepted ? 'accepted' : 'declined',
        reply: res.reply,
        ts: Date.now()
      };

      onChangeFriendRequests([req, ...friendRequests]);

      if (res.accepted) {
        // Automatically create a chat thread for this alt identity and the character
        const existing = threads.find((t) => t.characterId === char.id && t.userId === sender.id && !t.charAltName);
        if (!existing) {
          const newThread: ChatThread = {
            id: uid(),
            characterId: char.id,
            userId: sender.id,
            messages: [
              { id: uid(), role: 'user', content: `[验证消息] ${reqIntro.trim()}`, ts: Date.now() },
              { id: uid(), role: 'assistant', content: res.reply || '好啊，加个好友。', ts: Date.now() }
            ],
            updatedAt: Date.now()
          };
          onChange([newThread, ...threads]);
        }
        setToast(`「${char.name}」已接受你的好友申请！`);
      } else {
        setToast(`「${char.name}」拒绝了你的好友申请`);
      }
      setTimeout(() => setToast(null), 3000);
      setComposingReq(false);
      setReqIntro('');
    } catch (e) {
      setToast(`申请失败：${(e as Error).message}`);
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSubmittingReq(false);
    }
  };

  // Accept incoming friend request
  const acceptIncoming = (r: FriendRequest) => {
    const char = characters.find((c) => c.id === r.characterId);
    if (!char) return;

    // 1. Update request status
    onChangeFriendRequests(friendRequests.map((x) => x.id === r.id ? { ...x, status: 'accepted' as const } : x));

    // 2. Create ChatThread with alt account details
    const existing = threads.find((t) => t.characterId === char.id && t.userId === r.userId && t.charAltName === r.charAltName);
    if (!existing) {
      const newThread: ChatThread = {
        id: uid(),
        characterId: char.id,
        userId: r.userId,
        charAltName: r.charAltName,
        charAltAvatar: r.charAltAvatar,
        messages: [
          { id: uid(), role: 'assistant', content: r.intro, ts: Date.now() }
        ],
        updatedAt: Date.now()
      };
      onChange([newThread, ...threads]);
    }
    setToast('已接受好友申请，可以开始聊天啦');
    setTimeout(() => setToast(null), 3000);
  };

  // Decline incoming friend request
  const declineIncoming = (r: FriendRequest) => {
    onChangeFriendRequests(friendRequests.map((x) => x.id === r.id ? { ...x, status: 'declined' as const } : x));
    setToast('已拒绝好友申请');
    setTimeout(() => setToast(null), 3000);
  };

  const pendingIncomingCount = friendRequests.filter(
    (r) => r.type === 'incoming' && r.status === 'pending' && r.userId === activeUserId
  ).length;

  if (active && activeChar) {
    return (
      <ChatConversation
        api={api}
        char={activeChar}
        thread={active}
        currentUser={currentUser}
        worldEntries={worldEntries}
        characters={characters}
        storyEvents={storyEvents.filter((e) => e.characterId === activeChar.id)}
        autoNpc={autoNpc}
        activeInteractMode={activeInteractMode}
        activeInteractEnabled={activeInteractEnabled}
        onUpdateSettings={updateSettings}
        onUpdateThread={(updater) => updateThread(active.id, updater)}
        onSend={(msgs) => updateThread(active.id, (t) => ({ ...t, messages: msgs, updatedAt: Date.now() }))}
        onBack={() => setActiveThreadId(null)}
        onDelete={() => { onChange(threads.filter((t) => t.id !== active.id)); setActiveThreadId(null); }}
        onNpcDetected={(npcs) => setPendingNpcs(npcs)}
        onPlotEvents={(events) => {
          if (events.length) {
            onAddStoryEvents(events);
            setToast(`剧情已同步给 ${events.length} 个角色`);
            setTimeout(() => setToast(null), 3000);
          }
        }}
        onConsumeEvents={(ids) => onConsumeStoryEvents(ids)}
        settings={settings}
      />
    );
  }

  return (
    <AppScreen
      title="聊天"
      onBack={onBack}
      right={
        <div className="flex items-center gap-3.5">
          {myThreads.length > 0 && (
            <button onClick={() => setConfirmDelAll(true)} className="tap text-red-400 hover:text-red-500 text-[12px] font-medium flex items-center gap-0.5 cursor-pointer" title="清空全部对话">
              <Trash2 size={15} /> 清空全部
            </button>
          )}
          <button onClick={() => setPickingChar(true)} className="tap text-[var(--accent)] cursor-pointer" title="开始新会话">
            <Plus size={22} />
          </button>
        </div>
      }
    >
      {/* Top Tab Bar */}
      <div className="flex border-b border-[var(--border)] mb-3 relative shrink-0">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-2.5 text-center text-[14px] font-medium relative transition-colors ${activeTab === 'chats' ? 'txt-accent' : 'txt-faint'}`}
        >
          对话列表 ({myThreads.length})
          {activeTab === 'chats' && <div className="absolute bottom-0 inset-x-8 h-0.5 rounded-full" style={{ background: 'var(--accent)' }} />}
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2.5 text-center text-[14px] font-medium relative transition-colors ${activeTab === 'requests' ? 'txt-accent' : 'txt-faint'} flex items-center justify-center gap-1`}
        >
          好友申请
          {pendingIncomingCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
          {activeTab === 'requests' && <div className="absolute bottom-0 inset-x-8 h-0.5 rounded-full" style={{ background: 'var(--accent)' }} />}
        </button>
      </div>

      {activeTab === 'chats' ? (
        <>
          <div className="text-[12px] txt-faint mb-3 leading-relaxed">
            与 AI 角色一对一对话。角色会主动发消息、图片、语音，长按消息可查看心声。
            {autoNpc && <span className="txt-accent">对话中提及的新角色会自动生成 NPC。</span>}
          </div>
          {myThreads.length === 0 ? (
            <div className="glass rounded-2xl py-10 text-center txt-faint text-sm">
              当前身份还没有对话，点击右上角 + 选择角色，或去「好友申请」试探！
            </div>
          ) : (
            <ListGroup>
              {[...myThreads].sort((a, b) => b.updatedAt - a.updatedAt).map((t) => {
                const c = characters.find((x) => x.id === t.characterId);
                const last = t.messages[t.messages.length - 1];
                const unreadEvents = storyEvents.filter((e) => e.characterId === t.characterId && !e.consumed).length;

                // 群聊显示逻辑
                let labelName = '';
                let labelAvatar: React.ReactNode;

                if (t.isGroup) {
                  labelName = `${t.groupName || '群聊'} (${t.groupMembers?.length || 0}人)`;
                  labelAvatar = (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-gradient-to-br from-purple-500 to-pink-500 border border-neutral-700 select-none">
                      👥
                    </div>
                  );
                } else if (t.charAltName) {
                  labelName = `${t.charAltName} (试探小号)`;
                  labelAvatar = (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-neutral-800 border border-neutral-700 select-none">
                      {t.charAltAvatar}
                    </div>
                  );
                } else {
                  labelName = c?.name ?? '未知角色';
                  labelAvatar = c?.avatar ? <img src={c.avatar} className="w-10 h-10 rounded-full object-cover" alt="" /> : <div className="w-10 h-10 rounded-full icon-bg flex items-center justify-center"><MessageCircle size={18} className="icon-color" /></div>;
                }

                return (
                  <Row
                    key={t.id}
                    label={
                      <span className="flex items-center gap-3">
                        {labelAvatar}
                        <span className="truncate max-w-[140px]">{labelName}</span>
                        {unreadEvents > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ background: 'var(--accent)' }}>{unreadEvents}</span>}
                      </span>
                    }
                    hint={last ? `${last.role === 'user' ? '我：' : ''}${last.content.slice(0, 30)}` : ''}
                    onClick={() => setActiveThreadId(t.id)}
                    right={<button onClick={(e) => { e.stopPropagation(); setConfirmDel(t); }} className="tap txt-dim"><Trash2 size={15} /></button>}
                  />
                );
              })}
            </ListGroup>
          )}
        </>
      ) : (
        /* FRIEND REQUESTS TAB */
        <div className="space-y-4">
          {/* Sub tab selectors */}
          <div className="flex gap-2 p-1 glass rounded-xl">
            <button
              onClick={() => setReqTab('received')}
              className={`flex-1 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${reqTab === 'received' ? 'icon-bg-active txt-accent' : 'txt-faint'}`}
            >
              收到的申请 {pendingIncomingCount > 0 && `(${pendingIncomingCount})`}
            </button>
            <button
              onClick={() => setReqTab('sent')}
              className={`flex-1 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${reqTab === 'sent' ? 'icon-bg-active txt-accent' : 'txt-faint'}`}
            >
              我发出的试探
            </button>
          </div>

          {reqTab === 'received' ? (
            /* RECEIVED REQUESTS (Character probing User) */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] txt-faint pr-2">AI角色会使用伪装身份向你发起好友申请进行试探！</span>
                <button
                  onClick={() => {
                    setProbeCharId(characters[0]?.id || '');
                    setProbeUserId(activeUserId || currentUser?.id || '');
                    setTriggeringProbe(true);
                  }}
                  disabled={generatingIncoming}
                  className="tap flex items-center gap-1 px-3 h-8 rounded-lg text-[11px] txt-accent glass shrink-0"
                >
                  <RefreshCw size={11} className={generatingIncoming ? 'animate-spin' : ''} />
                  {generatingIncoming ? '生成中…' : '🔮 触发试探'}
                </button>
              </div>

              {friendRequests.filter((r) => r.type === 'incoming' && r.userId === activeUserId).length === 0 ? (
                <div className="glass rounded-2xl py-10 text-center txt-faint text-sm">
                  暂时没有收到小号试探。可以点击右上角「触发试探」立刻让AI角色来加你！
                </div>
              ) : (
                <div className="space-y-3">
                  {friendRequests
                    .filter((r) => r.type === 'incoming' && r.userId === activeUserId)
                    .map((r) => {
                      const c = characters.find((char) => char.id === r.characterId);
                      const isRevealed = !!revealedChars[r.id];
                      return (
                        <div key={r.id} className="glass rounded-2xl p-3.5 space-y-3 border border-[var(--border)]">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-neutral-800 flex items-center justify-center text-2xl border border-neutral-700 select-none">
                              {r.charAltAvatar || '🕵️'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[14px] font-semibold flex items-center gap-1.5">
                                {r.charAltName}
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 shrink-0">匿名试探</span>
                              </div>
                              <div className="text-[10px] txt-faint">申请时间: {new Date(r.ts).toLocaleDateString()}</div>
                            </div>
                          </div>
                          
                          <div className="text-[13px] leading-relaxed p-2.5 rounded-xl bg-neutral-900/50 border border-neutral-800 txt-dim italic">
                            “ {r.intro} ”
                          </div>

                          {/* Show spoiler true character details */}
                          <div className="flex items-center justify-between text-[11px]">
                            <button
                              onClick={() => setRevealedChars((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}
                              className="text-[11px] txt-accent hover:underline flex items-center gap-1"
                            >
                              <Smile size={12} />
                              {isRevealed ? '隐藏真实身份' : '🕵️ 偷看他的真实身份'}
                            </button>
                            {isRevealed && c && (
                              <span className="txt-accent text-[11px] font-medium">
                                真实角色：<strong className="underline">{c.name}</strong>
                              </span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          {r.status === 'pending' ? (
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => declineIncoming(r)}
                                className="tap flex-1 h-9 rounded-xl glass text-[13px] font-medium flex items-center justify-center gap-1 text-red-400"
                              >
                                <UserX size={15} /> 拒绝
                              </button>
                              <button
                                onClick={() => acceptIncoming(r)}
                                className="tap flex-1 h-9 rounded-xl font-medium text-[13px] text-white flex items-center justify-center gap-1"
                                style={{ background: 'var(--accent)', color: 'var(--bg)' }}
                              >
                                <UserCheck size={15} /> 接受
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between pt-1 text-[13px]">
                              <span className={`text-[12px] font-medium ${r.status === 'accepted' ? 'text-green-500' : 'text-neutral-500'}`}>
                                {r.status === 'accepted' ? '✓ 已接受好友' : '✕ 已拒绝'}
                              </span>
                              {r.status === 'accepted' && (
                                <button
                                  onClick={() => {
                                    const t = threads.find((th) => th.characterId === r.characterId && th.userId === r.userId && th.charAltName === r.charAltName);
                                    if (t) setActiveThreadId(t.id);
                                  }}
                                  className="px-3 py-1 rounded-lg text-[12px] txt-accent bg-[var(--icon-bg-active)] font-medium"
                                >
                                  进入会话
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          ) : (
            /* SENT REQUESTS (User alt-account probing Character) */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] txt-faint pr-2">你可以开着小号对角色进行试探，看看他们是否会通过！</span>
                <button
                  onClick={() => {
                    setReqSenderId(activeUserId || currentUser?.id || '');
                    setReqCharId(characters[0]?.id || '');
                    setComposingReq(true);
                  }}
                  className="tap flex items-center gap-1 px-3 h-8 rounded-lg text-[11px] text-white font-medium shrink-0"
                  style={{ background: 'var(--accent)', color: 'var(--bg)' }}
                >
                  <UserPlus size={11} />
                  发送试探
                </button>
              </div>

              {friendRequests.filter((r) => r.type === 'outgoing' && r.userId === activeUserId).length === 0 ? (
                <div className="glass rounded-2xl py-10 text-center txt-faint text-sm">
                  你还没有向角色发送过小号试探。点「发送试探」开始！
                </div>
              ) : (
                <div className="space-y-3">
                  {friendRequests
                    .filter((r) => r.type === 'outgoing' && r.userId === activeUserId)
                    .map((r) => {
                      const c = characters.find((char) => char.id === r.characterId);
                      const u = users.find((x) => x.id === r.userId);
                      return (
                        <div key={r.id} className="glass rounded-2xl p-3.5 space-y-3 border border-[var(--border)]">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] txt-faint flex items-center gap-1">
                              <Layers size={11} />
                              使用身份：<strong className="txt-dim">{u?.nickname || '我'}</strong>
                            </span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${r.status === 'accepted' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                              {r.status === 'accepted' ? '对方已同意' : '对方已拒绝'}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="text-[13px] font-medium text-neutral-400">
                              向 <strong className="txt-accent font-semibold">{c?.name}</strong> 发送申请：
                            </div>
                            <div className="text-[13px] leading-relaxed p-2.5 rounded-xl bg-neutral-900/50 border border-neutral-800 txt-dim italic">
                              “ {r.intro} ”
                            </div>
                          </div>

                          {r.reply && (
                            <div className="space-y-1 p-2.5 rounded-xl bg-[var(--icon-bg)] border border-[var(--border)]">
                              <div className="text-[11px] font-medium txt-accent">
                                💬 {c?.name} 的回复：
                              </div>
                              <div className="text-[13px] leading-relaxed txt-dim">
                                {r.reply}
                              </div>
                            </div>
                          )}

                          {r.status === 'accepted' && (
                            <div className="flex justify-end pt-1">
                              <button
                                onClick={() => {
                                  const t = threads.find((th) => th.characterId === r.characterId && th.userId === r.userId && !th.charAltName);
                                  if (t) setActiveThreadId(t.id);
                                }}
                                className="px-3 py-1.5 rounded-xl text-[12px] font-medium text-white"
                                style={{ background: 'var(--accent)', color: 'var(--bg)' }}
                              >
                                开始聊天
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal to compose Outgoing Request */}
      <Modal open={composingReq} onClose={() => setComposingReq(false)} title="新建小号试探好友申请">
        <div className="space-y-4">
          <div>
            <label className="text-[12px] txt-faint block mb-1">选择你用于试探的身份</label>
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto no-scrollbar">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setReqSenderId(u.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left border ${reqSenderId === u.id ? 'border-[var(--accent)] bg-[var(--icon-bg-active)]' : 'border-[var(--border)] glass'}`}
                >
                  <div>
                    <span className="text-[13px] font-medium txt-dim">{u.nickname}</span>
                    {u.isAlt && <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-semibold">小号</span>}
                  </div>
                  <span className="text-[11px] txt-faint truncate max-w-[120px]">{u.signature}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[12px] txt-faint block mb-1">选择目标 AI 角色</label>
            <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto no-scrollbar">
              {characters.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setReqCharId(c.id)}
                  className={`p-2 rounded-xl text-center border text-[13px] truncate ${reqCharId === c.id ? 'border-[var(--accent)] bg-[var(--icon-bg-active)] txt-accent' : 'border-[var(--border)] glass txt-dim'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[12px] txt-faint block mb-1">输入申请验证消息（试探内容）</label>
            <textarea
              value={reqIntro}
              onChange={(e) => setReqIntro(e.target.value)}
              placeholder="例如：哈喽，今天在自习室看到你，觉得你很有气质，可以通过一下吗？或者问一些敏感的秘密..."
              rows={3}
              maxLength={150}
              className="w-full glass rounded-xl p-2.5 text-[13px] outline-none bg-transparent resize-none border border-[var(--border)] placeholder:text-[var(--text-faint)]"
            />
          </div>

          <button
            onClick={submitOutgoingRequest}
            disabled={submittingReq || !reqCharId || !reqIntro.trim()}
            className="tap w-full h-11 rounded-full font-medium text-[14px] flex items-center justify-center gap-1.5 text-white disabled:opacity-40"
            style={{ background: 'var(--accent)', color: 'var(--bg)' }}
          >
            {submittingReq ? (
              <>
                <span className="animate-spin text-sm">⏳</span> 对方正在考虑中…
              </>
            ) : (
              '发送好友试探申请'
            )}
          </button>
        </div>
      </Modal>

      {/* Modal to compose Outgoing Request */}
      <Modal open={composingReq} onClose={() => { setComposingReq(false); setIsCreatingUser(false); }} title="新建小号试探好友申请">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[12px] txt-faint">选择你用于试探的身份</label>
              {!isCreatingUser && (
                <button
                  type="button"
                  onClick={() => setIsCreatingUser(true)}
                  className="text-[11px] txt-accent flex items-center gap-0.5 hover:underline"
                >
                  ➕ 快速创建测试账号
                </button>
              )}
            </div>

            {isCreatingUser ? (
              <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-neutral-900/40 space-y-3 animate-fade-in">
                <div className="text-[11.5px] font-bold txt-accent">新建测试账号/身份</div>
                <input
                  type="text"
                  value={newNick}
                  onChange={(e) => setNewNick(e.target.value)}
                  placeholder="输入账号昵称 (如: 极速测试员 / 侦探小白)"
                  className="w-full glass rounded-xl px-3 py-2 text-[12px] outline-none bg-transparent"
                />
                <input
                  type="text"
                  value={newSig}
                  onChange={(e) => setNewSig(e.target.value)}
                  placeholder="输入个性签名/描述"
                  className="w-full glass rounded-xl px-3 py-2 text-[12px] outline-none bg-transparent"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] txt-dim select-none">
                    <input
                      type="checkbox"
                      checked={newIsAlt}
                      onChange={(e) => setNewIsAlt(e.target.checked)}
                      className="w-3.5 h-3.5 accent-[var(--accent)]"
                    />
                    设为匿名小号
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatingUser(false)}
                      className="px-3 py-1.5 rounded-lg glass text-[11px] txt-dim"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickCreateUser}
                      disabled={!newNick.trim()}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-white disabled:opacity-40"
                      style={{ background: 'var(--accent)', color: 'var(--bg)' }}
                    >
                      创建并使用
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto no-scrollbar">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setReqSenderId(u.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left border ${reqSenderId === u.id ? 'border-[var(--accent)] bg-[var(--icon-bg-active)]' : 'border-[var(--border)] glass'}`}
                  >
                    <div>
                      <span className="text-[13px] font-medium txt-dim">{u.nickname}</span>
                      {u.isAlt && <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-semibold">小号</span>}
                    </div>
                    <span className="text-[11px] txt-faint truncate max-w-[120px]">{u.signature}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-[12px] txt-faint block mb-1">选择目标 AI 角色</label>
            <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto no-scrollbar">
              {characters.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setReqCharId(c.id)}
                  className={`p-2 rounded-xl text-center border text-[13px] truncate ${reqCharId === c.id ? 'border-[var(--accent)] bg-[var(--icon-bg-active)] txt-accent' : 'border-[var(--border)] glass txt-dim'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[12px] txt-faint block mb-1">输入申请验证消息（试探内容）</label>
            <textarea
              value={reqIntro}
              onChange={(e) => setReqIntro(e.target.value)}
              placeholder="例如：哈喽，今天在自习室看到你，觉得你很有气质，可以通过一下吗？或者问一些敏感的秘密..."
              rows={3}
              maxLength={150}
              className="w-full glass rounded-xl p-2.5 text-[13px] outline-none bg-transparent resize-none border border-[var(--border)] placeholder:text-[var(--text-faint)]"
            />
          </div>

          <button
            onClick={submitOutgoingRequest}
            disabled={submittingReq || !reqCharId || !reqIntro.trim()}
            className="tap w-full h-11 rounded-full font-medium text-[14px] flex items-center justify-center gap-1.5 text-white disabled:opacity-40"
            style={{ background: 'var(--accent)', color: 'var(--bg)' }}
          >
            {submittingReq ? (
              <>
                <span className="animate-spin text-sm">⏳</span> 对方正在考虑中…
              </>
            ) : (
              '发送好友试探申请'
            )}
          </button>
        </div>
      </Modal>

      {/* Modal to configure and Trigger Incoming Request (AI probing User) */}
      <Modal open={triggeringProbe} onClose={() => setTriggeringProbe(false)} title="触发 AI 角色小号试探">
        <div className="space-y-4">
          <div className="text-[12.5px] txt-dim leading-relaxed">
            AI 角色也会创建“匿名小号”来主动添加你的账号，试图隐藏真实身份对你发起剧情试探或调戏！在下方选择发起与接收方：
          </div>

          <div>
            <label className="text-[12px] txt-faint block mb-1.5 font-medium">发起试探的 AI 角色</label>
            <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto no-scrollbar">
              <button
                onClick={() => setProbeCharId('')}
                className={`p-2 rounded-xl text-center border text-[13px] truncate ${probeCharId === '' ? 'border-[var(--accent)] bg-[var(--icon-bg-active)] txt-accent font-semibold' : 'border-[var(--border)] glass txt-dim'}`}
              >
                🎲 随机角色
              </button>
              {characters.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setProbeCharId(c.id)}
                  className={`p-2 rounded-xl text-center border text-[13px] truncate ${probeCharId === c.id ? 'border-[var(--accent)] bg-[var(--icon-bg-active)] txt-accent font-semibold' : 'border-[var(--border)] glass txt-dim'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[12px] txt-faint block mb-1.5 font-medium">接收申请的用户账号 (Identity)</label>
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto no-scrollbar">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setProbeUserId(u.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left border ${probeUserId === u.id ? 'border-[var(--accent)] bg-[var(--icon-bg-active)] font-semibold' : 'border-[var(--border)] glass'}`}
                >
                  <div>
                    <span className="text-[13px] txt-dim">{u.nickname}</span>
                    {u.isAlt && <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-semibold">小号</span>}
                    {activeUserId === u.id && <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent-2)] text-white">当前</span>}
                  </div>
                  <span className="text-[11px] txt-faint truncate max-w-[120px]">{u.signature}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setTriggeringProbe(false)}
              className="tap flex-1 h-11 rounded-full glass text-[13px] font-medium"
            >
              取消
            </button>
            <button
              onClick={() => triggerCharacterProbing(probeCharId || undefined, probeUserId || undefined)}
              disabled={generatingIncoming}
              className="tap flex-1 h-11 rounded-full font-medium text-[13px] text-white flex items-center justify-center gap-1.5"
              style={{ background: 'var(--accent)', color: 'var(--bg)' }}
            >
              {generatingIncoming ? (
                <>
                  <span className="animate-spin text-sm">⏳</span> 智能生成中…
                </>
              ) : (
                '🔮 触发试探'
              )}
            </button>
          </div>
        </div>
      </Modal>
      <Modal open={pickingChar} onClose={() => setPickingChar(false)} title="选择角色开始聊天">
        {characters.length === 0 ? (
          <div className="text-center txt-faint py-6">还没有角色。去「我的」创建吧。</div>
        ) : (
          <>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => { setPickingChar(false); setPickingForGroup(true); }}
                className="tap flex-1 h-10 rounded-xl glass text-[13px] font-medium flex items-center justify-center gap-1.5 txt-accent"
              >
                <Plus size={16} /> 创建群聊
              </button>
            </div>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto no-scrollbar">
              {characters.map((c) => (
                <button key={c.id} onClick={() => startChat(c.id)} className="tap w-full flex items-center gap-3 p-2.5 rounded-xl glass">
                  {c.avatar ? <img src={c.avatar} className="w-10 h-10 rounded-full object-cover" alt="" /> : <div className="w-10 h-10 rounded-full icon-bg flex items-center justify-center"><MessageCircle size={18} className="icon-color" /></div>}
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-[15px]">{c.name}</div>
                    <div className="text-[12px] txt-faint truncate">{c.signature}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </Modal>

      {/* 创建群聊模态框 */}
      <Modal open={pickingForGroup} onClose={() => { setPickingForGroup(false); setSelectedGroupChars([]); setGroupName(''); }} title="创建群聊">
        <div className="space-y-4">
          <div>
            <label className="text-[12px] txt-faint block mb-2">选择群成员（多选，至少2个）</label>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto no-scrollbar">
              {characters.map((c) => {
                const isSelected = selectedGroupChars.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedGroupChars(selectedGroupChars.filter(id => id !== c.id));
                      } else {
                        setSelectedGroupChars([...selectedGroupChars, c.id]);
                      }
                    }}
                    className={`tap w-full flex items-center gap-3 p-2.5 rounded-xl border ${isSelected ? 'border-[var(--accent)] bg-[var(--icon-bg-active)]' : 'border-[var(--border)] glass'}`}
                  >
                    {c.avatar ? <img src={c.avatar} className="w-10 h-10 rounded-full object-cover" alt="" /> : <div className="w-10 h-10 rounded-full icon-bg flex items-center justify-center"><MessageCircle size={18} className="icon-color" /></div>}
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-[15px]">{c.name}</div>
                      <div className="text-[12px] txt-faint truncate">{c.signature}</div>
                    </div>
                    {isSelected && <div className="w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-[11px]">✓</div>}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[12px] txt-faint block mb-1">群聊名称（可选）</label>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="不填写则自动生成"
              className="w-full glass rounded-xl px-3 h-11 text-[14px] outline-none bg-transparent"
            />
          </div>

          <div className="text-[12px] txt-faint">
            已选择 {selectedGroupChars.length} 个角色
          </div>

          <button
            onClick={createGroupChat}
            disabled={selectedGroupChars.length < 2}
            className="tap w-full h-11 rounded-full font-medium text-[14px] text-white disabled:opacity-40"
            style={{ background: 'var(--accent)', color: 'var(--bg)' }}
          >
            创建群聊
          </button>
        </div>
      </Modal>

      <Confirm open={!!confirmDel} title="删除对话" message="确定删除这段对话？所有消息将清除。" danger onConfirm={() => { if (confirmDel) onChange(threads.filter((t) => t.id !== confirmDel.id)); setConfirmDel(null); }} onCancel={() => setConfirmDel(null)} />

      <Confirm open={confirmDelAll} title="清空全部对话" message="确定要清空您当前的所有对话吗？此操作将永久清除全部聊天记录且不可撤销。" danger onConfirm={() => { onChange(threads.filter((t) => t.userId !== activeUserId)); setConfirmDelAll(false); }} onCancel={() => setConfirmDelAll(false)} />

      {toast && (
        <div className="absolute bottom-20 inset-x-0 flex justify-center z-50 pointer-events-none">
          <div className="glass-strong rounded-full px-4 py-2 text-[13px] animate-fade-in flex items-center gap-2">
            <Sparkles size={14} className="txt-accent" /> {toast}
          </div>
        </div>
      )}
    </AppScreen>
  );
}

function ChatConversation({
  api, char, thread, currentUser, worldEntries, characters, storyEvents, autoNpc,
  activeInteractMode, activeInteractEnabled, onUpdateSettings, onUpdateThread,
  onSend, onBack, onDelete, onNpcDetected, onPlotEvents, onConsumeEvents,
  settings,
}: {
  api: ApiConfig;
  char: Character;
  thread: ChatThread;
  currentUser: UserIdentity | undefined;
  worldEntries: WorldEntry[];
  characters: Character[];
  storyEvents: StoryEvent[];
  autoNpc: boolean;
  activeInteractMode?: 'manual' | 'auto';
  activeInteractEnabled?: boolean;
  onUpdateSettings?: (patch: any) => void;
  onUpdateThread: (updater: (t: ChatThread) => ChatThread) => void;
  onSend: (msgs: ChatMessage[]) => void;
  onBack: () => void;
  onDelete: () => void;
  onNpcDetected: (npcs: Character[]) => void;
  onPlotEvents: (events: StoryEvent[]) => void;
  onConsumeEvents: (ids: string[]) => void;
  settings: AppSettings;
}) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinkingMsg, setThinkingMsg] = useState<string | null>(null);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [showTranslation, setShowTranslation] = useState<Record<string, boolean>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  const toggleTranslate = async (m: ChatMessage) => {
    if (showTranslation[m.id]) {
      setShowTranslation((prev) => ({ ...prev, [m.id]: false }));
      return;
    }
    if (translations[m.id]) {
      setShowTranslation((prev) => ({ ...prev, [m.id]: true }));
      return;
    }

    setTranslatingId(m.id);
    try {
      const prompt = "你是一个专业的高保真中英互译翻译官。请将用户的输入文本进行精准、自然的双语互译。如果是中文文本，请翻译成纯英文；如果是英文、拼音、外文或其他混合文本，请翻译成纯中文。请不要带任何多余的解释、回复或格式（如「好的，这是翻译：」），直接输出翻译后的目标纯文本。";
      const result = await askAI(api, prompt, m.content);
      setTranslations((prev) => ({ ...prev, [m.id]: result }));
      setShowTranslation((prev) => ({ ...prev, [m.id]: true }));
    } catch (err: any) {
      console.error('Translation error:', err);
      alert('翻译失败：' + (err.message || String(err)));
    } finally {
      setTranslatingId(null);
    }
  };

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread.messages, loading]);

  useEffect(() => {
    const unconsumed = storyEvents.filter((e) => !e.consumed);
    if (unconsumed.length) onConsumeEvents(unconsumed.map((e) => e.id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char.id]);

  const buildSystem = (): string => {
    let sys = char.persona || `你是${char.name}。保持角色设定，自然地回应。`;

    // 群聊模式
    if (thread.isGroup && thread.groupMembers) {
      const memberNames = thread.groupMembers
        .map(id => characters.find(c => c.id === id)?.name)
        .filter(Boolean)
        .join('、');
      sys += `\n\n[群聊设定]
这是一个群聊「${thread.groupName}」，成员包括：${memberNames}。
你需要根据对话内容判断是哪个角色在说话，并以相应角色的身份回复。
如果用户@了某个角色，请以该角色的身份回复。
群聊中的记忆与单独对话互通，你记得与用户的所有互动。`;
    }

    // 线上/线下模式
    const mode = thread.interactionMode || 'online';
    if (mode === 'offline') {
      sys += `\n\n[线下模式]
当前是线下模式，模拟现实见面场景。你可以使用动作描写，用 *动作* 或（动作）的格式。
例如："你好呀！*微笑着挥手*" 或 "嗯...(低头思考)"
你们正面对面交流，可以有肢体语言、表情、动作等现实互动。`;
    } else {
      sys += `\n\n[线上模式]
当前是线上模式，模拟微信/QQ等聊天软件。禁止使用动作描写，只能发送文字、表情、图片、语音等线上内容。
回复要符合线上聊天习惯，简洁自然。`;
    }

    if (thread.charAltName) {
      sys += `\n\n[特殊设定]
你现在正在使用你为试探用户特意开启的匿名/试探小号「${thread.charAltName}」来和用户「${currentUser?.nickname || '我'}」聊天！
你的真实身份是「${char.name}」，而用户不知道你这个账号是「${char.name}」开启的。
请深度扮演这个小号设定的个性和特征与用户对话，千万不能穿帮暴露出你真实的${char.name}身份！
但是在你的内心活动（innerThought）中，你必须体现出你作为「${char.name}」在背后使用这个小号观察、试探、调戏用户的真正心理、好笑和得意的态度！`;
    } else if (!thread.isGroup) {
      sys += `\n\n[对话人物设定]
你正在和「${currentUser?.nickname || '我'}」聊天。对方的签名是：「${currentUser?.signature || ''}」${currentUser?.isAlt ? '，此账号是用户的匿名/试探小号。' : '，此账号是用户的主账号。'}`;
    }

    const recent = thread.messages.slice(-6).map((m) => m.content).join(' ');
    const matched = worldEntries.filter((w) => w.key && recent.includes(w.key));
    if (matched.length) {
      sys += '\n\n[世界观参考]\n' + matched.sort((a, b) => b.priority - a.priority).map((w) => `${w.key}：${w.content}`).join('\n');
    }
    const unconsumed = storyEvents.filter((e) => !e.consumed);
    if (unconsumed.length) {
      sys += '\n\n[你应该知道的事]\n' + unconsumed.map((e) => `${e.sourceCharName}那里发生的事：${e.summary}`).join('\n');
    }

    // 回复设置
    const minReplyCount = thread.minReplyCount || 1;
    const maxReplyCount = thread.maxReplyCount || 1;
    const minWords = thread.minWordCount || 50;
    const maxWords = thread.maxWordCount || 120;

    sys += `\n\n[回复要求]
你需要回复 ${minReplyCount} 到 ${maxReplyCount} 条消息（根据对话内容自然决定具体条数）。
每条消息的字数应该在 ${minWords} 到 ${maxWords} 字之间。
${maxReplyCount > 1 ? '多条消息可以形成连贯的对话，例如第一条表达反应，第二条补充细节，第三条延伸话题等。' : ''}
请确保每条消息内容充实，符合字数要求，不要过于简短或冗长。`;

    sys += getPeriodPrompt(settings);
    return sys;
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const userMsg: ChatMessage = { id: uid(), role: 'user', content: text, ts: Date.now() };
    const next = [...thread.messages, userMsg];
    onSend(next);
    setLoading(true);
    setThinkingMsg('对方正在输入…');
    try {
      const history: ChatMsg[] = [
        { role: 'system', content: buildSystem() },
        ...next.map((m) => ({ role: m.role, content: m.content } as ChatMsg)),
      ];
      const rich = await callChatRich(api.chat, history, { temperature: 0.85, maxTokens: 800 });
      const assistantMsg: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: rich.content,
        innerThought: rich.innerThought,
        ts: Date.now(),
      };
      onSend([...next, assistantMsg]);

      // 自动翻译功能
      if (settings.autoTranslateEnabled && assistantMsg.content) {
        // 检测是否包含外语（简单检测：包含英文字母比例超过30%）
        const englishChars = (assistantMsg.content.match(/[a-zA-Z]/g) || []).length;
        const totalChars = assistantMsg.content.length;
        if (totalChars > 0 && englishChars / totalChars > 0.3) {
          // 自动翻译
          try {
            const prompt = "你是一个专业的高保真中英互译翻译官。请将用户的输入文本进行精准、自然的双语互译。如果是中文文本，请翻译成纯英文；如果是英文、拼音、外文或其他混合文本，请翻译成纯中文。请不要带任何多余的解释、回复或格式（如「好的，这是翻译：」），直接输出翻译后的目标纯文本。";
            const result = await askAI(api, prompt, assistantMsg.content);
            setTranslations((prev) => ({ ...prev, [assistantMsg.id]: result }));
            setShowTranslation((prev) => ({ ...prev, [assistantMsg.id]: true }));
          } catch (err) {
            console.error('Auto-translation error:', err);
          }
        }
      }

      // Media generation
      const media: MessageMedia[] = [];
      try {
        if (rich.sendImage && rich.imagePrompt) {
          const appearance = char.imagePromptTemplate ? `${char.imagePromptTemplate}, ` : '';
          const imgUrl = await generateImage(api.image, appearance + rich.imagePrompt, { faceRef: char.faceRef });
          media.push({ kind: 'image', url: imgUrl });
        }
      } catch { /* image optional */ }
      try {
        if (rich.sendVoice && rich.voiceText) {
          const { url, duration } = await textToSpeech(api.voice, rich.voiceText);
          media.push({ kind: 'voice', url, duration, text: rich.voiceText });
        }
      } catch { /* voice optional */ }
      if (media.length) {
        onSend([...next, assistantMsg, { id: uid(), role: 'assistant', content: '', ts: Date.now(), media }]);
      }

      // Background NPC & Plot Event detection
      const recentText = next.slice(-8).map((m) => `${m.role === 'user' ? '用户' : (thread.charAltName || char.name)}：${m.content}`).join('\n');
      const existingNames = characters.map((c) => c.name);

      if (autoNpc) {
        detectNpcs(api, char.name, recentText, existingNames).then((suggestions) => {
          if (suggestions.length) {
            const newChars: Character[] = suggestions.map((s) => ({
              id: uid(),
              name: s.name,
              avatar: '',
              persona: s.persona,
              greeting: s.greeting,
              signature: s.signature,
              imagePromptTemplate: '',
              createdAt: Date.now(),
            }));
            onNpcDetected(newChars);
          }
        }).catch(() => {});
      }

      const otherNames = existingNames.filter((n) => n !== char.name);
      if (otherNames.length) {
        detectPlotEvents(api, char.name, recentText, otherNames).then((events) => {
          if (events.length) {
            const storyEvts: StoryEvent[] = events.map((e) => {
              const target = characters.find((c) => c.name === e.targetName);
              return {
                id: uid(),
                characterId: target?.id ?? '',
                sourceThreadId: thread.id,
                sourceCharName: char.name,
                summary: e.summary,
                ts: Date.now(),
              };
            }).filter((e) => e.characterId);
            if (storyEvts.length) onPlotEvents(storyEvts);
          }
        }).catch(() => {});
      }
    } catch (e) {
      onSend([...next, { id: uid(), role: 'assistant', content: `（出错了：${(e as Error).message}）`, ts: Date.now() }]);
    } finally {
      setLoading(false);
      setThinkingMsg(null);
    }
  };

  const sendActive = async (directive: string, localUserActionText?: string) => {
    if (loading) return;
    setLoading(true);
    setThinkingMsg('对方正在输入…');
    
    let next = [...thread.messages];
    if (localUserActionText) {
      const userMsg: ChatMessage = { id: uid(), role: 'user', content: localUserActionText, ts: Date.now() };
      next = [...next, userMsg];
      onSend(next);
    }
    
    try {
      const history: ChatMsg[] = [
        { role: 'system', content: buildSystem() + `\n\n[系统提示：这是一个特殊的「主动互动」事件。指令：${directive}]` },
        ...next.map((m) => ({ role: m.role, content: m.content } as ChatMsg)),
      ];
      const rich = await callChatRich(api.chat, history, { temperature: 0.9, maxTokens: 800 });
      const assistantMsg: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: rich.content,
        innerThought: rich.innerThought,
        ts: Date.now(),
      };
      onSend([...next, assistantMsg]);

      // 自动翻译功能
      if (settings.autoTranslateEnabled && assistantMsg.content) {
        // 检测是否包含外语（简单检测：包含英文字母比例超过30%）
        const englishChars = (assistantMsg.content.match(/[a-zA-Z]/g) || []).length;
        const totalChars = assistantMsg.content.length;
        if (totalChars > 0 && englishChars / totalChars > 0.3) {
          // 自动翻译
          try {
            const prompt = "你是一个专业的高保真中英互译翻译官。请将用户的输入文本进行精准、自然的双语互译。如果是中文文本，请翻译成纯英文；如果是英文、拼音、外文或其他混合文本，请翻译成纯中文。请不要带任何多余的解释、回复或格式（如「好的，这是翻译：」），直接输出翻译后的目标纯文本。";
            const result = await askAI(api, prompt, assistantMsg.content);
            setTranslations((prev) => ({ ...prev, [assistantMsg.id]: result }));
            setShowTranslation((prev) => ({ ...prev, [assistantMsg.id]: true }));
          } catch (err) {
            console.error('Auto-translation error:', err);
          }
        }
      }

      // Media generation
      const media: MessageMedia[] = [];
      try {
        if (rich.sendImage && rich.imagePrompt) {
          const appearance = char.imagePromptTemplate ? `${char.imagePromptTemplate}, ` : '';
          const imgUrl = await generateImage(api.image, appearance + rich.imagePrompt, { faceRef: char.faceRef });
          media.push({ kind: 'image', url: imgUrl });
        }
      } catch { /* image optional */ }
      try {
        if (rich.sendVoice && rich.voiceText) {
          const { url, duration } = await textToSpeech(api.voice, rich.voiceText);
          media.push({ kind: 'voice', url, duration, text: rich.voiceText });
        }
      } catch { /* voice optional */ }
      if (media.length) {
        onSend([...next, assistantMsg, { id: uid(), role: 'assistant', content: '', ts: Date.now(), media }]);
      }
    } catch (e) {
      onSend([...next, { id: uid(), role: 'assistant', content: `（互动出错了：${(e as Error).message}）`, ts: Date.now() }]);
    } finally {
      setLoading(false);
      setThinkingMsg(null);
    }
  };

  const startLongPress = (m: ChatMessage) => {
    if (m.role !== 'assistant' || !m.innerThought) return;
    longPressTimer.current = setTimeout(() => setThinkingMsg(m.innerThought!), 600);
  };
  const cancelLongPress = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };

  const unconsumedEvents = storyEvents.filter((e) => !e.consumed);
  const displayTitle = thread.charAltName ? `${thread.charAltName} (试探小号)` : (thread.isGroup ? thread.groupName : char.name);
  const currentMode = thread.interactionMode || 'online';

  return (
    <AppScreen
      title={displayTitle}
      onBack={onBack}
      noPad
      right={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChatSettings(true)}
            className="tap txt-dim hover:txt-accent transition-colors"
            title="对话设置"
          >
            <Settings size={18} />
          </button>
          <button onClick={onDelete} className="tap txt-dim"><Trash2 size={18} /></button>
        </div>
      }
    >
      {unconsumedEvents.length > 0 && (
        <div className="px-4 py-2 text-[11px] txt-accent glass border-b border-[var(--border)] flex items-center gap-1.5 shrink-0">
          <Sparkles size={12} /> {unconsumedEvents.length} 条新剧情线索已感知
        </div>
      )}
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3 space-y-3">
          {thread.messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                onPointerDown={() => startLongPress(m)}
                onPointerUp={cancelLongPress}
                onPointerLeave={cancelLongPress}
                className={`max-w-[78%] space-y-2 ${m.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}
              >
                {m.content && (
                  <div className="flex flex-col gap-1 items-start w-full">
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-[14px] leading-relaxed ${m.role === 'user' ? 'rounded-br-md text-white font-medium' : 'glass rounded-bl-md'}`}
                      style={m.role === 'user' ? { background: 'var(--accent)', color: 'var(--bg)' } : undefined}
                    >
                      {m.content}
                    </div>
                    {/* Inline translation display */}
                    {translations[m.id] && showTranslation[m.id] && (
                      <div className="px-3 py-1.5 rounded-xl text-[12px] bg-indigo-500/10 border border-indigo-500/15 text-indigo-200 leading-relaxed max-w-full animate-fade-in mt-1 select-text">
                        <div className="text-[10px] text-indigo-400 font-bold mb-0.5 flex items-center gap-1">
                          <span>🌐 翻译 / Translation</span>
                        </div>
                        {translations[m.id]}
                      </div>
                    )}
                    {/* Action trigger row - 已隐藏，翻译功能移至设置中的自动翻译 */}
                  </div>
                )}
                {m.media?.map((md, i) => <MediaBubble key={i} media={md} />)}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="glass rounded-2xl rounded-bl-md px-3.5 py-3 flex items-center gap-1">
                {[0,1,2].map((i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-current txt-faint animate-pulse-soft" style={{ animationDelay: `${i*0.2}s` }} />)}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="px-3 py-1.5 border-t border-[var(--border)] flex items-center gap-2 overflow-x-auto no-scrollbar bg-neutral-900/30 shrink-0">
          <button 
            type="button"
            onClick={() => {
              if (onUpdateSettings) {
                const enabled = activeInteractEnabled !== false;
                if (!enabled) {
                  onUpdateSettings({ activeInteractEnabled: true, activeInteractMode: 'manual' });
                } else if (activeInteractMode === 'manual') {
                  onUpdateSettings({ activeInteractMode: 'auto' });
                } else {
                  onUpdateSettings({ activeInteractEnabled: false });
                }
              }
            }}
            className="px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 shrink-0 select-none transition-all duration-300"
            style={{ 
              background: activeInteractEnabled === false ? 'var(--icon-bg)' : 'var(--icon-bg-active)',
              color: activeInteractEnabled === false ? 'var(--text-faint)' : 'var(--accent)'
            }}
          >
            ⚡ 主动互动: {activeInteractEnabled === false ? '已关' : activeInteractMode === 'auto' ? '自动挡' : '手动挡'}
          </button>

          {activeInteractEnabled !== false && (
            <>
              <button 
                type="button"
                onClick={() => sendActive('用户刚刚拍了拍你，请根据你的人设，以你独特的风格拍回去或说点什么。也可以选择发张生活照或者发段语音。', `我 👏 拍了拍 ${thread.charAltName || char.name}`)} 
                className="px-2.5 py-1 rounded-full text-[11px] glass txt-dim hover:txt-accent transition-colors shrink-0"
              >
                👏 拍一拍
              </button>
              <button 
                type="button"
                onClick={() => sendActive('用户希望你主动。请完全由你主动开启一个新话题，聊聊你的最新烦恼、趣事、秘密，或者你脑子里正想着什么。也可以主动发照片或语音。')} 
                className="px-2.5 py-1 rounded-full text-[11px] glass txt-dim hover:txt-accent transition-colors shrink-0"
              >
                🔮 主动搭讪
              </button>
              <button 
                type="button"
                onClick={() => sendActive('用户想看你的自拍/照片。请配合，写一个详细的英文绘图提示词描述你自己的肖像，并且 sendImage 必须设为 true。')} 
                className="px-2.5 py-1 rounded-full text-[11px] glass txt-dim hover:txt-accent transition-colors shrink-0"
              >
                📸 发自拍
              </button>
              <button 
                type="button"
                onClick={() => sendActive('用户想听你的声音。请配合，写下你要发的声音文本，并且 sendVoice 必须设为 true。')} 
                className="px-2.5 py-1 rounded-full text-[11px] glass txt-dim hover:txt-accent transition-colors shrink-0"
              >
                🎙️ 发语音
              </button>
            </>
          )}
        </div>
        <div className="px-3 py-2 border-t border-[var(--border)] flex items-center gap-2 shrink-0 bg-neutral-950/20">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={`对 ${thread.charAltName || char.name} 说…`} className="flex-1 glass rounded-full px-4 h-10 text-[14px] outline-none bg-transparent placeholder:text-[var(--text-faint)]" />
          <button onClick={send} disabled={loading || !input.trim()} className="tap w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 shrink-0" style={{ background: 'var(--accent)', color: 'var(--bg)' }}><Send size={18} /></button>
        </div>
      </div>

      {thinkingMsg && thinkingMsg !== '对方正在输入…' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-8" onClick={() => setThinkingMsg(null)}>
          <div className="absolute inset-0 bg-black/60 animate-fade-in" />
          <div className="relative glass-strong rounded-2xl p-5 max-w-[88%] animate-sheet-up border border-[var(--border)] shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 txt-accent text-[13px] font-semibold"><Eye size={15} /> 悄悄看 {thread.charAltName || char.name} 的心声</div>
              <button onClick={() => setThinkingMsg(null)} className="tap txt-dim"><X size={16} /></button>
            </div>
            <div className="text-[14px] leading-relaxed txt-dim">{thinkingMsg}</div>
          </div>
        </div>
      )}

      {/* 对话设置模态框 */}
      <Modal open={showChatSettings} onClose={() => setShowChatSettings(false)} title="对话设置">
        <div className="space-y-4">
          <div>
            <label className="text-[13px] txt-dim block mb-2 font-medium">交互模式</label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onUpdateThread((t) => ({ ...t, interactionMode: 'online' }));
                }}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all ${currentMode === 'online' ? 'bg-[var(--accent)] text-white' : 'glass txt-dim'}`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Wifi size={16} />
                  <span>线上模式</span>
                </div>
                <div className="text-[10px] opacity-80 mt-1">禁止动作描写</div>
              </button>
              <button
                onClick={() => {
                  onUpdateThread((t) => ({ ...t, interactionMode: 'offline' }));
                }}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all ${currentMode === 'offline' ? 'bg-[var(--accent)] text-white' : 'glass txt-dim'}`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <WifiOff size={16} />
                  <span>线下模式</span>
                </div>
                <div className="text-[10px] opacity-80 mt-1">允许动作描写</div>
              </button>
            </div>
          </div>

          <div className="text-[12px] txt-faint leading-relaxed p-3 rounded-xl bg-neutral-900/50 border border-neutral-800">
            {currentMode === 'online' ? (
              <>
                <strong className="txt-accent">线上模式：</strong>模拟微信/QQ等聊天软件，禁止使用动作描写，只能发送文字、表情、图片、语音等线上内容。
              </>
            ) : (
              <>
                <strong className="txt-accent">线下模式：</strong>模拟现实见面场景，可以使用动作描写如 *微笑* 或 (挥手)，支持肢体语言、表情等现实互动。
              </>
            )}
          </div>

          {/* 回复条数设置 */}
          <div>
            <label className="text-[13px] txt-dim block mb-2 font-medium">角色每次回复条数范围</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] txt-faint block mb-1">最少回复条数</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={thread.minReplyCount || 1}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    onUpdateThread((t) => ({ ...t, minReplyCount: Math.max(1, Math.min(10, val)) }));
                  }}
                  className="w-full glass rounded-xl px-3 h-9 text-[13px] outline-none bg-transparent"
                />
              </div>
              <div>
                <label className="text-[11px] txt-faint block mb-1">最多回复条数</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={thread.maxReplyCount || 1}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    onUpdateThread((t) => ({ ...t, maxReplyCount: Math.max(1, Math.min(20, val)) }));
                  }}
                  className="w-full glass rounded-xl px-3 h-9 text-[13px] outline-none bg-transparent"
                />
              </div>
            </div>
            <div className="text-[11px] txt-faint mt-1.5">
              当前设置：每次回复 {thread.minReplyCount || 1} - {thread.maxReplyCount || 1} 条消息
            </div>
          </div>

          {/* 字数范围设置 */}
          <div>
            <label className="text-[13px] txt-dim block mb-2 font-medium">每条消息字数范围</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] txt-faint block mb-1">最少字数</label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={thread.minWordCount || 50}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 50;
                    onUpdateThread((t) => ({ ...t, minWordCount: Math.max(10, Math.min(500, val)) }));
                  }}
                  className="w-full glass rounded-xl px-3 h-9 text-[13px] outline-none bg-transparent"
                />
              </div>
              <div>
                <label className="text-[11px] txt-faint block mb-1">最多字数</label>
                <input
                  type="number"
                  min="20"
                  max="2000"
                  value={thread.maxWordCount || 120}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 120;
                    onUpdateThread((t) => ({ ...t, maxWordCount: Math.max(20, Math.min(2000, val)) }));
                  }}
                  className="w-full glass rounded-xl px-3 h-9 text-[13px] outline-none bg-transparent"
                />
              </div>
            </div>
            <div className="text-[11px] txt-faint mt-1.5">
              当前设置：每条消息 {thread.minWordCount || 50} - {thread.maxWordCount || 120} 字
            </div>
          </div>

          <div className="text-[11px] txt-faint">
            💡 提示：线上/线下模式的记忆是互通的，切换模式不会丢失聊天记录。
          </div>
        </div>
      </Modal>
    </AppScreen>
  );
}

function MediaBubble({ media }: { key?: any; media: MessageMedia }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (media.kind === 'image') {
    return (
      <div className="rounded-2xl overflow-hidden max-w-[220px] glass rounded-bl-md p-1">
        <img src={media.url} alt="" referrerPolicy="no-referrer" className="w-full rounded-xl object-cover" />
      </div>
    );
  }
  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(media.url);
      audioRef.current.addEventListener('ended', () => setPlaying(false));
    }
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };
  return (
    <button onClick={toggle} className="tap flex items-center gap-2 glass rounded-2xl rounded-bl-md px-3.5 py-2.5 min-w-[120px]">
      {playing ? <Pause size={16} className="txt-accent" /> : <Mic size={16} className="txt-accent" />}
      <div className="flex-1 text-left">
        <div className="text-[13px] txt-accent">{playing ? '播放中…' : '语音消息'}</div>
        {media.duration ? <div className="text-[10px] txt-faint">{media.duration}″</div> : null}
      </div>
      <Play size={14} className="txt-dim" />
    </button>
  );
}
