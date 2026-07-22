import { useEffect, useState } from 'react';
import { callChatRich, generateIncomingRequest, generateImage, textToSpeech, type ChatMsg } from '../api';
import { Desktop } from './Desktop';
import { StatusBar } from './StatusBar';
import { ComingSoon } from './ComingSoon';
import { MeApp } from '../apps/MeApp';
import { AssistantScreen } from '../apps/AssistantScreen';
import { ApiPresetScreen, presetToApi } from '../apps/ApiPresetScreen';
import { ManualScreen } from '../apps/ManualScreen';
import { CalendarScreen } from '../apps/CalendarScreen';
import { MusicScreen } from '../apps/MusicScreen';
import { AlbumScreen } from '../apps/AlbumScreen';
import { ContactsScreen } from '../apps/ContactsScreen';
import { ChatScreen } from '../apps/ChatScreen';
import { SmsScreen } from '../apps/SmsScreen';
import { MomentsScreen } from '../apps/MomentsScreen';
import { MailScreen } from '../apps/MailScreen';
import { WaimaiScreen } from '../apps/WaimaiScreen';
import { XiaohongshuScreen } from '../apps/XiaohongshuScreen';
import { NovelScreen } from '../apps/NovelScreen';
import { ShopScreen } from '../apps/ShopScreen';
import { NotesScreen } from '../apps/NotesScreen';
import { DiaryScreen } from '../apps/DiaryScreen';
import { WalletScreen } from '../apps/WalletScreen';
import { WeatherScreen } from '../apps/WeatherScreen';
import { CalculatorScreen } from '../apps/CalculatorScreen';
import { BrowserScreen } from '../apps/BrowserScreen';
import { ForumScreen } from '../apps/ForumScreen';
import { CharacterScreen } from '../apps/CharacterScreen';
import { GeneratorScreen } from '../apps/GeneratorScreen';
import { SocialScreen } from '../apps/SocialScreen';
import { TruthOrDareScreen } from '../apps/TruthOrDareScreen';
import { PeriodScreen, getPeriodPrompt } from '../apps/PeriodScreen';
import { TimePerceptionScreen } from '../apps/TimePerceptionScreen';
// v3.0 新增应用
import { IdentityScreenV3 } from '../apps/IdentityScreenV3';
import { SettingsScreenV3 } from '../apps/SettingsScreenV3';
import { AnniversaryScreen } from '../apps/AnniversaryScreen';
import {
  GroupChatScreen,
  PhoneCheckScreen,
  OfflineModeScreen,
  CoupleSpaceScreen,
  HomeSystemScreen,
  TurtleSoupScreen,
  GamesScreen,
  WeiboScreen,
  TwitterScreen,
  MemoryScreen,
  WeightManageScreen,
  DiscoverScreen,
  AltAccountsScreen,
  KitchenScreen,
  ClosetScreen,
} from '../apps/V3NewApps';
import { Sheet } from './Sheet';
import { useMusicPlayer } from '../useMusicPlayer';
import { isDark } from '../themes';
import { SHORTCUT_BALL_ID } from '../apps';
import type { AppSettings, DesktopLayout, PersistShape } from '../types';

type Shortcut = 'assistant' | 'apiPreset' | 'manual' | null;
type OpenApp = string | Shortcut | null;

