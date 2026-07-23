import { useRef, useState } from 'react';
import { Camera, Trash2, User, Image, Wand2, Loader2, Upload, FileText, Plus, ChevronUp, ChevronDown, KeyRound, BookMarked, Eye, Edit3 } from 'lucide-react';
import { AppScreen } from '../components/AppScreen';
import { ListGroup, Row, TextField, PrimaryButton } from '../components/ui';
import { Confirm, Modal } from '../components/Sheet';
import { uid, fileToDataUrl } from '../utils';
import { generateImage } from '../api';
import type { Character, ApiConfig, WorldEntry } from '../types';
import ReactMarkdown from 'react-markdown';

export function CharacterScreen({
  characters,
  api,
  onSave,
  onDelete,
  worldEntries = [],
  onChangeWorldEntries,
  onBack,
  initialTab = 'character',
}: {
  characters: Character[];
  api: ApiConfig;
  onSave: (c: Character) => void;
  onDelete: (id: string) => void;
  worldEntries?: WorldEntry[];
  onChangeWorldEntries: (entries: WorldEntry[]) => void;
  onBack: () => void;
  initialTab?: 'character' | 'worldbook';
}) {
  const [activeTab, setActiveTab] = useState<'character' | 'worldbook'>(initialTab);

  // Character States
  const [editing, setEditing] = useState<Character | null>(null);
  const [confirmDel, setConfirmDel] = useState<Character | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [personaPreviewMode, setPersonaPreviewMode] = useState(false);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  // Worldbook States
  const [editingWorld, setEditingWorld] = useState<WorldEntry | null>(null);
  const [addingWorld, setAddingWorld] = useState(false);
  const [importingWorld, setImportingWorld] = useState(false);
  const [confirmDelWorld, setConfirmDelWorld] = useState<WorldEntry | null>(null);
  const [worldKey, setWorldKey] = useState('');
  const [worldContent, setWorldContent] = useState('');
  const [worldPriority, setWorldPriority] = useState(0);
  const [worldPastedText, setWorldPastedText] = useState('');
  const worldFileInputRef = useRef<HTMLInputElement>(null);

  const sortedWorld = [...worldEntries].sort((a, b) => b.priority - a.priority);

  // Character Handlers
  const startNew = () => {
    setIsNew(true);
    setEditing({
      id: uid(),
      name: '',
      avatar: '',
      signature: '',
      persona: '',
      greeting: '',
      imagePromptTemplate: '',
      createdAt: Date.now(),
    });
  };

  const handleFileImport = (file: File | undefined) => {
    if (!file) return;

    // 检查文件类型
    if (file.type.startsWith('image/')) {
      // PNG 格式角色卡（Tavern 格式）
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);

          // 查找 tEXt chunk 中的 chara 数据
          let charaJson = '';
          for (let i = 0; i < uint8Array.length - 4; i++) {
            // 查找 "tEXt" 标记
            if (uint8Array[i] === 0x74 && uint8Array[i+1] === 0x45 &&
                uint8Array[i+2] === 0x58 && uint8Array[i+3] === 0x74) {
              // 找到 tEXt，向后查找 "chara\0"
              let j = i + 4;
              while (j < uint8Array.length - 6) {
                if (uint8Array[j] === 0x63 && uint8Array[j+1] === 0x68 &&
                    uint8Array[j+2] === 0x61 && uint8Array[j+3] === 0x72 &&
                    uint8Array[j+4] === 0x61 && uint8Array[j+5] === 0x00) {
                  // 找到 "chara\0"，后面是 base64 编码的数据
                  j += 6;
                  const dataStart = j;
                  // 读取到下一个 chunk 或文件结束
                  while (j < uint8Array.length && uint8Array[j] !== 0x00) {
                    j++;
                  }
                  const base64Data = new TextDecoder().decode(uint8Array.slice(dataStart, j));
                  charaJson = atob(base64Data);
                  break;
                }
                j++;
              }
              if (charaJson) break;
            }
          }

          if (charaJson) {
            parseAndAddChar(charaJson);
          } else {
            alert('未能从 PNG 图片中提取角色卡数据。请确认这是有效的 Tavern 格式角色卡。');
          }
        } catch (err: any) {
          alert('PNG 解析失败：' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // JSON 文件
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          parseAndAddChar(text);
        } catch (err: any) {
          alert('解析失败：' + err.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const parseAndAddChar = (text: string) => {
    try {
      const parsed = JSON.parse(text);

      // Tavern V2 Spec 格式
      const isV2 = parsed.spec === 'chara_card_v2';
      const data = isV2 ? parsed.data : (parsed.data || parsed);

      // 提取基本信息
      const charName = data.name || data.char_name || '';

      // V2 格式：description 是主要人设描述
      let charPersona = data.description || data.personality || data.persona || '';

      // V2 格式：可能还有 personality, scenario 等字段
      if (data.personality && data.personality !== charPersona) {
        charPersona += '\n\n## 性格\n' + data.personality;
      }
      if (data.scenario) {
        charPersona += '\n\n## 场景设定\n' + data.scenario;
      }

      const charGreeting = data.first_mes || data.greeting || data.mes_example || '';
      const charSignature = data.creator_notes || data.signature || data.tagline || '';

      // 头像处理
      let charAvatar = data.avatar || '';
      // V2 格式可能是 data URL
      if (charAvatar && !charAvatar.startsWith('data:') && !charAvatar.startsWith('http')) {
        charAvatar = ''; // 忽略无效头像
      }

      if (charName) {
        const newChar: Character = {
          id: uid(),
          name: charName,
          avatar: charAvatar,
          signature: charSignature.slice(0, 100) || charPersona.slice(0, 50),
          persona: charPersona,
          greeting: charGreeting,
          imagePromptTemplate: data.imagePromptTemplate || data.img_prompt || '',
          createdAt: Date.now()
        };
        onSave(newChar);
        alert(`成功导入角色卡「${charName}」！${isV2 ? '（Tavern V2 格式）' : ''}`);
        setImporting(false);
        setPastedText('');
      } else {
        alert('JSON 中未识别到有效的角色名 (name 字段)！');
      }
    } catch {
      const lines = text.split('\n');
      let name = '';
      let signature = '';
      let persona = '';
      let greeting = '';

      lines.forEach((line) => {
        const index = line.indexOf(':');
        const zhIndex = line.indexOf('：');
        const splitIdx = index !== -1 ? index : zhIndex;
        if (splitIdx > 0) {
          const k = line.substring(0, splitIdx).trim();
          const v = line.substring(splitIdx + 1).trim();

          if (k.includes('名') || k.toLowerCase() === 'name') {
            name = v;
          } else if (k.includes('签') || k.includes('介绍') || k.toLowerCase() === 'signature') {
            signature = v;
          } else if (k.includes('设') || k.includes('性格') || k.toLowerCase() === 'persona' || k.toLowerCase() === 'personality') {
            persona = persona ? persona + '\n' + v : v;
          } else if (k.includes('开') || k.includes('白') || k.toLowerCase() === 'greeting' || k.toLowerCase() === 'first_mes') {
            greeting = v;
          } else {
            persona = persona ? persona + `\n${k}: ${v}` : `${k}: ${v}`;
          }
        } else if (line.trim()) {
          persona = persona ? persona + '\n' + line.trim() : line.trim();
        }
      });

      if (name) {
        const newChar: Character = {
          id: uid(),
          name,
          avatar: '',
          signature,
          persona,
          greeting,
          imagePromptTemplate: '',
          createdAt: Date.now()
        };
        onSave(newChar);
        alert(`从文本中识别并成功导入角色卡「${name}」！`);
        setImporting(false);
        setPastedText('');
      } else {
        alert('未能识别角色。请确保文本包含”名字：xxx”或”角色名：xxx”等描述。');
      }
    }
  };

  // Worldbook Handlers
  const saveWorld = () => {
    if (!worldKey.trim()) return;
    if (editingWorld) {
      onChangeWorldEntries(worldEntries.map((e) => e.id === editingWorld.id ? { ...e, key: worldKey.trim(), content: worldContent.trim(), priority: worldPriority } : e));
    } else {
      onChangeWorldEntries([...worldEntries, { id: uid(), key: worldKey.trim(), content: worldContent.trim(), priority: worldPriority }]);
    }
    resetWorld();
  };

  const resetWorld = () => {
    setWorldKey('');
    setWorldContent('');
    setWorldPriority(0);
    setEditingWorld(null);
    setAddingWorld(false);
  };

  const editWorld = (e: WorldEntry) => {
    setEditingWorld(e);
    setWorldKey(e.key);
    setWorldContent(e.content);
    setWorldPriority(e.priority);
    setAddingWorld(true);
  };

  const delWorld = (id: string) => onChangeWorldEntries(worldEntries.filter((e) => e.id !== id));

  const handleWorldFileImport = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        parseAndAddWorld(text);
      } catch (err: any) {
        alert('文件解析失败：' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const parseAndAddWorld = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      const newEntries: WorldEntry[] = [];
      
      if (Array.isArray(parsed)) {
        parsed.forEach((item: any) => {
          const k = item.key || item.keyword || item.name || '';
          const c = item.content || item.value || item.desc || '';
          if (k && c) {
            newEntries.push({ id: uid(), key: k, content: c, priority: Number(item.priority || 0) });
          }
        });
      } else if (parsed.world || parsed.entries) {
        const entriesList = parsed.world ?? parsed.entries;
        if (Array.isArray(entriesList)) {
          entriesList.forEach((item: any) => {
            const k = item.key || item.keyword || item.keys?.[0] || '';
            const c = item.content || item.value || '';
            if (k && c) {
              newEntries.push({ id: uid(), key: k, content: c, priority: Number(item.priority || 0) });
            }
          });
        }
      } else {
        const k = parsed.key || parsed.keyword || '';
        const c = parsed.content || parsed.value || '';
        if (k && c) {
          newEntries.push({ id: uid(), key: k, content: c, priority: Number(parsed.priority || 0) });
        }
      }

      if (newEntries.length > 0) {
        onChangeWorldEntries([...worldEntries, ...newEntries]);
        alert(`成功导入 ${newEntries.length} 条世界书词条！`);
        setImportingWorld(false);
        setWorldPastedText('');
      } else {
        alert('未识别到有效的世界书词条。JSON需包含 key 与 content 字段！');
      }
    } catch {
      const lines = text.split('\n');
      const newEntries: WorldEntry[] = [];
      lines.forEach((line) => {
        const index = line.indexOf(':');
        const zhIndex = line.indexOf('：');
        const splitIdx = index !== -1 ? index : zhIndex;
        if (splitIdx > 0) {
          const k = line.substring(0, splitIdx).trim();
          const c = line.substring(splitIdx + 1).trim();
          if (k && c && k.length < 25) {
            newEntries.push({ id: uid(), key: k, content: c, priority: 0 });
          }
        }
      });

      if (newEntries.length > 0) {
        onChangeWorldEntries([...worldEntries, ...newEntries]);
        alert(`从文本中识别并成功导入 ${newEntries.length} 条词条！`);
        setImportingWorld(false);
        setWorldPastedText('');
      } else {
        alert('未能从文本中解析出词条。请使用“关键词：具体内容”的格式，每行一个。或者使用 JSON 格式。');
      }
    }
  };

  return (
    <AppScreen
      title="设定工坊"
      onBack={onBack}
      right={
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => activeTab === 'character' ? setImporting(true) : setImportingWorld(true)}
            className="tap text-[var(--accent)] text-[14px] font-medium flex items-center gap-0.5 cursor-pointer"
          >
            <Upload size={14} /> 导入
          </button>
          <button
            onClick={() => activeTab === 'character' ? startNew() : setAddingWorld(true)}
            className="tap text-[var(--accent)] text-[14px] font-medium cursor-pointer"
          >
            新建
          </button>
        </div>
      }
    >
      {/* Segmented Control Tab Selector */}
      <div className="flex p-1 bg-[var(--surface-strong)] rounded-2xl mb-4 font-medium text-[13px] border border-[var(--border)]">
        <button
          onClick={() => setActiveTab('character')}
          className={`flex-1 py-2 rounded-xl text-center transition-all cursor-pointer ${
            activeTab === 'character'
              ? 'bg-[var(--accent)] text-[var(--bg)] font-bold shadow-sm'
              : 'txt-dim hover:text-[var(--fg)]'
          }`}
        >
          👤 AI 角色卡 ({characters.length})
        </button>
        <button
          onClick={() => setActiveTab('worldbook')}
          className={`flex-1 py-2 rounded-xl text-center transition-all cursor-pointer ${
            activeTab === 'worldbook'
              ? 'bg-[var(--accent)] text-[var(--bg)] font-bold shadow-sm'
              : 'txt-dim hover:text-[var(--fg)]'
          }`}
        >
          📚 世界书词条 ({worldEntries.length})
        </button>
      </div>

      {activeTab === 'character' ? (
        <>
          <div className="text-[12px] txt-faint mb-3 leading-relaxed px-1">
            管理 AI 角色。支持单独设置外观生图提示词与左脸参考图（上传后生成的角色图片都会参考这张脸）。
          </div>

          <ListGroup>
            {characters.length === 0 && (
              <div className="px-4 py-8 text-center txt-faint text-sm">还没有角色，点右上角新建或导入一个</div>
            )}
            {characters.map((c) => (
              <Row
                key={c.id}
                label={
                  <span className="flex items-center gap-2">
                    {c.avatar ? (
                      <img src={c.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded-full icon-bg flex items-center justify-center">
                        <User size={16} className="icon-color" />
                      </div>
                    )}
                    <span className="font-medium text-[14px]">{c.name || '未命名'}</span>
                    {c.faceRef && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-strong)] txt-dim scale-90">左脸</span>}
                  </span>
                }
                hint={c.signature || c.persona.slice(0, 30) || '未设置人设描述'}
                onClick={() => { setIsNew(false); setEditing({ ...c }); }}
                right={
                  <button onClick={(e) => { e.stopPropagation(); setConfirmDel(c); }} className="tap txt-dim hover:text-red-400 p-1">
                    <Trash2 size={16} />
                  </button>
                }
              />
            ))}
          </ListGroup>
        </>
      ) : (
        <>
          <div className="text-[12px] txt-faint mb-3 leading-relaxed px-1">
            世界书为 AI 角色提供背景知识储备。当聊天中出现「关键词」时，对应的背景设定词条会自动加载注入到对话上下文。
          </div>

          {sortedWorld.length === 0 ? (
            <div className="glass rounded-2xl py-12 text-center txt-faint text-sm">还没有词条，点右上角新建或导入</div>
          ) : (
            <div className="space-y-2.5">
              {sortedWorld.map((e) => (
                <div key={e.id} className="glass rounded-2xl p-4 border border-white/5 bg-neutral-900/15">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-[12px] font-bold txt-accent" style={{ background: 'var(--icon-bg-active)' }}>
                        {e.key}
                      </span>
                      <span className="text-[11px] txt-faint">权重: {e.priority}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => onChangeWorldEntries(worldEntries.map((x) => x.id === e.id ? { ...x, priority: x.priority + 1 } : x))} className="tap w-7 h-7 rounded-full glass flex items-center justify-center cursor-pointer" title="提高优先级"><ChevronUp size={14} /></button>
                      <button onClick={() => onChangeWorldEntries(worldEntries.map((x) => x.id === e.id ? { ...x, priority: Math.max(0, x.priority - 1) } : x))} className="tap w-7 h-7 rounded-full glass flex items-center justify-center cursor-pointer" title="降低优先级"><ChevronDown size={14} /></button>
                      <button onClick={() => editWorld(e)} className="tap w-7 h-7 rounded-full glass flex items-center justify-center cursor-pointer text-indigo-400" title="编辑内容"><BookMarked size={14} /></button>
                      <button onClick={() => setConfirmDelWorld(e)} className="tap w-7 h-7 rounded-full glass flex items-center justify-center cursor-pointer text-red-400" title="删除"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="text-[13px] txt-dim leading-relaxed whitespace-pre-wrap">{e.content}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Character Modals */}
      {editing && (
        <CharacterEditor
          isNew={isNew}
          value={editing}
          api={api}
          onClose={() => setEditing(null)}
          onSave={(c) => { onSave(c); setEditing(null); }}
        />
      )}

      <Confirm
        open={!!confirmDel}
        title="删除角色"
        message={`确定删除「${confirmDel?.name}」？相关聊天记录会保留。`}
        danger
        onConfirm={() => { if (confirmDel) onDelete(confirmDel.id); setConfirmDel(null); }}
        onCancel={() => setConfirmDel(null)}
      />

      <Modal open={importing} onClose={() => { setImporting(false); setPastedText(''); }} title="导入角色卡">
        <div className="text-[12px] txt-dim mb-3 leading-relaxed">
          您可以选择直接上传 <strong>.json</strong> (支持 SillyTavern 格式) 或 <strong>.txt</strong> 文档，也可以在下方粘贴内容。
        </div>

        {/* File Picker */}
        <div 
          onClick={() => importFileInputRef.current?.click()}
          className="tap border border-dashed border-[var(--border)] rounded-2xl p-6 text-center bg-neutral-900/40 hover:bg-neutral-900/60 transition-colors mb-4 cursor-pointer"
        >
          <FileText size={24} className="mx-auto text-indigo-400 mb-2" />
          <div className="text-[13px] font-medium">点击选择或拖拽文件到这里</div>
          <div className="text-[11px] txt-faint mt-1">支持：SillyTavern 角色 JSON、通用配置或 TXT 文本</div>
        </div>
        <input 
          ref={importFileInputRef} 
          type="file" 
          accept=".json,.txt" 
          className="hidden" 
          onChange={(e) => handleFileImport(e.target.files?.[0])} 
        />

        <div className="text-[12px] txt-dim mb-1.5">或：直接粘贴文本/JSON</div>
        <textarea
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          placeholder="例如文本文档格式:&#13;名字：诸葛亮&#13;签名：运筹帷幄之中，决胜千里之外&#13;性格：温文尔雅，智谋过人&#13;开场白：亮，见过主公。"
          rows={6}
          className="w-full glass rounded-xl px-3 py-2.5 text-[13px] outline-none bg-transparent resize-none mb-4 placeholder:text-neutral-600 font-mono"
        />

        <div className="flex gap-3">
          <button onClick={() => { setImporting(false); setPastedText(''); }} className="tap flex-1 h-11 rounded-full glass">取消</button>
          <button 
            onClick={() => parseAndAddChar(pastedText)} 
            disabled={!pastedText.trim()} 
            className="tap flex-1 h-11 rounded-full font-semibold cursor-pointer disabled:opacity-40"
            style={{ background: 'var(--accent)', color: 'var(--bg)' }}
          >
            解析并导入
          </button>
        </div>
      </Modal>

      {/* Worldbook Modals */}
      <Modal open={addingWorld} onClose={resetWorld} title={editingWorld ? '编辑世界词条' : '新建世界词条'}>
        <div className="text-[12px] txt-dim mb-1 font-medium">触发关键词</div>
        <input value={worldKey} onChange={(e) => setWorldKey(e.target.value)} placeholder="例如：星陨城 / 暗影组织" className="w-full glass rounded-xl px-3 h-11 text-[13px] outline-none bg-transparent mb-3 border border-white/5 focus:border-indigo-500/50" autoFocus />
        <div className="text-[12px] txt-dim mb-1 font-medium">设定内容</div>
        <textarea value={worldContent} onChange={(e) => setWorldContent(e.target.value)} placeholder="当触发关键词出现时，将加载此段描述到对话背景中…" rows={5} className="w-full glass rounded-xl px-3 py-2.5 text-[13px] outline-none bg-transparent resize-none mb-3 border border-white/5 focus:border-indigo-500/50" />
        <div className="flex items-center gap-3 mb-4 bg-neutral-900/30 p-2.5 rounded-xl border border-white/5">
          <span className="text-[12px] txt-dim font-medium">优先级 (0-10)</span>
          <input type="range" min={0} max={10} value={worldPriority} onChange={(e) => setWorldPriority(Number(e.target.value))} className="flex-1 accent-[var(--accent)]" />
          <span className="text-[13px] tabular-nums w-6 text-center txt-accent font-bold">{worldPriority}</span>
        </div>
        <div className="flex gap-3">
          <button onClick={resetWorld} className="tap flex-1 h-11 rounded-full glass text-[13px] font-medium">取消</button>
          <div className="flex-1">
            <PrimaryButton onClick={saveWorld} disabled={!worldKey.trim()}>{editingWorld ? '保存' : '添加'}</PrimaryButton>
          </div>
        </div>
      </Modal>

      <Confirm open={!!confirmDelWorld} title="删除词条" message={`确定删除关键词「${confirmDelWorld?.key}」的词条？`} danger onConfirm={() => { if (confirmDelWorld) delWorld(confirmDelWorld.id); setConfirmDelWorld(null); }} onCancel={() => setConfirmDelWorld(null)} />

      <Modal open={importingWorld} onClose={() => { setImportingWorld(false); setWorldPastedText(''); }} title="导入世界书词条">
        <div className="text-[12px] txt-dim mb-3 leading-relaxed">
          您可以选择直接上传 <strong>.json</strong> 或 <strong>.txt</strong> 文档，也可以在下方粘贴内容导入。
        </div>

        {/* File Drag / Selector */}
        <div 
          onClick={() => worldFileInputRef.current?.click()}
          className="tap border border-dashed border-[var(--border)] rounded-2xl p-6 text-center bg-neutral-900/40 hover:bg-neutral-900/60 transition-colors mb-4 cursor-pointer"
        >
          <FileText size={24} className="mx-auto text-indigo-400 mb-2" />
          <div className="text-[13px] font-medium">点击选择或拖拽文件到这里</div>
          <div className="text-[11px] txt-faint mt-1">支持：SillyTavern 世界书 JSON、标准 JSON 数组、或 TXT 文本</div>
        </div>
        <input 
          ref={worldFileInputRef} 
          type="file" 
          accept=".json,.txt" 
          className="hidden" 
          onChange={(e) => handleWorldFileImport(e.target.files?.[0])} 
        />

        <div className="text-[12px] txt-dim mb-1.5">或：直接粘贴文本/JSON</div>
        <textarea
          value={worldPastedText}
          onChange={(e) => setWorldPastedText(e.target.value)}
          placeholder="粘贴格式如:&#13;关键词：具体的世界观介绍描述&#13;或者 JSON: [{&quot;key&quot;:&quot;星陨城&quot;,&quot;content&quot;:&quot;一个古老的城市...&quot;}]"
          rows={6}
          className="w-full glass rounded-xl px-3 py-2.5 text-[13px] outline-none bg-transparent resize-none mb-4 placeholder:text-neutral-600 font-mono"
        />

        <div className="flex gap-3">
          <button onClick={() => { setImportingWorld(false); setWorldPastedText(''); }} className="tap flex-1 h-11 rounded-full glass">取消</button>
          <button 
            onClick={() => parseAndAddWorld(worldPastedText)} 
            disabled={!worldPastedText.trim()} 
            className="tap flex-1 h-11 rounded-full font-semibold cursor-pointer disabled:opacity-40"
            style={{ background: 'var(--accent)', color: 'var(--bg)' }}
          >
            解析并导入
          </button>
        </div>
      </Modal>
    </AppScreen>
  );
}

function CharacterEditor({
  isNew,
  value,
  api,
  onClose,
  onSave,
}: {
  isNew: boolean;
  value: Character;
  api: ApiConfig;
  onClose: () => void;
  onSave: (c: Character) => void;
}) {
  const [c, setC] = useState<Character>(value);
  const avatarInput = useRef<HTMLInputElement>(null);
  const faceInput = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState('');
  const [genAvatar, setGenAvatar] = useState(false);
  const [personaPreviewMode, setPersonaPreviewMode] = useState(false);

  const pickImg = async (file: File | undefined, key: 'avatar' | 'faceRef') => {
    if (!file) return;
    const url = await fileToDataUrl(file);
    setC((p) => ({ ...p, [key]: url }));
  };

  const genAvatarFromPrompt = async () => {
    if (!c.imagePromptTemplate.trim()) { setErr('请先填写外观生图提示词'); return; }
    if (!api.image.baseUrl) { setErr('请先在「我的 - API 配置」中完善绘图 API'); return; }
    setGenAvatar(true); setErr('');
    try {
      const url = await generateImage(api.image, c.imagePromptTemplate, { faceRef: c.faceRef });
      setC((p) => ({ ...p, avatar: url }));
    } catch (e) {
      setErr((e as Error).message || '生成失败');
    } finally {
      setGenAvatar(false);
    }
  };

  const save = () => {
    if (!c.name.trim()) { setErr('请填写角色名'); return; }
    onSave(c);
  };

  return (
    <Modal open onClose={onClose} title={isNew ? '新建角色' : '编辑角色'}>
      {/* avatar */}
      <div className="flex items-center gap-3.5 mb-4 p-2 rounded-xl bg-neutral-900/30 border border-white/5">
        <button
          onClick={() => avatarInput.current?.click()}
          className="tap relative w-16 h-16 rounded-full overflow-hidden glass flex items-center justify-center shrink-0 border border-white/10"
        >
          {c.avatar ? <img src={c.avatar} className="w-full h-full object-cover" alt="" /> : <Camera size={20} className="txt-dim" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold mb-1">角色头像</div>
          <button
            onClick={genAvatarFromPrompt}
            disabled={genAvatar}
            className="tap text-[12px] px-3.5 h-8 rounded-full glass flex items-center gap-1.5 font-medium border border-white/5 active:bg-white/5 cursor-pointer"
          >
            {genAvatar ? <Loader2 size={13} className="animate-spin text-indigo-400" /> : <Wand2 size={13} className="text-indigo-400" />} 智能生图
          </button>
        </div>
        <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={(e) => pickImg(e.target.files?.[0], 'avatar')} />
      </div>

      <TextField label="角色名" value={c.name} onChange={(v) => setC({ ...c, name: v })} placeholder="角色名" />
      <TextField label="一句话介绍/签名" value={c.signature} onChange={(v) => setC({ ...c, signature: v })} placeholder="出现在通讯录和群列表的个性签名" />

      <label className="block mb-3.5">
        <div className="text-[12px] txt-dim mb-1 font-medium flex items-center justify-between">
          <span>人设描述（System Prompt）</span>
          <button
            onClick={() => setPersonaPreviewMode(!personaPreviewMode)}
            className="tap flex items-center gap-1 text-[11px] txt-accent"
          >
            {personaPreviewMode ? <><Edit3 size={12} /> 编辑</> : <><Eye size={12} /> 预览</>}
          </button>
        </div>
        {personaPreviewMode ? (
          <div className="glass rounded-xl px-3 py-2 text-[13px] max-h-[300px] overflow-y-auto">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-[16px] font-bold txt-accent mb-2 mt-3">{children}</h1>,
                h2: ({ children }) => <h2 className="text-[14px] font-semibold txt-dim mb-1.5 mt-2 pb-1 border-b border-[var(--border)]">{children}</h2>,
                h3: ({ children }) => <h3 className="text-[13px] font-medium mb-1 mt-2">{children}</h3>,
                p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                strong: ({ children }) => <strong className="font-semibold txt-accent">{children}</strong>,
                em: ({ children }) => <em className="italic txt-faint">{children}</em>,
              }}
            >
              {c.persona || '暂无人设描述'}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={c.persona}
            onChange={(e) => setC({ ...c, persona: e.target.value })}
            placeholder="角色性格、背景、说话风格及与用户的关系。描述越精细对话效果越好。"
            rows={5}
            className="w-full glass rounded-xl px-3 py-2 text-[13px] outline-none resize-none bg-transparent placeholder:text-[var(--text-faint)] border border-white/5 focus:border-indigo-500/50"
          />
        )}
      </label>

      <label className="block mb-3.5">
        <div className="text-[12px] txt-dim mb-1 font-medium">开场白</div>
        <textarea
          value={c.greeting}
          onChange={(e) => setC({ ...c, greeting: e.target.value })}
          placeholder="角色第一次开启对话时主动说的话"
          rows={2}
          className="w-full glass rounded-xl px-3 py-2 text-[13px] outline-none resize-none bg-transparent placeholder:text-[var(--text-faint)] border border-white/5 focus:border-indigo-500/50"
        />
      </label>

      <label className="block mb-3.5">
        <div className="text-[12px] txt-dim mb-1 font-medium flex items-center gap-1.5"><Image size={12} className="text-indigo-400" /> 头像生图提示词（用于智能生图）</div>
        <textarea
          value={c.imagePromptTemplate}
          onChange={(e) => setC({ ...c, imagePromptTemplate: e.target.value })}
          placeholder="例如: 1boy, handsome, white hair, traditional chinese robe, masterpiece, detailed avatar"
          rows={3}
          className="w-full glass rounded-xl px-3 py-2 text-[13px] outline-none resize-none bg-transparent placeholder:text-[var(--text-faint)] border border-white/5 focus:border-indigo-500/50"
        />
      </label>

      <div className="mb-4">
        <div className="text-[12px] txt-dim mb-1 font-medium">左脸参考图 (可选，生图时会智能融入此面部特征)</div>
        <button
          onClick={() => faceInput.current?.click()}
          className="tap w-full h-24 rounded-xl glass flex items-center justify-center overflow-hidden border border-white/5 hover:border-white/15"
        >
          {c.faceRef ? <img src={c.faceRef} className="w-full h-full object-cover" alt="" /> : <div className="flex flex-col items-center gap-1 text-[12px] txt-faint"><Camera size={20} /> 点击上传左脸照片</div>}
        </button>
        <input ref={faceInput} type="file" accept="image/*" className="hidden" onChange={(e) => pickImg(e.target.files?.[0], 'faceRef')} />
      </div>

      {err && <div className="text-[12px] text-[var(--danger)] mb-2.5 text-center font-medium bg-red-500/10 p-1.5 rounded-lg border border-red-500/15">{err}</div>}

      <div className="flex gap-3">
        <button onClick={onClose} className="tap flex-1 h-11 rounded-full glass text-[13px] font-medium">取消</button>
        <div className="flex-1"><PrimaryButton onClick={save}>保存修改</PrimaryButton></div>
      </div>
    </Modal>
  );
}
