import React, { useEffect, useRef, useState } from 'react';
import { AppIcon } from './AppIcon';
import { Widget } from './Widget';
import { APPS, DOCK_IDS } from '../apps';
import type { DesktopLayout, MusicTrack, AlbumImage, AppSettings } from '../types';
import { cls } from '../utils';

type ShortcutAction = 'assistant' | 'apiPreset' | 'manual';

export function Desktop({
  settings,
  layout,
  music,
  album,
  playing,
  currentName,
  onTogglePlay,
  onOpenApp,
  onChangeLayout,
  onShortcut,
}: {
  settings: AppSettings;
  layout: DesktopLayout;
  music: MusicTrack[];
  album: AlbumImage[];
  playing: boolean;
  currentName?: string;
  onTogglePlay: () => void;
  onOpenApp: (id: string) => void;
  onChangeLayout: (next: DesktopLayout) => void;
  onShortcut: (a: ShortcutAction) => void;
}) {
  const [page, setPage] = useState(0);
  const [edit, setEdit] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  // swipe state
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const swiping = useRef(false);
  const movedRef = useRef(false);

  // drag-to-reorder state (pointer based, works on touch + mouse)
  const dragOverId = useRef<string | null>(null);

  // long-press detection
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTarget = useRef<string | null>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const onEdit = () => setEdit(true);
    window.addEventListener('desktop-edit', onEdit);
    return () => window.removeEventListener('desktop-edit', onEdit);
  }, []);

  const pages = layout.pages.length ? layout.pages : [[]];
  const maxPage = pages.length - 1;

  /* ---- swipe paging (pointer based to support mouse drag and touch) ---- */
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (edit) return;
    // Capture pointer so we continue receiving events even if the user drags outside the element
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      // Ignore if setPointerCapture fails on certain targets
    }
    touchStartX.current = e.clientX;
    touchStartY.current = e.clientY;
    swiping.current = true;
    movedRef.current = false;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // 如果正在拖拽图标
    if (edit && isDragging.current && dragId) {
      dragCurrentPos.current = { x: e.clientX, y: e.clientY };
      setDragPos({ x: e.clientX, y: e.clientY });

      // 检测边缘，自动切换页面
      const screenWidth = window.innerWidth;
      const edgeThreshold = 50;

      if (e.clientX < edgeThreshold && page > 0) {
        setPage(page - 1);
      } else if (e.clientX > screenWidth - edgeThreshold && page < maxPage) {
        setPage(page + 1);
      }
      return;
    }

    // 滑动翻页
    if (!swiping.current || isDragging.current) return;
    const dx = e.clientX - touchStartX.current;
    const dy = e.clientY - touchStartY.current;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      movedRef.current = true;
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!swiping.current) return;
    swiping.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
    if (edit) return;
    const dx = e.clientX - touchStartX.current;
    const dy = e.clientY - touchStartY.current;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx < 0 && page < maxPage) setPage(page + 1);
      else if (dx > 0 && page > 0) setPage(page - 1);
    }
  };

  /* ---- drag reorder (pointer based) ---- */
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragCurrentPos = useRef<{ x: number; y: number } | null>(null);

  const startLongPress = (appId: string, e: React.PointerEvent) => {
    longPressTarget.current = appId;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    longPressTimer.current = setTimeout(() => {
      if (longPressTarget.current === appId) {
        setEdit(true);
        isDragging.current = false;
        // 添加震动反馈（如果设备支持）
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }, 3000); // 3000ms长按（3秒）
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressTarget.current = null;
    dragStartPos.current = null;
  };

  const onIconPointerDown = (appId: string, e: React.PointerEvent) => {
    if (edit) {
      // 已经在编辑模式，直接开始拖拽
      setDragId(appId);
      isDragging.current = true;
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      dragCurrentPos.current = { x: e.clientX, y: e.clientY };
      setDragPos({ x: e.clientX, y: e.clientY });
    } else {
      // 不在编辑模式，开始长按检测
      startLongPress(appId, e);
    }
  };

  const onIconPointerMove = (e: React.PointerEvent) => {
    if (edit && isDragging.current && dragId) {
      dragCurrentPos.current = { x: e.clientX, y: e.clientY };
      setDragPos({ x: e.clientX, y: e.clientY });

      // 检测边缘，自动切换页面
      const screenWidth = window.innerWidth;
      const edgeThreshold = 50;

      if (e.clientX < edgeThreshold && page > 0) {
        setPage(page - 1);
      } else if (e.clientX > screenWidth - edgeThreshold && page < maxPage) {
        setPage(page + 1);
      }
    }
  };

  const onIconPointerEnter = (appId: string) => {
    if (!edit || !dragId || dragId === appId) return;
    dragOverId.current = appId;

    // 查找拖拽源和目标所在的页面
    let fromPage = -1;
    let toPage = -1;

    pages.forEach((p, idx) => {
      if (p.includes(dragId)) fromPage = idx;
      if (p.includes(appId)) toPage = idx;
    });

    if (fromPage >= 0 && toPage >= 0) {
      const next = pages.map((p) => [...p]);

      // 从原页面移除
      const fromArr = next[fromPage];
      const fromIdx = fromArr.indexOf(dragId);
      if (fromIdx >= 0) {
        fromArr.splice(fromIdx, 1);
      }

      // 插入到目标页面
      const toArr = next[toPage];
      const toIdx = toArr.indexOf(appId);
      if (toIdx >= 0) {
        toArr.splice(toIdx, 0, dragId);
      }

      onChangeLayout({ ...layout, pages: next });
    }
  };

  const onIconPointerUp = () => {
    cancelLongPress();
    setDragId(null);
    setDragPos(null);
    dragOverId.current = null;
    isDragging.current = false;
    dragStartPos.current = null;
    dragCurrentPos.current = null;
  };

  const removeApp = (appId: string) => {
    const next = pages.map((p) => p.filter((id) => id !== appId));
    onChangeLayout({ ...layout, pages: next });
  };

  const gridIds = (pages[page] ?? []).filter((id) => !DOCK_IDS.includes(id));
  const removedIds = APPS.map((a) => a.id).filter(
    (id) => !pages.flat().includes(id) && !DOCK_IDS.includes(id),
  );

  return (
    <div
      className="absolute inset-0 phone-surface overflow-hidden touch-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={() => { if (edit && !movedRef.current) setEdit(false); }}
    >
      {/* 编辑模式 - 完成按钮 */}
      {edit && (
        <div className="absolute top-2 right-4 z-50">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEdit(false);
            }}
            className="tap px-4 py-1.5 rounded-full text-white text-[14px] font-medium"
            style={{ background: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(10px)' }}
          >
            完成
          </button>
        </div>
      )}

      {/* pages strip */}
      <div
        className="absolute inset-0 flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${page * 100}%)` }}
      >
        {pages.map((_, pIdx) => (
          <div
            key={pIdx}
            className="w-full h-full shrink-0 overflow-y-auto no-scrollbar"
            style={{ touchAction: 'pan-y' }}
          >
            <div className="px-4 pt-12 pb-[90px] min-h-full">
              {pIdx === 0 && (
                <Page1
                  music={music}
                  album={album}
                  playing={playing}
                  currentName={currentName}
                  onTogglePlay={onTogglePlay}
                  onShortcut={onShortcut}
                  gridIds={gridIds}
                  edit={edit}
                  dragId={dragId}
                  onOpenApp={onOpenApp}
                  onIconDown={onIconPointerDown}
                  onIconEnter={onIconPointerEnter}
                  onIconUp={onIconPointerUp}
                  removeApp={removeApp}
                />
              )}
              {pIdx === 1 && (
                <Page2
                  gridIds={gridIds}
                  edit={edit}
                  dragId={dragId}
                  onOpenApp={onOpenApp}
                  onShortcut={onShortcut}
                  onIconDown={onIconPointerDown}
                  onIconEnter={onIconPointerEnter}
                  onIconUp={onIconPointerUp}
                  removeApp={removeApp}
                />
              )}
              {pIdx === 2 && (
                <Page3
                  settings={settings}
                  gridIds={gridIds}
                  edit={edit}
                  dragId={dragId}
                  onOpenApp={onOpenApp}
                  onIconDown={onIconPointerDown}
                  onIconEnter={onIconPointerEnter}
                  onIconUp={onIconPointerUp}
                  removeApp={removeApp}
                />
              )}
              {pIdx >= 3 && (
                <IconGrid
                  ids={(pages[pIdx] ?? []).filter((id) => !DOCK_IDS.includes(id))}
                  edit={edit}
                  dragId={dragId}
                  onOpenApp={onOpenApp}
                  onIconDown={onIconPointerDown}
                  onIconEnter={onIconPointerEnter}
                  onIconUp={onIconPointerUp}
                  removeApp={removeApp}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* page dots */}
      <div className="absolute bottom-[80px] inset-x-0 flex items-center justify-center gap-1.5 z-20">
        {pages.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPage(i);
            }}
            className={cls(
              'h-2 w-2 rounded-full transition-all cursor-pointer border-0 p-0',
              i === page ? 'w-4 bg-white opacity-90' : 'bg-white/40 hover:bg-white/70'
            )}
            title={`第 ${i + 1} 页`}
          />
        ))}
      </div>

      {/* dock */}
      <div className="absolute bottom-2.5 inset-x-3 z-30">
        <div className="glass-strong rounded-[28px] px-3 py-2 flex items-center justify-around">
          {DOCK_IDS.map((id) => (
            <AppIcon
              key={id}
              appId={id}
              size="sm"
              showLabel={false}
              onOpen={() => onOpenApp(id)}
              jiggle={edit}
              onLongPress={() => setEdit(true)}
            />
          ))}
        </div>
      </div>

      {edit && (
        <div className="absolute top-12 inset-x-0 text-center text-[12px] txt-dim animate-fade-in pointer-events-none z-20">
          拖动图标调整位置 · 点空白退出
        </div>
      )}

      {edit && removedIds.length > 0 && (
        <div className="absolute bottom-[120px] inset-x-4 glass-strong rounded-2xl p-3 z-30 animate-sheet-up">
          <div className="text-[11px] txt-dim mb-2">拖动添加回桌面</div>
          <div className="flex gap-2 flex-wrap">
            {removedIds.map((id) => (
              <div
                key={id}
                onPointerDown={(e) => onIconPointerDown(id, e)}
                onPointerEnter={() => onIconPointerEnter(id)}
                onPointerUp={onIconPointerUp}
                className={cls(
                  dragId === id && 'opacity-30 scale-95',
                  'cursor-move',
                )}
              >
                <AppIcon
                  appId={id}
                  size="sm"
                  onOpen={() => {
                    const next = pages.map((p) => [...p]);
                    if (!next[page]) next[page] = [];
                    next[page].push(id);
                    onChangeLayout({ ...layout, pages: next });
                  }}
                  jiggle={edit}
                  onLongPress={() => {}}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 拖拽中的浮动图标 */}
      {dragId && dragPos && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: dragPos.x,
            top: dragPos.y,
            transform: 'translate(-50%, -50%) scale(1.2)',
            opacity: 0.9,
          }}
        >
          <AppIcon
            appId={dragId}
            size="md"
            onOpen={() => {}}
            jiggle={false}
            showLabel={false}
          />
        </div>
      )}
    </div>
  );
}

/* ---------- Page 1: widgets page (HELLO/clock/vinyl/photo/assistant) ---------- */
function Page1({
  music, album, playing, currentName, onTogglePlay, onShortcut, gridIds, edit, dragId, onOpenApp, onIconDown, onIconEnter, onIconUp, removeApp,
}: {
  music: MusicTrack[];
  album: AlbumImage[];
  playing: boolean;
  currentName?: string;
  onTogglePlay: () => void;
  onShortcut: (a: ShortcutAction) => void;
  gridIds: string[];
  edit: boolean;
  dragId: string | null;
  onOpenApp: (id: string) => void;
  onIconDown: (id: string, e: React.PointerEvent) => void;
  onIconEnter: (id: string) => void;
  onIconUp: () => void;
  removeApp: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <Widget kind="helloClock" music={[]} album={[]} playing={false} onTogglePlay={() => {}} onShortcut={onShortcut} />
      <Widget kind="monthStrip" music={[]} album={[]} playing={false} onTogglePlay={() => {}} onShortcut={onShortcut} />
      <Widget kind="vinylPhoto" music={music} album={album} playing={playing} currentName={currentName} onTogglePlay={onTogglePlay} onShortcut={onShortcut} />
      <Widget kind="miniMusicCal" music={music} album={[]} playing={playing} currentName={currentName} onTogglePlay={onTogglePlay} onShortcut={onShortcut} />
      <IconGrid ids={gridIds} edit={edit} dragId={dragId} onOpenApp={onOpenApp} onIconDown={onIconDown} onIconEnter={onIconEnter} onIconUp={onIconUp} removeApp={removeApp} />
    </div>
  );
}

/* ---------- Page 2: calendar + quote/steps + icon grid ---------- */
function Page2({
  gridIds, edit, dragId, onOpenApp, onShortcut, onIconDown, onIconEnter, onIconUp, removeApp,
}: {
  gridIds: string[];
  edit: boolean;
  dragId: string | null;
  onOpenApp: (id: string) => void;
  onShortcut: (a: ShortcutAction) => void;
  onIconDown: (id: string, e: React.PointerEvent) => void;
  onIconEnter: (id: string) => void;
  onIconUp: () => void;
  removeApp: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <Widget kind="fullCalendar" music={[]} album={[]} playing={false} onTogglePlay={() => {}} onShortcut={onShortcut} />
      <Widget kind="quoteSteps" music={[]} album={[]} playing={false} onTogglePlay={() => {}} onShortcut={onShortcut} />
      <IconGrid ids={gridIds} edit={edit} dragId={dragId} onOpenApp={onOpenApp} onIconDown={onIconDown} onIconEnter={onIconEnter} onIconUp={onIconUp} removeApp={removeApp} />
    </div>
  );
}

function IconGrid({
  ids, edit, dragId, onOpenApp, onIconDown, onIconEnter, onIconUp, removeApp,
}: {
  ids: string[];
  edit: boolean;
  dragId: string | null;
  onOpenApp: (id: string) => void;
  onIconDown: (id: string, e: React.PointerEvent) => void;
  onIconEnter: (id: string) => void;
  onIconUp: () => void;
  removeApp: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-x-1 gap-y-4 pt-3">
      {ids.map((appId) => (
        <div
          key={appId}
          onPointerDown={(e) => onIconDown(appId, e)}
          onPointerEnter={() => onIconEnter(appId)}
          onPointerUp={onIconUp}
          className={cls(
            'flex justify-center',
            dragId === appId && 'opacity-30 scale-95',
            edit && 'cursor-move',
          )}
        >
          <AppIcon
            appId={appId}
            onOpen={() => onOpenApp(appId)}
            jiggle={edit}
            onLongPress={() => { /* edit triggered by parent */ }}
          />
        </div>
      ))}
    </div>
  );
}

/* ---------- Page 3: memos + period caring words + icon grid ---------- */
function Page3({
  settings,
  gridIds,
  edit,
  dragId,
  onOpenApp,
  onIconDown,
  onIconEnter,
  onIconUp,
  removeApp,
}: {
  settings: AppSettings;
  gridIds: string[];
  edit: boolean;
  dragId: string | null;
  onOpenApp: (id: string) => void;
  onIconDown: (id: string, e: React.PointerEvent) => void;
  onIconEnter: (id: string) => void;
  onIconUp: () => void;
  removeApp: (id: string) => void;
}) {
  const memos = settings.memos || [];
  const periodRecords = settings.periodRecords || [];
  const cycleDays = settings.periodCycleDays || 28;
  const durationDays = settings.periodDurationDays || 5;

  // Calculate Menstrual phase
  const latestRecord = periodRecords.length > 0 
    ? [...periodRecords].sort((a, b) => b.startDate.localeCompare(a.startDate))[0]
    : null;

  let cycleDayNumber = 1;
  let phaseName = '卵泡期';
  let phaseColor = 'text-sky-400 bg-sky-500/10 border-sky-500/10';
  let phaseIcon = '🌱';
  let daysUntilNext = cycleDays;
  let isCurrentlyOnPeriod = false;
  let caringMessage = '😊 今天处于温和舒缓的卵泡期。给生活做点减法，多给自己一些温柔，多休息。祝你心情愉快，每一天都是好风景！';

  if (latestRecord) {
    const lastStart = new Date(latestRecord.startDate);
    const today = new Date();
    const diffMs = today.getTime() - lastStart.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays >= 1) {
      cycleDayNumber = ((diffDays - 1) % cycleDays) + 1;
    }

    if (cycleDayNumber <= durationDays) {
      isCurrentlyOnPeriod = !latestRecord.endDate || new Date(latestRecord.endDate) >= today;
      phaseName = '生理月经期';
      phaseColor = 'text-pink-400 bg-pink-500/10 border-pink-500/10';
      phaseIcon = '🩸';
      caringMessage = '🩸 宝贝，现在处于生理期。请务必注意防寒保暖，不要喝凉水和进行剧烈运动。肚子难受就多贴片暖宝，多喝点温水，早点睡觉，我一直在你身边守护你哦。';
    } else if (cycleDayNumber <= 11) {
      phaseName = '健康卵泡期';
      phaseColor = 'text-sky-400 bg-sky-500/10 border-sky-500/10';
      phaseIcon = '🌱';
      caringMessage = '🌱 今天处于温和舒缓的卵泡期。身体状态在慢慢回暖，适合做一些轻松的规划和学习。多喝水，祝你今天的心情像春风般轻盈！';
    } else if (cycleDayNumber <= 16) {
      phaseName = '魅力排卵期';
      phaseColor = 'text-purple-400 bg-purple-500/10 border-purple-500/10';
      phaseIcon = '🌸';
      caringMessage = '🌸 今天处于活力满满的排卵期，你的魅力和体能处于黄金点。出去晒晒太阳、吹吹晚风，去享受这个世界的小美好吧！';
    } else {
      phaseName = '丰盈黄体期';
      phaseColor = 'text-amber-400 bg-amber-500/10 border-amber-500/10';
      phaseIcon = '🍁';
      caringMessage = '🍁 今天处于黄体期，身体和心情可能会莫名感到一些疲惫、水肿或烦躁。别给自己太高要求，放平心态，听一首治愈的歌，放轻松~';
    }

    daysUntilNext = cycleDays - cycleDayNumber + 1;
    if (daysUntilNext <= 0) daysUntilNext = cycleDays;

    if (!isCurrentlyOnPeriod && daysUntilNext <= 3) {
      caringMessage = `🌸 暖心提醒：预计再过 ${daysUntilNext} 天就到下一次生理期了。可能会有经前身体不适或情绪起伏，提前准备好暖贴，早点睡，多喝热水，对自己温柔点。`;
    }
  } else {
    caringMessage = '🗓️ 记录你的生理周期，AI 角色将能在聊天中更贴心、更懂你地给予你温暖与关切。可在“经期助手”里记一笔吧。';
  }

  return (
    <div className="space-y-4">
      {/* Period Caring Words Widget */}
      <div 
        onClick={() => onOpenApp('period')}
        className="glass rounded-[24px] p-4 border border-neutral-800/40 text-left space-y-3 cursor-pointer hover:border-neutral-700/60 transition-all shadow-lg shadow-pink-500/5 relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[12px] text-pink-400 font-bold">
            <span className="animate-pulse">❤️</span> 经期健康暖心关怀
          </div>
          {latestRecord && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${phaseColor}`}>
              {phaseIcon} {phaseName} · 第{cycleDayNumber}天
            </span>
          )}
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-950/40 border border-neutral-900 space-y-2">
          <p className="text-[12px] text-neutral-200 font-medium leading-relaxed">
            {caringMessage}
          </p>
          {latestRecord && (
            <div className="text-[10px] text-neutral-500 flex items-center justify-between pt-1">
              <span>预计下次还有：{daysUntilNext} 天</span>
              <span>周期规律：{cycleDays}天</span>
            </div>
          )}
        </div>
      </div>

      {/* Memos List Widget */}
      <div 
        className="glass rounded-[24px] p-4 border border-neutral-800/40 text-left space-y-3 shadow-lg"
      >
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-1.5 font-bold text-[var(--accent)]">
            📝 备忘录快记 ({memos.length})
          </div>
          <button 
            onClick={() => onOpenApp('notes_app')}
            className="text-[10px] text-neutral-500 hover:text-neutral-300 flex items-center gap-0.5"
          >
            去记录 +
          </button>
        </div>

        {memos.length === 0 ? (
          <div 
            onClick={() => onOpenApp('notes_app')}
            className="p-5 rounded-2xl border border-dashed border-neutral-800 hover:border-neutral-700 text-center cursor-pointer text-[11px] text-neutral-500"
          >
            暂无备忘事项 · 点击快速添加
          </div>
        ) : (
          <div className="space-y-2 max-h-[160px] overflow-y-auto no-scrollbar">
            {memos.slice(0, 3).map((memo) => (
              <div 
                key={memo.id}
                onClick={() => onOpenApp('notes_app')}
                className="p-3 rounded-2xl bg-neutral-950/30 border border-neutral-900 hover:bg-neutral-900/40 cursor-pointer space-y-1 transition-all"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[11.5px] font-bold text-neutral-200 truncate pr-2">{memo.title}</span>
                  <span className="text-[8px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-500 scale-90">{memo.category || '生活'}</span>
                </div>
                <p className="text-[10.5px] text-neutral-400 line-clamp-2 leading-relaxed">
                  {memo.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Apps Icon Grid on third page */}
      <div className="pt-2">
        <IconGrid ids={gridIds} edit={edit} dragId={dragId} onOpenApp={onOpenApp} onIconDown={onIconDown} onIconEnter={onIconEnter} onIconUp={onIconUp} removeApp={removeApp} />
      </div>
    </div>
  );
}
