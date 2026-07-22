import React, { useState } from 'react';
import { ChevronRight, Settings, Palette, UserRound, Network, Database, FolderInput, Info, Layers, Sparkles, Users } from 'lucide-react';
import { AppScreen } from '../components/AppScreen';
import { ListGroup, Row } from '../components/ui';
import { Modal } from '../components/Sheet';
import { ApiConfigScreen } from './ApiConfigScreen';
import { ApiPresetScreen, presetToApi } from './ApiPresetScreen';
import { ThemeScreen } from './ThemeScreen';
import { IdentityScreenV3 as IdentityScreen } from './IdentityScreenV3';
import { PartitionScreen } from './PartitionScreen';
import { DataScreen } from './DataScreen';
import { AssetsScreen } from './AssetsScreen';
import { CharacterScreen } from './CharacterScreen';
import { THEMES } from '../themes';
import type { AppSettings, PersistShape, UserIdentity, MusicTrack, AlbumImage, Sticker } from '../types';
import { applyTheme } from '../themes';
import { uid } from '../utils';

type Sub = null | 'api' | 'preset' | 'theme' | 'identity' | 'partition' | 'data' | 'assets' | 'characters' | 'about';

export function MeApp({
  settings,
  updateSettings,
  state,
  onImport,
  onBack,
}: {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  state: PersistShape;
  onImport: (next: PersistShape) => void;
  onBack: () => void;
}) {
  const [sub, setSub] = useState<Sub>(null);
  const [about, setAbout] = useState(false);
  const [showStickerManager, setShowStickerManager] = useState(false);
  const [stickerInput, setStickerInput] = useState('');

  const activeUser = settings.users.find((u) => u.id === settings.activeUserId) ?? settings.users[0];
  const themeName = THEMES.find((t) => t.id === settings.themeId)?.name ?? '水墨黑白';

  const saveUser = (u: UserIdentity) => {
    const exists = settings.users.some((x) => x.id === u.id);
    updateSettings({
      users: exists ? settings.users.map((x) => (x.id === u.id ? u : x)) : [...settings.users, u],
      activeUserId: settings.activeUserId ?? u.id,
    });
  };
  const deleteUser = (id: string) => {
    const next = settings.users.filter((u) => u.id !== id);
    updateSettings({
      users: next,
      activeUserId: settings.activeUserId === id ? next[0]?.id ?? null : settings.activeUserId,
    });
  };
  const setActiveUser = (id: string) => updateSettings({ activeUserId: id });

  const addMusic = (t: MusicTrack) => updateSettings({ music: [...settings.music, t] });
  const clearMusic = () => updateSettings({ music: [] });
  const addAlbum = (i: AlbumImage) => updateSettings({ albumImages: [...settings.albumImages, i] });
  const clearAlbum = () => updateSettings({ albumImages: [] });

  if (sub === 'api')
    return <ApiConfigScreen api={settings.api} onChange={(api) => updateSettings({ api })} onBack={() => setSub(null)} />;
  if (sub === 'preset')
    return (
      <ApiPresetScreen
        api={settings.api}
        presets={settings.presets}
        activePresetId={settings.activePresetId}
        onChange={(presets, activeId) => {
          updateSettings({ presets, activePresetId: activeId });
          const p = presets.find((x) => x.id === activeId);
          if (p) updateSettings({ api: presetToApi(p) });
        }}
        onBack={() => setSub(null)}
      />
    );
  if (sub === 'theme')
    return (
      <ThemeScreen
        current={settings.themeId}
        onPick={(id) => { updateSettings({ themeId: id }); applyTheme(id); }}
        onBack={() => setSub(null)}
      />
    );
  if (sub === 'identity')
    return (
      <IdentityScreen
        users={settings.users}
        activeUserId={settings.activeUserId}
        onSave={saveUser}
        onDelete={deleteUser}
        onSetActive={setActiveUser}
        onBack={() => setSub(null)}
      />
    );
  if (sub === 'partition')
    return (
      <PartitionScreen
        users={settings.users}
        partitions={settings.partitions}
        onChange={(partitions) => updateSettings({ partitions })}
        onBack={() => setSub(null)}
      />
    );
  if (sub === 'assets')
    return (
      <AssetsScreen
        music={settings.music}
        album={settings.albumImages}
        onAddMusic={addMusic}
        onAddAlbum={addAlbum}
        onClearMusic={clearMusic}
        onClearAlbum={clearAlbum}
        onBack={() => setSub(null)}
      />
    );
  if (sub === 'data')
    return <DataScreen state={state} onImport={onImport} onBack={() => setSub(null)} />;
  if (sub === 'characters')
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
        onBack={() => setSub(null)}
      />
    );

  return (
    <AppScreen title="我的" onBack={onBack}>
      {/* profile card */}
      <div className="glass rounded-2xl p-5 mb-5 flex items-center gap-4">
        {activeUser?.avatar ? (
          <img src={activeUser.avatar} className="w-16 h-16 rounded-full object-cover" alt="" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-stone-400 to-stone-600 flex items-center justify-center">
            <UserRound size={28} className="text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-title text-xl">{activeUser?.nickname ?? '未登录'}</div>
          <div className="text-[13px] txt-dim truncate mt-0.5">{activeUser?.signature ?? '点击「用户身份」创建身份'}</div>
        </div>
      </div>

      <div className="font-title text-sm txt-dim mb-2 px-1">系统设置</div>
      <ListGroup>
        <Row label={<Menu icon={<Settings size={17} />} text="API 配置中心" />} hint="Chat / 语音 / 绘图" onClick={() => setSub('api')} right={<ChevronRight size={18} className="txt-faint" />} />
        <Row label={<Menu icon={<Layers size={17} />} text="API 预设" />} hint={settings.presets.find((p) => p.id === settings.activePresetId)?.name ?? '手动配置'} onClick={() => setSub('preset')} right={<ChevronRight size={18} className="txt-faint" />} />
        <Row label={<Menu icon={<Palette size={17} />} text="主题" />} hint={themeName} onClick={() => setSub('theme')} right={<ChevronRight size={18} className="txt-faint" />} />
        <Row
          label={<Menu icon={<Settings size={17} />} text="时间感知" />}
          hint={settings.useRealTime !== false ? '开启' : '关闭（自定义时间）'}
          onClick={() => updateSettings({ useRealTime: settings.useRealTime === false ? true : false })}
          right={
            <span
              className={`text-[12px] px-2 py-0.5 rounded-full ${settings.useRealTime !== false ? 'txt-accent' : 'txt-faint'}`}
              style={{ background: settings.useRealTime !== false ? 'var(--icon-bg-active)' : 'var(--icon-bg)' }}
            >
              {settings.useRealTime !== false ? 'ON' : 'OFF'}
            </span>
          }
        />
        {settings.useRealTime === false && (
          <div className="px-4 py-3 border-t border-[var(--border)]">
            <label className="text-[12px] txt-dim block mb-2">自定义时间 (ISO格式)</label>
            <input
              type="datetime-local"
              value={settings.customTime || ''}
              onChange={(e) => updateSettings({ customTime: e.target.value })}
              className="w-full glass rounded-xl px-3 h-10 text-[13px] outline-none bg-transparent"
            />
          </div>
        )}
        <Row
          label={<Menu icon={<Palette size={17} />} text="全局字体大小" />}
          hint={settings.fontSize === 'xl' ? '特大' : settings.fontSize === 'lg' ? '中大' : '标准'}
          onClick={() => {
            const next: 'md' | 'lg' | 'xl' = settings.fontSize === 'xl' ? 'md' : settings.fontSize === 'lg' ? 'xl' : 'lg';
            updateSettings({ fontSize: next });
          }}
          right={
            <div className="flex rounded-lg overflow-hidden border border-[var(--border)] text-[11px] font-medium" onClick={(e) => e.stopPropagation()}>
              {(['md', 'lg', 'xl'] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => updateSettings({ fontSize: sz })}
                  className={`px-2.5 py-1 transition-colors cursor-pointer ${settings.fontSize === sz || (!settings.fontSize && sz === 'md') ? 'bg-[var(--accent)] text-[var(--bg)] font-bold' : 'bg-[var(--icon-bg)] txt-dim hover:text-neutral-300'}`}
                >
                  {sz === 'md' ? '标准' : sz === 'lg' ? '大' : '特大'}
                </button>
              ))}
            </div>
          }
        />
        <Row
          label={<Menu icon={<Info size={17} />} text="消息提示音" />}
          hint={settings.notifSoundEnabled !== false ? '已开启' : '已静音'}
          onClick={() => updateSettings({ notifSoundEnabled: settings.notifSoundEnabled === false ? true : false })}
          right={
            <span
              className={`text-[12px] px-2 py-0.5 rounded-full ${settings.notifSoundEnabled !== false ? 'txt-accent' : 'txt-faint'}`}
              style={{ background: settings.notifSoundEnabled !== false ? 'var(--icon-bg-active)' : 'var(--icon-bg)' }}
            >
              {settings.notifSoundEnabled !== false ? 'ON' : 'OFF'}
            </span>
          }
        />
        <Row
          label={<Menu icon={<Sparkles size={17} />} text="消息推送频率" />}
          hint={settings.notifProactiveFrequency === 'high' ? '频繁' : settings.notifProactiveFrequency === 'low' ? '极少' : settings.notifProactiveFrequency === 'off' ? '关' : '适中'}
          onClick={() => {
            const next: 'high' | 'medium' | 'low' | 'off' =
              settings.notifProactiveFrequency === 'high' ? 'medium' :
              settings.notifProactiveFrequency === 'medium' ? 'low' :
              settings.notifProactiveFrequency === 'low' ? 'off' : 'high';
            updateSettings({ notifProactiveFrequency: next });
          }}
          right={
            <div className="flex rounded-lg overflow-hidden border border-[var(--border)] text-[10px] font-medium" onClick={(e) => e.stopPropagation()}>
              {(['high', 'medium', 'low', 'off'] as const).map((fr) => (
                <button
                  key={fr}
                  type="button"
                  onClick={() => updateSettings({ notifProactiveFrequency: fr })}
                  className={`px-1.5 py-1 transition-colors cursor-pointer ${settings.notifProactiveFrequency === fr || (!settings.notifProactiveFrequency && fr === 'medium') ? 'bg-[var(--accent)] text-[var(--bg)] font-bold' : 'bg-[var(--icon-bg)] txt-dim hover:text-neutral-300'}`}
                >
                  {fr === 'high' ? '多' : fr === 'medium' ? '中' : fr === 'low' ? '少' : '关'}
                </button>
              ))}
            </div>
          }
        />
        <Row label={<Menu icon={<FolderInput size={17} />} text="本地资源" />} hint="音乐 / 图片" onClick={() => setSub('assets')} right={<ChevronRight size={18} className="txt-faint" />} />
        <Row label={<Menu icon={<Database size={17} />} text="数据备份" />} hint="导出 / 导入" onClick={() => setSub('data')} right={<ChevronRight size={18} className="txt-faint" />} />
        <Row label={<Menu icon={<Sparkles size={17} />} text="自动生成NPC" />} hint={settings.autoNpc ? '开启' : '关闭'} onClick={() => updateSettings({ autoNpc: !settings.autoNpc })} right={<span className={`text-[12px] px-2 py-0.5 rounded-full ${settings.autoNpc ? 'txt-accent' : 'txt-faint'}`} style={{ background: settings.autoNpc ? 'var(--icon-bg-active)' : 'var(--icon-bg)' }}>{settings.autoNpc ? 'ON' : 'OFF'}</span>} />
        <Row
          label={<Menu icon={<Settings size={17} />} text="角色主动互动" />}
          hint={settings.activeInteractEnabled !== false ? '已开启' : '已关闭'}
          onClick={() => updateSettings({ activeInteractEnabled: settings.activeInteractEnabled === false ? true : false })}
          right={
            <span
              className={`text-[12px] px-2 py-0.5 rounded-full ${settings.activeInteractEnabled !== false ? 'txt-accent' : 'txt-faint'}`}
              style={{ background: settings.activeInteractEnabled !== false ? 'var(--icon-bg-active)' : 'var(--icon-bg)' }}
            >
              {settings.activeInteractEnabled !== false ? 'ON' : 'OFF'}
            </span>
          }
        />
        {settings.activeInteractEnabled !== false && (
          <Row
            label={<Menu icon={<Palette size={17} />} text="主动互动挡位" />}
            hint={settings.activeInteractMode === 'auto' ? '自动挡' : '手动挡'}
            onClick={() => updateSettings({ activeInteractMode: settings.activeInteractMode === 'auto' ? 'manual' : 'auto' })}
            right={
              <div className="flex rounded-lg overflow-hidden border border-[var(--border)] text-[11px] font-medium">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateSettings({ activeInteractMode: 'manual' });
                  }}
                  className={`px-2 py-1 transition-colors ${settings.activeInteractMode !== 'auto' ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[var(--icon-bg)] txt-dim'}`}
                >
                  手动
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateSettings({ activeInteractMode: 'auto' });
                  }}
                  className={`px-2 py-1 transition-colors ${settings.activeInteractMode === 'auto' ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[var(--icon-bg)] txt-dim'}`}
                >
                  自动
                </button>
              </div>
            }
          />
        )}
      </ListGroup>

      {/* 显示设置 */}
      <div className="text-[13px] font-medium mb-2 mt-4 txt-accent">显示设置</div>
      <ListGroup>
        <Row
          label={<Menu icon={<Settings size={17} />} text="内心想法透明度" />}
          hint={`${Math.round((settings.innerThoughtOpacity || 0.7) * 100)}%`}
          onClick={() => {}}
          right={
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round((settings.innerThoughtOpacity || 0.7) * 100)}
              onChange={(e) => updateSettings({ innerThoughtOpacity: Number(e.target.value) / 100 })}
              onClick={(e) => e.stopPropagation()}
              className="w-24 h-1 accent-[var(--accent)] cursor-pointer"
            />
          }
        />
        <Row
          label={<Menu icon={<Settings size={17} />} text="自动保存角色图片" />}
          hint={settings.autoSaveCharImages !== false ? '开启' : '关闭'}
          onClick={() => updateSettings({ autoSaveCharImages: settings.autoSaveCharImages === false ? true : false })}
          right={
            <span
              className={`text-[12px] px-2 py-0.5 rounded-full ${settings.autoSaveCharImages !== false ? 'txt-accent' : 'txt-faint'}`}
              style={{ background: settings.autoSaveCharImages !== false ? 'var(--icon-bg-active)' : 'var(--icon-bg)' }}
            >
              {settings.autoSaveCharImages !== false ? 'ON' : 'OFF'}
            </span>
          }
        />
        <Row
          label={<Menu icon={<Settings size={17} />} text="自动翻译外语" />}
          hint={settings.autoTranslateEnabled ? '开启' : '关闭'}
          onClick={() => updateSettings({ autoTranslateEnabled: !settings.autoTranslateEnabled })}
          right={
            <span
              className={`text-[12px] px-2 py-0.5 rounded-full ${settings.autoTranslateEnabled ? 'txt-accent' : 'txt-faint'}`}
              style={{ background: settings.autoTranslateEnabled ? 'var(--icon-bg-active)' : 'var(--icon-bg)' }}
            >
              {settings.autoTranslateEnabled ? 'ON' : 'OFF'}
            </span>
          }
        />
        <Row
          label={<Menu icon={<Settings size={17} />} text="侧边滑动返回" />}
          hint={settings.swipeBackEnabled !== false ? '开启' : '关闭'}
          onClick={() => updateSettings({ swipeBackEnabled: settings.swipeBackEnabled === false ? true : false })}
          right={
            <span
              className={`text-[12px] px-2 py-0.5 rounded-full ${settings.swipeBackEnabled !== false ? 'txt-accent' : 'txt-faint'}`}
              style={{ background: settings.swipeBackEnabled !== false ? 'var(--icon-bg-active)' : 'var(--icon-bg)' }}
            >
              {settings.swipeBackEnabled !== false ? 'ON' : 'OFF'}
            </span>
          }
        />
      </ListGroup>

      {/* 关于 */}
      <div className="text-[13px] font-medium mb-2 mt-4 txt-accent">其他</div>
      <ListGroup>
        <Row label={<Menu icon={<Info size={17} />} text="关于" />} onClick={() => setAbout(true)} right={<ChevronRight size={18} className="txt-faint" />} />
        <Row
          label={<Menu icon={<Sparkles size={17} />} text="表情包管理" />}
          hint={`${(settings.stickers || []).length} 个表情`}
          onClick={() => setShowStickerManager(true)}
          right={<ChevronRight size={18} className="txt-faint" />}
        />
      </ListGroup>

      <div className="font-title text-sm txt-dim mb-2 px-1 mt-5">身份与角色</div>
      <ListGroup>
        <Row label={<Menu icon={<UserRound size={17} />} text="用户身份" />} hint={`${settings.users.length} 个身份`} onClick={() => setSub('identity')} right={<ChevronRight size={18} className="txt-faint" />} />
        <Row label={<Menu icon={<Users size={17} />} text="设定工坊" />} hint={`${settings.characters.length} 角色 / ${settings.worldEntries?.length || 0} 词条`} onClick={() => setSub('characters')} right={<ChevronRight size={18} className="txt-faint" />} />
        <Row label={<Menu icon={<Network size={17} />} text="分区与对应关系" />} hint={`${settings.partitions.length} 个分区`} onClick={() => setSub('partition')} right={<ChevronRight size={18} className="txt-faint" />} />
      </ListGroup>

      <div className="text-center txt-faint text-[11px] mt-8">羊羊机 · AI角色聊天手机系统 v0.1</div>

      <Modal open={about} onClose={() => setAbout(false)} title="关于羊羊机">
        <div className="text-sm txt-dim leading-relaxed text-center space-y-2">
          <p>羊羊机是一个网页版手机风格 AI 角色聊天系统。</p>
          <p>完全模拟真实手机交互，兼容 OpenAI 格式接口，数据本地保存。</p>
          <p className="txt-faint text-[12px]">当前为阶段一至三：桌面框架 + API 配置 + 身份系统</p>
        </div>
      </Modal>

      {/* 表情包管理模态框 */}
      <Modal open={showStickerManager} onClose={() => { setShowStickerManager(false); setStickerInput(''); }} title="表情包管理">
        <div className="space-y-4">
          {/* 导入新表情 */}
          <div>
            <label className="text-[12px] txt-faint block mb-1.5">导入表情包（支持图床链接，兼容 JPG/PNG/GIF/WebP 等格式）</label>
            <div className="flex gap-2">
              <input
                value={stickerInput}
                onChange={(e) => setStickerInput(e.target.value)}
                placeholder="粘贴或输入图床链接..."
                className="flex-1 glass rounded-xl px-3 h-11 text-[14px] outline-none bg-transparent"
              />
              <button
                onClick={() => {
                  const url = stickerInput.trim();
                  if (!url) return;
                  const newSticker: Sticker = {
                    id: uid(),
                    url,
                    addedAt: Date.now(),
                  };
                  updateSettings({ stickers: [...(settings.stickers || []), newSticker] });
                  setStickerInput('');
                }}
                disabled={!stickerInput.trim()}
                className="tap h-11 px-4 rounded-xl font-medium text-[13px] text-white disabled:opacity-40 shrink-0"
                style={{ background: 'var(--accent)', color: 'var(--bg)' }}
              >
                导入
              </button>
            </div>
          </div>

          {/* 已有表情包列表 */}
          <div>
            <label className="text-[12px] txt-faint block mb-1.5">已导入的表情包（{(settings.stickers || []).length} 个）</label>
            <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto no-scrollbar">
              {(settings.stickers || []).map((s) => (
                <div key={s.id} className="relative group">
                  <img
                    src={s.url}
                    alt={s.name || '表情'}
                    className="w-full aspect-square object-cover rounded-xl glass p-1"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <button
                    onClick={() => {
                      updateSettings({ stickers: (settings.stickers || []).filter((x) => x.id !== s.id) });
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
              {(settings.stickers || []).length === 0 && (
                <div className="col-span-4 text-center py-8 txt-faint text-[13px]">还没有导入表情包</div>
              )}
            </div>
          </div>

          <div className="text-[11px] txt-faint leading-relaxed bg-neutral-900/50 rounded-xl p-3 border border-neutral-800">
            <strong className="txt-accent">提示：</strong>支持任意图床链接，如 Sm.ms、Imgur、GitHub 等。
            支持 JPG、PNG、GIF（动图）、WebP 等常见格式。
            点击已导入表情右上角的 × 可以删除。
          </div>
        </div>
      </Modal>
    </AppScreen>
  );
}

function Menu({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="flex items-center gap-3">
      <span className="txt-accent">{icon}</span>
      {text}
    </span>
  );
}
