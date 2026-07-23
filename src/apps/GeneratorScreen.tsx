import React, { useState, useEffect } from "react";
import { GeneratedSetting, SettingType } from "./generator/types";
import { PersonaForm } from "./generator/PersonaForm";
import { MarkdownRenderer } from "./generator/MarkdownRenderer";
import { SavedLibrary } from "./generator/SavedLibrary";
import { AppScreen } from "../components/AppScreen";
import { uid } from "../utils";
import type { ApiConfig, Character, UserIdentity, WorldEntry } from "../types";
import { askAI } from "../api";
import { Sparkles, ArrowLeft, ArrowRight } from "lucide-react";

const LOCAL_STORAGE_KEY = "persona_generator_saved_settings_v1";

const SYSTEM_PROMPTS: Record<string, (wc: number, style: string, tone: string, extra: string) => string> = {
  user_persona: (wc, style, tone, extra) => [
    "你是一名专业的角色设定师，负责为用户生成用户人设 (User Persona)。",
    "根据用户提供的关键词、描述或风格基调，生成一份完整、细致的人设设定。",
    "",
    "输出结构（Markdown 格式，保留 H2 标题）：",
    "## 1. 基本信息 (姓名、性别、年龄、外貌/穿着风格)",
    "## 2. 性格特点 (核心性格、优点、缺点、小习惯/怪癖)",
    "## 3. 背景故事 (成长经历、影响一生的关键事件)",
    "## 4. 人际关系 (重要家庭成员、朋友、死敌或导师关系)",
    "## 5. 说话风格与口头禅 (语调特点、标志性口头禅、说话习惯)",
    "## 6. 兴趣爱好与技能 (日常特长、核心专业技能、业余兴趣)",
    "## 7. 其他细节 (随身携带物品、害怕的事物、最大愿望)",
    "",
    "字数：" + wc + "字。风格：" + (style || "自然写实") + "。语调：" + (tone || "自然") + "。",
    extra ? "额外自定义字段：" + extra : "",
    "内容具体、充满画面感，避免空洞名词堆砌。",
  ].join("\n"),

  xr_persona: (wc, style, tone, extra) => [
    "你是一名专业的虚拟角色（Char/AI伴侣）设定师。",
    "根据用户提供的关键词或描述，生成完整Char角色设定。",
    "",
    "输出结构（Markdown 格式，保留 H2 标题）：",
    "## 1. 基本信息 (姓名、身份/种族、外貌特征，适合立绘/建模参考)",
    "## 2. 性格与情感模式 (核心性格、情绪反应、对用户态度、情感边界)",
    "## 3. 背景设定 (世界观来源、身份定位、与用户的相识/绑定关系)",
    "## 4. 互动风格 (语言口癖、表情动作习惯、互动红线/安全边界)",
    "## 5. 特殊设定 (独特技能/异能、限制/无法做到之事、独特之处)",
    "## 6. 场景适配建议 (适合场景、彩蛋指令、互动建议)",
    "",
    "字数：" + wc + "字。风格：" + (style || "自然写实") + "。语调：" + (tone || "自然") + "。",
    extra ? "额外自定义字段：" + extra : "",
  ].join("\n"),

  worldbook: (wc, style, tone, extra) => [
    "你是一名专业的世界观设定师，负责生成世界书 (Worldbook)。",
    "根据用户提供的关键词或描述，生成逻辑自洽、细节详实的世界观背景。",
    "",
    "输出结构（Markdown 格式，保留 H2 标题）：",
    "## 1. 世界观概述 (时代背景、科技/魔法水平、基调与氛围)",
    "## 2. 地理与环境 (版图划分、核心地点、势力范围、生态特色)",
    "## 3. 社会体系 (政治结构、阶层划分、种族、宗教/社会势力)",
    "## 4. 历史脉络 (三个关键历史事件及其深远影响)",
    "## 5. 特殊规则 (魔法/科技规律与限制，确保逻辑自洽)",
    "## 6. 重要设定条目 (专有名词/术语、传奇物品、核心组织)",
    "## 7. 与角色/剧情关联提示 (成长线暗示、剧本杀剧情切入点)",
    "",
    "字数：" + wc + "字。风格：" + (style || "自然写实") + "。语调：" + (tone || "自然") + "。",
    extra ? "额外自定义字段：" + extra : "",
    "逻辑严密自洽、细节丰富、条目清晰。",
  ].join("\n"),
};