export function PhoneShell({
  state,
  settings,
  updateSettings,
  replaceState,
}: {
  state: PersistShape;
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  replaceState: (next: PersistShape) => void;
}) {
  const [hasError, setHasError] = useState(false);
  useEffect(() => {
    const errorListener = () => setHasError(true);
    window.addEventListener('error', errorListener);
    window.addEventListener('unhandledrejection', errorListener);
    return () => {
      window.removeEventListener('error', errorListener);
      window.removeEventListener('unhandledrejection', errorListener);
    };
  }, []);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-neutral-950 text-white p-8">
        <h1 className="text-4xl mb-4">💔</h1>
        <p className="text-center text-sm mb-6 opacity-80">系统出现了一点小波动，重载一下试试看。</p>
        <button
          onClick={() => {
            setHasError(false);
            window.location.reload();
          }}
          className="px-6 py-3 bg-[var(--accent)] rounded-full text-[14px] font-bold"
        >
          立即重载
        </button>
      </div>
    );
  }

  const [open, setOpen] = useState<OpenApp>(null);
  const player = useMusicPlayer(settings.music);
  const dark = isDark(settings.themeId);

  const [initialChatThreadId, setInitialChatThreadId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{
    title: string;
    avatar?: string;
    content: string;
    onClick: () => void;
  } | null>(null);

  useEffect(() => {
    if (banner) {
      const t = setTimeout(() => setBanner(null), 6000);
      return () => clearTimeout(t);
    }
  }, [banner]);

  useEffect(() => {
    // Setup background automatic active interaction check
    const interval = setInterval(async () => {
      const enabled = settings.activeInteractEnabled !== false;
      const isAuto = settings.activeInteractMode === 'auto';
      if (!enabled || !isAuto) return;

      // 35% chance every 40 seconds to trigger active interaction
      if (Math.random() > 0.35) return;

      const activeUser = settings.users.find((u) => u.id === settings.activeUserId) ?? settings.users[0];
      if (!activeUser || !settings.characters || settings.characters.length === 0) return;

      // Randomly choose between Chat message (75%) and Friend request (25%)
      const isRequest = Math.random() < 0.25;

      if (isRequest) {
        // Trigger incoming friend request (probing)
        try {
          const char = settings.characters[Math.floor(Math.random() * settings.characters.length)];
          const res = await generateIncomingRequest(
            settings.api,
            char,
            activeUser.nickname,
            activeUser.signature
          );
          
          const reqId = 'auto-req-' + Math.random().toString(36).substring(2);
          const newReq = {
            id: reqId,
            type: 'incoming' as const,
            userId: activeUser.id,
            characterId: char.id,
            charAltName: res.charAltName,
            charAltAvatar: res.charAltAvatar,
            intro: res.intro,
            status: 'pending' as const,
            ts: Date.now()
          };
          updateSettings({ friendRequests: [newReq, ...(settings.friendRequests || [])] });

          setBanner({
            title: `🕵️ ${res.charAltName} 申请加为好友`,
            avatar: res.charAltAvatar,
            content: res.intro,
            onClick: () => {
              setOpen('chat');
              setBanner(null);
            }
          });
        } catch (err) {
          console.warn('Auto active friend request failed:', err);
        }
      } else {
        // Trigger proactive chat message in an existing thread or start a new one
        const myThreads = settings.chatThreads.filter((t) => t.userId === activeUser.id);
        let threadToUse = myThreads[Math.floor(Math.random() * myThreads.length)];
        let char = settings.characters[Math.floor(Math.random() * settings.characters.length)];

        if (threadToUse) {
          const found = settings.characters.find((c) => c.id === threadToUse.characterId);
          if (found) char = found;
        } else {
          // Create new chat thread
          const newThreadId = 'auto-thr-' + Math.random().toString(36).substring(2);
          threadToUse = {
            id: newThreadId,
            characterId: char.id,
            userId: activeUser.id,
            messages: [{ id: 'msg-' + Math.random().toString(36).substring(2), role: 'assistant', content: char.greeting || `你好呀！我是${char.name}。`, ts: Date.now() }],
            updatedAt: Date.now()
          };
          updateSettings({ chatThreads: [threadToUse, ...settings.chatThreads] });
        }

        try {
          const charName = threadToUse.charAltName || char.name;
          let sys = char.persona || `你是${char.name}。保持角色设定，自然地回应。`;
          if (threadToUse.charAltName) {
            sys += `\n\n[特殊设定]
你现在正在使用你为试探用户特意开启的匿名/试探小号「${threadToUse.charAltName}」来和用户「${activeUser.nickname}」聊天！
你的真实身份是「${char.name}」，而用户不知道你这个账号是「${char.name}」开启的。
请深度扮演这个小号设定的个性和特征与用户对话，千万不能穿帮暴露出你真实的${char.name}身份！
但是在你的内心活动（innerThought）中，你必须体现出你作为「${char.name}」在背后使用这个小号观察、试探、调戏用户的真正心理、好好戏弄对方。`;
          } else {
            sys += `\n\n[对话人物设定]
你正在和「${activeUser.nickname}」聊天。对方的签名是：「${activeUser.signature || ''}」`;
          }
          
          sys += getPeriodPrompt(settings);
          
          sys += `\n\n[系统提示：你现在正在主动联系对方。请结合你们之前的对话，主动发起一个新的有趣的话题，或者向对方倾诉/分享你今天遇到的事。你可以根据聊天发展和当下的情绪，自主决定是否需要发送绘图提示词以配图（sendImage=true）或发段语音消息（sendVoice=true）。]`;

          const history: ChatMsg[] = [
            { role: 'system', content: sys },
            ...threadToUse.messages.map((m) => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content }))
          ];

          const rich = await callChatRich(settings.api.chat, history, { temperature: 0.9, maxTokens: 800 });

          const assistantMsg = {
            id: 'msg-' + Math.random().toString(36).substring(2),
            role: 'assistant' as const,
            content: rich.content,
            innerThought: rich.innerThought,
            ts: Date.now()
          };

          const nextMsgs = [...threadToUse.messages, assistantMsg];

          // Optimistically update the thread
          const updatedThreads = settings.chatThreads.map((t) => 
            t.id === threadToUse.id ? { ...t, messages: nextMsgs, updatedAt: Date.now() } : t
          );
          updateSettings({ chatThreads: updatedThreads });

          // Background media generation if needed
          const media: any[] = [];
          if (rich.sendImage && rich.imagePrompt) {
            try {
              const imgUrl = await generateImage(settings.api.image, (char.imagePromptTemplate ? char.imagePromptTemplate + ', ' : '') + rich.imagePrompt, { faceRef: char.faceRef });
              media.push({ kind: 'image', url: imgUrl });
            } catch {}
          }
          if (rich.sendVoice && rich.voiceText) {
            try {
              const { url, duration } = await textToSpeech(settings.api.voice, rich.voiceText);
              media.push({ kind: 'voice', url, duration, text: rich.voiceText });
            } catch {}
          }

          if (media.length) {
            // Apply media updates
            const withMedia = updatedThreads.map((t) => 
              t.id === threadToUse.id ? {
                ...t,
                messages: [...nextMsgs, { id: 'msg-media-' + Math.random().toString(36).substring(2), role: 'assistant' as const, content: '', ts: Date.now(), media }],
                updatedAt: Date.now()
              } : t
            );
            updateSettings({ chatThreads: withMedia });
          }

          setBanner({
            title: threadToUse.charAltName ? `${threadToUse.charAltName} (试探小号)` : char.name,
            avatar: threadToUse.charAltAvatar || char.avatar,
            content: rich.content || '发来了一条新消息',
            onClick: () => {
              setInitialChatThreadId(threadToUse.id);
              setOpen('chat');
              setBanner(null);
            }
          });
        } catch (err) {
          console.warn('Auto active message generation failed:', err);
        }
      }
    }, 40000);

    return () => clearInterval(interval);
  }, [
    settings.activeInteractEnabled,
    settings.activeInteractMode,
    settings.chatThreads,
    settings.friendRequests,
    settings.characters,
    settings.activeUserId,
    settings.users,
    settings.api
  ]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const goHome = () => setOpen(null);

  const handleSendMsgToThread = (charId: string, text: string) => {
    const activeUserId = settings.activeUserId || 'user-default';
    let thread = settings.chatThreads.find((t) => t.characterId === charId && t.userId === activeUserId);
    const newMsg = {
      id: 'msg-' + Math.random().toString(36).substring(2),
      role: 'user' as const,
      content: text,
      ts: Date.now(),
    };

    if (!thread) {
      // create thread
      const char = settings.characters.find((c) => c.id === charId);
      const greetingMsg = char ? {
        id: 'msg-' + Math.random().toString(36).substring(2),
        role: 'assistant' as const,
        content: char.greeting || '你好！',
        ts: Date.now() - 1000
      } : null;

      const newThreadId = 'thr-' + Math.random().toString(36).substring(2);
      thread = {
        id: newThreadId,
        characterId: charId,
        userId: activeUserId,
        messages: greetingMsg ? [greetingMsg, newMsg] : [newMsg],
        updatedAt: Date.now(),
      };
      updateSettings({
        chatThreads: [thread, ...settings.chatThreads]
      });
      setInitialChatThreadId(newThreadId);
    } else {
      // append to existing thread
      const updatedMessages = [...thread.messages, newMsg];
      const updatedThreads = settings.chatThreads.map((t) =>
        t.id === thread.id ? { ...t, messages: updatedMessages, updatedAt: Date.now() } : t
      );
      updateSettings({ chatThreads: updatedThreads });
      setInitialChatThreadId(thread.id);
    }
    setOpen('chat');
  };

  const setLayout = (next: DesktopLayout) => updateSettings({ desktop: next });

  const handleShortcut = (a: 'assistant' | 'apiPreset' | 'manual') => setOpen(a);

  // apply preset to api when activePresetId changes
  const applyPreset = (presetId: string | null, presets: typeof settings.presets) => {
    const p = presets.find((x) => x.id === presetId);
    if (p) updateSettings({ api: presetToApi(p) });
  };

  const openApp = (id: string) => {
    // sheep快捷球打开羊羊助手
    if (id === SHORTCUT_BALL_ID) {
      setOpen('assistant');
      return;
    }
    setOpen(id);
  };

  const renderOpen = () => {
    if (!open) return null;
    if (open === 'assistant') return <AssistantScreen api={settings.api} settings={settings} onOpenApp={openApp} onBack={goHome} />;
    if (open === 'apiPreset')
      return (
        <ApiPresetScreen
          api={settings.api}
          presets={settings.presets}
          activePresetId={settings.activePresetId}
          onChange={(presets, activeId) => {
            updateSettings({ presets, activePresetId: activeId });
            applyPreset(activeId, presets);
          }}
          onBack={goHome}
        />
      );
    if (open === 'manual') return <ManualScreen onBack={goHome} />;
    if (open === 'period')
      return (
        <PeriodScreen
          records={settings.periodRecords || []}
          cycleDays={settings.periodCycleDays || 28}
          durationDays={settings.periodDurationDays || 5}
          onChange={(records, cycle, duration) =>
            updateSettings({
              periodRecords: records,
              periodCycleDays: cycle,
              periodDurationDays: duration,
            })
          }
          onBack={goHome}
        />
      );
    if (open === 'calendar')
      return (
        <CalendarScreen
          events={settings.calendarEvents}
          onChange={(events) => updateSettings({ calendarEvents: events })}
          onBack={goHome}
        />
      );
    if (open === 'music')
      return (
        <MusicScreen
          tracks={settings.music}
          playing={player.playing}
          currentIdx={player.currentIdx}
          onPlay={player.play}
          onToggle={player.toggle}
          onNext={() => player.play(Math.min(player.currentIdx + 1, settings.music.length - 1))}
          onPrev={() => player.play(Math.max(player.currentIdx - 1, 0))}
          onBack={goHome}
        />
      );
    if (open === 'album')
      return (
        <AlbumScreen
          images={settings.albumImages}
          onRemove={(id) => updateSettings({ albumImages: settings.albumImages.filter((img) => img.id !== id) })}
          onBack={goHome}
        />
      );
    if (open === 'contacts')
      return (
        <ContactsScreen
          contacts={settings.contacts}
          characters={settings.characters}
          onSave={(c) => updateSettings({ contacts: [...settings.contacts, c] })}
          onDelete={(id) => updateSettings({ contacts: settings.contacts.filter((c) => c.id !== id) })}
          onStartChat={() => setOpen('chat')}
          onStartSms={() => setOpen('sms')}
          onBack={goHome}
        />
      );
    // sheep路由：打开羊羊助手
    if (open === 'sheep') {
      setOpen('assistant');
      return null;
    }
    if (open === 'chat')
      return (
        <ChatScreen
          settings={settings}
          api={settings.api}
          characters={settings.characters}
          threads={settings.chatThreads}
          worldEntries={settings.worldEntries}
          storyEvents={settings.storyEvents}
          autoNpc={settings.autoNpc}
          activeInteractMode={settings.activeInteractMode}
          activeInteractEnabled={settings.activeInteractEnabled}
          updateSettings={updateSettings}
          initialThreadId={initialChatThreadId}
          onClearInitialThreadId={() => setInitialChatThreadId(null)}
          users={settings.users}
          activeUserId={settings.activeUserId}
          friendRequests={settings.friendRequests || []}
          onChange={(chatThreads) => updateSettings({ chatThreads })}
          onChangeFriendRequests={(friendRequests) => updateSettings({ friendRequests })}
          onAddCharacter={(char) => updateSettings({ characters: [...settings.characters, char] })}
          onAddStoryEvents={(events) => updateSettings({ storyEvents: [...settings.storyEvents, ...events] })}
          onConsumeStoryEvents={(ids) => updateSettings({ storyEvents: settings.storyEvents.map((e) => ids.includes(e.id) ? { ...e, consumed: true } : e) })}
          onBack={goHome}
        />
      );
    if (open === 'sms')
      return (
        <SmsScreen
          api={settings.api}
          contacts={settings.contacts}
          threads={settings.smsThreads}
          users={settings.users}
          activeUserId={settings.activeUserId}
          onChange={(smsThreads) => updateSettings({ smsThreads })}
          onBack={goHome}
        />
      );
    if (open === 'moments')
      return (
        <MomentsScreen
          api={settings.api}
          users={settings.users}
          activeUserId={settings.activeUserId}
          characters={settings.characters}
          moments={settings.moments}
          onChange={(moments) => updateSettings({ moments })}
          onBack={goHome}
        />
      );
    if (open === 'mail')
      return (
        <MailScreen
          api={settings.api}
          mails={settings.mails}
          users={settings.users}
          activeUserId={settings.activeUserId}
          onChange={(mails) => updateSettings({ mails })}
          onBack={goHome}
        />
      );
    if (open === 'waimai')
      return (
        <WaimaiScreen
          restaurants={settings.restaurants}
          onChangeRestaurants={(restaurants) => updateSettings({ restaurants })}
          cart={settings.cart}
          onChangeCart={(cart) => updateSettings({ cart })}
          onBack={goHome}
        />
      );
    if (open === 'xiaohongshu')
      return (
        <XiaohongshuScreen
          api={settings.api}
          me={settings.users.find((u) => u.id === settings.activeUserId) ?? settings.users[0]}
          notes={settings.notes}
          onChange={(notes) => updateSettings({ notes })}
          onBack={goHome}
        />
      );
    if (open === 'novel')
      return (
        <NovelScreen
          api={settings.api}
          novels={settings.novels}
          onChange={(novels) => updateSettings({ novels })}
          onBack={goHome}
        />
      );
    if (open === 'shop')
      return (
        <ShopScreen
          api={settings.api}
          products={settings.products}
          onChangeProducts={(products) => updateSettings({ products })}
          cart={settings.cart}
          onChangeCart={(cart) => updateSettings({ cart })}
          orders={settings.orders}
          onChangeOrders={(orders) => updateSettings({ orders })}
          onBack={goHome}
        />
      );
    if (open === 'forum')
      return (
        <ForumScreen
          api={settings.api}
          me={settings.users.find((u) => u.id === settings.activeUserId) ?? settings.users[0]}
          posts={settings.forumPosts}
          onChange={(forumPosts) => updateSettings({ forumPosts })}
          onBack={goHome}
        />
      );
    if (open === 'worldbook')
      return (
        <CharacterScreen
          characters={settings.characters}
          api={settings.api}
          worldEntries={settings.worldEntries}
          onChangeWorldEntries={(worldEntries) => updateSettings({ worldEntries })}
          onSave={(c) => {
            const exists = settings.characters.some((x) => x.id === c.id);
            updateSettings({ characters: exists ? settings.characters.map((x) => (x.id === c.id ? c : x)) : [...settings.characters, c] });
          }}
          onDelete={(id) => updateSettings({ characters: settings.characters.filter((x) => x.id !== id) })}
          onBack={goHome}
          initialTab="worldbook"
        />
      );
    if (open === 'generator')
      return (
        <GeneratorScreen
          api={settings.api}
          onAddCharacter={(c) => updateSettings({ characters: [...settings.characters, c] })}
          onAddUser={(u) => updateSettings({ users: [...settings.users, u] })}
          onAddWorldEntries={(e) => updateSettings({ worldEntries: [...settings.worldEntries, ...e] })}
          onBack={goHome}
        />
      );
    if (open === 'social')
      return (
        <SocialScreen
          api={settings.api}
          me={settings.users.find((u) => u.id === settings.activeUserId) ?? settings.users[0]}
          characters={settings.characters}
          posts={settings.squarePosts}
          onChange={(squarePosts) => updateSettings({ squarePosts })}
          onBack={goHome}
        />
      );
    if (open === 'me')
      return (
        <MeApp
          settings={settings}
          updateSettings={updateSettings}
          state={state}
          onImport={replaceState}
          onBack={goHome}
        />
      );
    if (open === 'truth_or_dare')
      return (
        <TruthOrDareScreen
          api={settings.api}
          characters={settings.characters}
          chatThreads={settings.chatThreads}
          onSendMsgToThread={handleSendMsgToThread}
          onBack={goHome}
        />
      );
    if (open === 'notes_app')
      return (
        <NotesScreen
          api={settings.api}
          memos={settings.memos || []}
          onChangeMemos={(memos) => updateSettings({ memos })}
          onBack={goHome}
        />
      );
    if (open === 'diary')
      return (
        <DiaryScreen
          api={settings.api}
          diaries={settings.diaries || []}
          characters={settings.characters || []}
          chatThreads={settings.chatThreads || []}
          users={settings.users || []}
          activeUserId={settings.activeUserId}
          onChangeDiaries={(diaries) => updateSettings({ diaries })}
          onBack={goHome}
        />
      );
    if (open === 'wallet')
      return (
        <WalletScreen
          userBalance={settings.userBalance ?? 5000}
          characters={settings.characters || []}
          walletFlows={settings.walletFlows || []}
          onChangeUserBalance={(userBalance) => updateSettings({ userBalance })}
          onChangeCharacters={(characters) => updateSettings({ characters })}
          onChangeWalletFlows={(walletFlows) => updateSettings({ walletFlows })}
          onBack={goHome}
        />
      );
    if (open === 'weather')
      return (
        <WeatherScreen
          api={settings.api}
          onBack={goHome}
        />
      );
    if (open === 'calculator')
      return (
        <CalculatorScreen
          characters={settings.characters}
          onBack={goHome}
        />
      );
    if (open === 'browser' || open.startsWith('web-')) {
      const initialUrl = open.startsWith('web-')
        ? (settings.installedWebApps || []).find((w) => w.id === open)?.url
        : undefined;
      return (
        <BrowserScreen
          api={settings.api}
          settings={settings}
          updateSettings={updateSettings}
          initialUrl={initialUrl}
          onBack={goHome}
        />
      );
    }

    // v3.0 新增应用路由
    if (open === 'settings_v3')
      return (
        <SettingsScreenV3
          innerThoughtOpacity={settings.innerThoughtOpacity || 0.7}
          swipeBackEnabled={settings.swipeBackEnabled !== false}
          floatingBallEnabled={settings.floatingBallEnabled || false}
          autoSaveCharImages={settings.autoSaveCharImages !== false}
          offlineMode={settings.offlineMode || false}
          enableVectorMemory={settings.enableVectorMemory || false}
          autoTranslateEnabled={settings.autoTranslateEnabled || false}
          useRealTime={settings.useRealTime !== false}
          customTime={settings.customTime || ''}
          onUpdateSetting={(key, value) => updateSettings({ [key]: value })}
          onBack={goHome}
        />
      );

    if (open === 'time_perception')
      return (
        <TimePerceptionScreen
          settings={settings}
          updateSettings={updateSettings}
          onBack={goHome}
        />
      );

    if (open === 'anniversary') return <AnniversaryScreen onBack={goHome} />;
    if (open === 'group_chat') return <GroupChatScreen onBack={goHome} />;
    if (open === 'phone_check') return <PhoneCheckScreen onBack={goHome} />;
    if (open === 'offline_mode') return <OfflineModeScreen onBack={goHome} />;
    if (open === 'couple_space') return <CoupleSpaceScreen onBack={goHome} />;
    if (open === 'home_system') return <HomeSystemScreen onBack={goHome} />;
    if (open === 'kitchen')
      return (
        <KitchenScreen
          api={settings.api}
          characters={settings.characters}
          recipes={settings.recipes || []}
          records={settings.cookingRecords || []}
          memories={settings.memories || []}
          onChange={(recipes) => updateSettings({ recipes })}
          onChangeRecords={(cookingRecords) => updateSettings({ cookingRecords })}
          onChangeMemories={(memories) => updateSettings({ memories })}
          onBack={goHome}
        />
      );
    if (open === 'turtle_soup') return <TurtleSoupScreen onBack={goHome} />;
    if (open === 'games') return <GamesScreen onBack={goHome} />;
    if (open === 'weibo')
      return (
        <WeiboScreen
          api={settings.api}
          me={settings.users.find((u) => u.id === settings.activeUserId) ?? settings.users[0]}
          characters={settings.characters}
          posts={settings.socialPosts || []}
          onChange={(socialPosts) => updateSettings({ socialPosts })}
          onBack={goHome}
        />
      );
    if (open === 'twitter')
      return (
        <TwitterScreen
          api={settings.api}
          me={settings.users.find((u) => u.id === settings.activeUserId) ?? settings.users[0]}
          characters={settings.characters}
          posts={settings.socialPosts || []}
          onChange={(socialPosts) => updateSettings({ socialPosts })}
          onBack={goHome}
        />
      );
    if (open === 'memory')
      return (
        <MemoryScreen
          characters={settings.characters}
          memories={settings.memories || []}
          onChange={(memories) => updateSettings({ memories })}
          onBack={goHome}
        />
      );
    if (open === 'weight')
      return (
        <WeightManageScreen
          records={settings.weightRecords || []}
          goals={settings.weightGoals || []}
          onChange={(weightRecords) => updateSettings({ weightRecords })}
          onChangeGoals={(weightGoals) => updateSettings({ weightGoals })}
          onBack={goHome}
        />
      );
    if (open === 'discover') return <DiscoverScreen onBack={goHome} />;
    if (open === 'closet')
      return (
        <ClosetScreen
          api={settings.api}
          characters={settings.characters}
          outfits={settings.outfits || []}
          onChange={(outfits) => updateSettings({ outfits })}
          onBack={goHome}
        />
      );
    if (open === 'alt_accounts')
      return (
        <AltAccountsScreen
          onBack={goHome}
          users={settings.users}
          activeUserId={settings.activeUserId}
          onSwitch={(userId) => {
            updateSettings({ activeUserId: userId });
            goHome();
          }}
          onCreate={() => setOpen('me')}
        />
      );

    return <ComingSoon appId={open} onBack={goHome} />;
  };



  return (
    <div className={`relative w-full h-full max-w-[440px] mx-auto phone-surface overflow-hidden shadow-2xl app-font-${settings.fontSize || 'md'}`}>
      {banner && (
        <div 
          onClick={banner.onClick}
          className="absolute top-12 inset-x-3 z-[100] cursor-pointer bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-2xl p-3 shadow-2xl flex items-center gap-3 animate-banner-down"
        >
          {banner.avatar ? (
            banner.avatar.startsWith('data:') || banner.avatar.startsWith('http') ? (
              <img src={banner.avatar} className="w-10 h-10 rounded-full object-cover shrink-0 border border-neutral-700" alt="" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center shrink-0 border border-neutral-700 select-none text-xl">
                {banner.avatar}
              </div>
            )
          ) : (
            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center shrink-0 border border-neutral-700 select-none text-xl">
              💬
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-bold text-neutral-100 truncate flex items-center justify-between gap-1.5">
              <span>{banner.title}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 font-semibold scale-90">主动互动</span>
            </div>
            <div className="text-[11px] txt-dim truncate mt-0.5">{banner.content}</div>
          </div>
        </div>
      )}
      <Desktop
        settings={settings}
        layout={settings.desktop}
        music={settings.music}
        album={settings.albumImages}
        playing={player.playing}
        currentName={player.current?.name}
        onTogglePlay={player.toggle}
        onOpenApp={openApp}
        onChangeLayout={setLayout}
        onShortcut={handleShortcut}
      />
      <StatusBar style={dark ? 'dark' : 'light'} />
      {renderOpen()}
    </div>
  );
}

function ShortcutRow({ emoji, name, desc, onClick }: { emoji: string; name: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="tap w-full flex items-center gap-3 p-3 rounded-2xl text-left"
      style={{ background: 'var(--icon-bg)' }}
    >
      <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-[22px]" style={{ background: 'var(--icon-bg-active)' }}>
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium txt-accent">{name}</div>
        <div className="text-[12px] txt-faint">{desc}</div>
      </div>
    </button>
  );
}