export function GeneratorScreen({
  api,
  onAddCharacter,
  onAddUser,
  onAddWorldEntries,
  onBack,
}: {
  api: ApiConfig;
  onAddCharacter: (c: Character) => void;
  onAddUser: (u: UserIdentity) => void;
  onAddWorldEntries: (e: WorldEntry[]) => void;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"create" | "library" | "help">("create");
  const [savedSettings, setSavedSettings] = useState<GeneratedSetting[]>([]);
  const [currentSetting, setCurrentSetting] = useState<GeneratedSetting | null>(null);
  const [currentVersionIdx, setCurrentVersionIdx] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [refineLoading, setRefineLoading] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) setSavedSettings(JSON.parse(stored));
    } catch {}
  }, []);

  const updateSavedSettings = (newSettings: GeneratedSetting[]) => {
    setSavedSettings(newSettings);
    try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSettings)); } catch {}
  };

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text).then(() => {
        triggerToast("已复制到剪贴板！");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {});
    } catch {}
  };

  const handleGenerate = async (config: {
    type: SettingType;
    prompt: string;
    wordCount: number;
    customStyle: string;
    tone: string;
    customStructure: string;
  }) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const sysFn = SYSTEM_PROMPTS[config.type];
      const systemPrompt = sysFn ? sysFn(config.wordCount, config.customStyle, config.tone, config.customStructure) : SYSTEM_PROMPTS.user_persona(config.wordCount, config.customStyle, config.tone, config.customStructure);

      const content = await askAI(api, systemPrompt, config.prompt, { temperature: 0.85, maxTokens: config.wordCount * 2 });

      const newSetting: GeneratedSetting = {
        id: uid(),
        type: config.type,
        title: config.prompt.slice(0, 30),
        prompt: config.prompt,
        content,
        createdAt: new Date().toISOString(),
        wordCount: config.wordCount,
        customStyle: config.customStyle,
        tone: config.tone,
        customStructure: config.customStructure,
        versions: [{ timestamp: new Date().toISOString(), content }],
      };
      setCurrentSetting(newSetting);
      setCurrentVersionIdx(0);
      updateSavedSettings([newSetting, ...savedSettings]);
      triggerToast("生成成功！");
    } catch (e) {
      setErrorMessage((e as Error).message || "生成失败");
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!currentSetting || !feedbackText.trim()) return;
    setRefineLoading(true);
    setErrorMessage(null);
    try {
      const refinePrompt = "当前设定：\n" + currentSetting.content + "\n\n用户反馈：" + feedbackText + "\n\n请根据用户反馈，对当前设定进行改进和完善。保持原有的Markdown结构和标题。只输出改进后的完整设定。";
      const refined = await askAI(api, "", refinePrompt, { temperature: 0.8, maxTokens: currentSetting.wordCount * 2 });

      const newVersion = { timestamp: new Date().toISOString(), content: refined, feedback: feedbackText };
      const updatedSetting = {
        ...currentSetting,
        content: refined,
        versions: [...currentSetting.versions, newVersion],
      };
      setCurrentSetting(updatedSetting);
      setCurrentVersionIdx(updatedSetting.versions.length - 1);
      setFeedbackText("");
      triggerToast("迭代优化成功！");
    } catch (e) {
      setErrorMessage((e as Error).message || "优化失败");
    } finally {
      setRefineLoading(false);
    }
  };

  const goToVersion = (idx: number) => {
    if (!currentSetting || idx < 0 || idx >= currentSetting.versions.length) return;
    setCurrentSetting({ ...currentSetting, content: currentSetting.versions[idx].content });
    setCurrentVersionIdx(idx);
  };

  const importToGYYG = () => {
    if (!currentSetting) return;
    const content = currentSetting.content;

    // 从 Markdown 内容中提取名字
    const extractName = (text: string): string => {
      // 尝试匹配 "姓名：XXX" 或 "姓名: XXX" 或 "**姓名**：XXX"
      const nameMatch = text.match(/(?:姓名|名字|Name)[:：]\s*[*_]*([^\n*_,，]+)/i);
      if (nameMatch && nameMatch[1]) return nameMatch[1].trim();

      // 尝试匹配 "我是XXX" 或 "叫XXX"
      const introMatch = text.match(/(?:我是|我叫|叫做|名叫)\s*([^\n,，。！？]+)/);
      if (introMatch && introMatch[1]) return introMatch[1].trim();

      // 默认使用提示词的前10个字符
      return currentSetting.prompt.slice(0, 10) || '未命名';
    };

    // 从内容中提取外貌描述作为生图提示词
    const extractImagePrompt = (text: string): string => {
      // 尝试提取外貌相关段落
      const appearanceMatch = text.match(/(?:外貌|appearance|外观|形象)[:：]?\s*([^\n#]+)/i);
      if (appearanceMatch && appearanceMatch[1]) {
        return appearanceMatch[1].trim().slice(0, 200);
      }

      // 提取基本信息部分的前100字作为描述
      const basicMatch = text.match(/##\s*1[\s\S]{0,300}/);
      if (basicMatch) {
        return basicMatch[0].replace(/##.*?\n/, '').trim().slice(0, 150);
      }

      return content.slice(0, 100).replace(/[#*\n]/g, ' ').trim();
    };

    // 提取签名（性格特点或一句话介绍）
    const extractSignature = (text: string): string => {
      const sigMatch = text.match(/(?:性格|个性|特点)[:：]?\s*([^\n]+)/i);
      if (sigMatch && sigMatch[1]) return sigMatch[1].trim().slice(0, 50);
      return content.replace(/[#*\n]/g, ' ').slice(0, 50).trim();
    };

    const extractedName = extractName(content);
    const imagePrompt = extractImagePrompt(content);
    const signature = extractSignature(content);

    if (currentSetting.type === "user_persona") {
      onAddUser({
        id: uid(),
        nickname: extractedName,
        signature: signature,
        persona: content, // 完整人设存入 persona 字段
        imagePromptTemplate: imagePrompt,
        isAlt: false,
        createdAt: Date.now()
      });
      triggerToast(`已导入用户「${extractedName}」！`);
    } else if (currentSetting.type === "xr_persona") {
      onAddCharacter({
        id: uid(),
        name: extractedName,
        avatar: "",
        signature: signature,
        persona: content, // 完整人设
        greeting: "你好！我是" + extractedName + "。",
        imagePromptTemplate: imagePrompt,
        createdAt: Date.now(),
      });
      triggerToast(`已导入角色「${extractedName}」！`);
    } else if (currentSetting.type === "worldbook") {
      const entries: WorldEntry[] = [{
        id: uid(),
        key: extractedName,
        content,
        priority: 5,
        ts: Date.now()
      }];
      onAddWorldEntries(entries);
      triggerToast(`已导入世界书「${extractedName}」！`);
    }
  };

  return (
    <AppScreen title="人设生成" icon="🔮" onBack={onBack}>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex border-b border-[var(--border)] mb-3 relative shrink-0">
          <button onClick={() => setActiveTab("create")} className={"flex-1 py-2.5 text-center text-[14px] font-medium relative transition-colors " + (activeTab === "create" ? "txt-accent" : "txt-faint")}>
            🔮 创建
            {activeTab === "create" && <div className="absolute bottom-0 inset-x-8 h-0.5 rounded-full" style={{ background: "var(--accent)" }} />}
          </button>
          <button onClick={() => setActiveTab("library")} className={"flex-1 py-2.5 text-center text-[14px] font-medium relative transition-colors " + (activeTab === "library" ? "txt-accent" : "txt-faint")}>
            📚 库 ({savedSettings.length})
            {activeTab === "library" && <div className="absolute bottom-0 inset-x-8 h-0.5 rounded-full" style={{ background: "var(--accent)" }} />}
          </button>
          <button onClick={() => setActiveTab("help")} className={"flex-1 py-2.5 text-center text-[14px] font-medium relative transition-colors " + (activeTab === "help" ? "txt-accent" : "txt-faint")}>
            ❓ 帮助
            {activeTab === "help" && <div className="absolute bottom-0 inset-x-8 h-0.5 rounded-full" style={{ background: "var(--accent)" }} />}
          </button>
        </div>

        {activeTab === "create" && (
          <div className="space-y-4 px-4 pb-4">
            <PersonaForm onSubmit={handleGenerate} loading={loading} />

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px]">{errorMessage}</div>
            )}

            {currentSetting && (
              <div className="mt-4 glass rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-[15px] font-semibold">{currentSetting.title}</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => copyToClipboard(currentSetting.content)} className="text-[11px] px-3 py-1 rounded-full glass txt-dim hover:txt-accent transition-colors">
                      {copied ? "✅ 已复制" : "📋 复制"}
                    </button>
                    <button onClick={importToGYYG} className="text-[11px] px-3 py-1 rounded-full font-medium text-white" style={{ background: "var(--accent)", color: "var(--bg)" }}>
                      📥 导入
                    </button>
                  </div>
                </div>

                {currentSetting.versions.length > 1 && (
                  <div className="flex items-center gap-2 text-[12px]">
                    <button onClick={() => goToVersion(currentVersionIdx - 1)} disabled={currentVersionIdx <= 0} className="tap txt-dim disabled:opacity-30"><ArrowLeft size={14} /></button>
                    <span className="txt-faint">v{currentVersionIdx + 1}/{currentSetting.versions.length}</span>
                    <button onClick={() => goToVersion(currentVersionIdx + 1)} disabled={currentVersionIdx >= currentSetting.versions.length - 1} className="tap txt-dim disabled:opacity-30"><ArrowRight size={14} /></button>
                  </div>
                )}

                <MarkdownRenderer content={currentSetting.content} onChangeContent={(newContent) => setCurrentSetting({ ...currentSetting, content: newContent })} />

                <div className="space-y-2">
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="输入反馈来迭代优化生成的设定..."
                    className="w-full h-20 glass rounded-xl px-3 py-2 text-[13px] outline-none bg-transparent resize-none"
                  />
                  <button onClick={handleRefine} disabled={refineLoading || !feedbackText.trim()} className="tap w-full h-10 rounded-full font-medium text-[13px] text-white disabled:opacity-40" style={{ background: "var(--accent)", color: "var(--bg)" }}>
                    {refineLoading ? "优化中..." : "🔄 反馈优化"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "library" && (
          <div className="px-4 pb-4">
            <SavedLibrary items={savedSettings} onSelectItem={(item) => { setCurrentSetting(item); setCurrentVersionIdx(item.versions.length - 1); setActiveTab("create"); }} onDeleteItem={(id) => updateSavedSettings(savedSettings.filter((s) => s.id !== id))} />
          </div>
        )}

        {activeTab === "help" && (
          <div className="px-4 pb-4 glass rounded-2xl p-4 text-[13px] txt-dim space-y-2">
            <div className="font-semibold txt-accent mb-2">使用说明</div>
            <div>1. 选择生成类型：用户人设、Char/AI伴侣虚拟人设、世界书</div>
            <div>2. 输入核心提示词/角色描述</div>
            <div>3. 调整期望生成字数（200-20000字）</div>
            <div>4. 可选填入风格、语调、自定义字段</div>
            <div>5. 点击生成按钮开始创建</div>
            <div>6. 生成后可以复制、导入到羊羊机，或发送反馈迭代优化</div>
            <div className="mt-3 txt-faint">使用您自己的 API（在「我的」设置）进行生成。</div>
          </div>
        )}
      </div>

      {successToast && (
        <div className="absolute bottom-20 inset-x-0 flex justify-center z-50 pointer-events-none">
          <div className="glass-strong rounded-full px-4 py-2 text-[13px] animate-fade-in flex items-center gap-2">
            <Sparkles size={14} className="txt-accent" /> {successToast}
          </div>
        </div>
      )}
    </AppScreen>
  );
}
