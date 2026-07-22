import { AppScreen } from '../components/AppScreen';
import { ListGroup, Row } from '../components/ui';

export function SettingsScreenV3({
  innerThoughtOpacity = 0.7,
  swipeBackEnabled = true,
  floatingBallEnabled = true,
  autoSaveCharImages = true,
  offlineMode = false,
  enableVectorMemory = false,
  autoRefreshEnabled = false,
  autoRefreshInterval = 300,
  autoTranslateEnabled = false,
  useRealTime = true,
  customTime = '',
  onUpdateSetting,
  onBack,
  onOpenIdentities,
  onOpenApiConfig,
  onOpenThemes,
  onExport,
  onImport,
  onOpenAutoMode,
}: {
  innerThoughtOpacity?: number;
  swipeBackEnabled?: boolean;
  floatingBallEnabled?: boolean;
  autoSaveCharImages?: boolean;
  offlineMode?: boolean;
  enableVectorMemory?: boolean;
  autoRefreshEnabled?: boolean;
  autoRefreshInterval?: number;
  autoTranslateEnabled?: boolean;
  useRealTime?: boolean;
  customTime?: string;
  onUpdateSetting: (key: string, value: any) => void;
  onBack: () => void;
  onOpenIdentities?: () => void;
  onOpenApiConfig?: () => void;
  onOpenThemes?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onOpenAutoMode?: () => void;
}) {
  return (
    <AppScreen title="设置" onBack={onBack}>
      {/* 1. 时间感知设置 */}
      <div className="text-[13px] font-medium mb-2 mt-4 txt-accent">时间感知设置</div>
      <ListGroup>
        <Row
          label="时间感知"
          hint="开启后角色将能感知当前日期与时间"
          right={
            <input
              type="checkbox"
              checked={useRealTime}
              onChange={(e) => onUpdateSetting('useRealTime', e.target.checked)}
              className="w-5 h-5 accent-[var(--accent)] cursor-pointer"
            />
          }
        />
        {!useRealTime && (
          <div className="px-4 py-3">
            <label className="text-[12px] txt-dim block mb-2">自定义时间 (ISO格式)</label>
            <input
              type="datetime-local"
              value={customTime}
              onChange={(e) => onUpdateSetting('customTime', e.target.value)}
              className="w-full glass rounded-xl px-3 h-10 text-[13px] outline-none bg-transparent"
            />
          </div>
        )}
      </ListGroup>

      {/* 2. 用户信息 */}
      <div className="text-[13px] font-medium mb-2 mt-4 txt-accent">我的账号</div>
      <ListGroup>
        <Row label="身份管理" hint="管理用户身份和人设" icon="👤" onClick={onOpenIdentities} />
        <Row label="API 配置" hint="配置聊天、语音、图片API" icon="🔑" onClick={onOpenApiConfig} />
        <Row label="主题设置" hint="更换主题颜色" icon="🎨" onClick={onOpenThemes} />
      </ListGroup>

      {/* 3. 数据管理 */}
      <div className="text-[13px] font-medium mb-2 mt-4 txt-accent">数据管理</div>
      <ListGroup>
        <Row label="导出数据" hint="导出所有数据到JSON文件" icon="💾" onClick={onExport} />
        <Row label="导入数据" hint="从JSON文件导入数据" icon="📂" onClick={onImport} />
      </ListGroup>

      {/* 4. 显示设置 */}
      <div className="text-[13px] font-medium mb-2 mt-4 txt-accent">显示设置</div>
      <ListGroup>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px]">心声透明度</span>
            <span className="text-[12px] txt-faint">{Math.round(innerThoughtOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={innerThoughtOpacity}
            onChange={(e) => onUpdateSetting('innerThoughtOpacity', parseFloat(e.target.value))}
            className="w-full h-2 bg-[var(--surface)] rounded-full appearance-none cursor-pointer accent-[var(--accent)]"
          />
        </div>
        <Row label="预览效果" hint={<div className="mt-2 p-3 rounded-xl inner-thought text-[12px]" style={{ opacity: innerThoughtOpacity }}>💭 心声预览...</div>} />
      </ListGroup>

      {/* 聊天设置 */}
      <div className="text-[13px] font-medium mb-2 mt-4 txt-accent">聊天设置</div>
      <ListGroup>
        <Row
          label="自动翻译"
          hint="AI回复外语时自动翻译成中文"
          right={
            <input
              type="checkbox"
              checked={autoTranslateEnabled}
              onChange={(e) => onUpdateSetting('autoTranslateEnabled', e.target.checked)}
              className="w-5 h-5 accent-[var(--accent)] cursor-pointer"
            />
          }
        />
        <Row
          label="自动保存角色图片"
          hint="角色发送的图片自动加入相册"
          right={
            <input
              type="checkbox"
              checked={autoSaveCharImages}
              onChange={(e) => onUpdateSetting('autoSaveCharImages', e.target.checked)}
              className="w-5 h-5 accent-[var(--accent)] cursor-pointer"
            />
          }
        />
      </ListGroup>

      {/* 交互设置 */}
      <div className="text-[13px] font-medium mb-2 mt-4 txt-accent">交互设置</div>
      <ListGroup>
        <Row
          label="侧边滑动返回"
          hint="从屏幕左侧滑动返回上一页"
          right={
            <input
              type="checkbox"
              checked={swipeBackEnabled}
              onChange={(e) => onUpdateSetting('swipeBackEnabled', e.target.checked)}
              className="w-5 h-5 accent-[var(--accent)] cursor-pointer"
            />
          }
        />
        <Row
          label="悬浮球"
          hint="显示快捷操作悬浮球"
          right={
            <input
              type="checkbox"
              checked={floatingBallEnabled}
              onChange={(e) => onUpdateSetting('floatingBallEnabled', e.target.checked)}
              className="w-5 h-5 accent-[var(--accent)] cursor-pointer"
            />
          }
        />
      </ListGroup>

      {/* 高级功能 */}
      <div className="text-[13px] font-medium mb-2 mt-4 txt-accent">高级功能</div>
      <ListGroup>
        <Row
          label="角色自动档"
          hint="角色主动发消息、朋友圈等"
          icon="🤖"
          onClick={onOpenAutoMode}
          right={<span className="text-[var(--accent)] text-[18px]">→</span>}
        />
        <Row
          label="线下模式"
          hint="记录与角色的线下活动"
          right={
            <input
              type="checkbox"
              checked={offlineMode}
              onChange={(e) => onUpdateSetting('offlineMode', e.target.checked)}
              className="w-5 h-5 accent-[var(--accent)] cursor-pointer"
            />
          }
        />
        <Row
          label="向量记忆系统"
          hint="使用AI向量嵌入增强记忆"
          right={
            <input
              type="checkbox"
              checked={enableVectorMemory}
              onChange={(e) => onUpdateSetting('enableVectorMemory', e.target.checked)}
              className="w-5 h-5 accent-[var(--accent)] cursor-pointer"
            />
          }
        />
      </ListGroup>
      <div className="h-20" />
    </AppScreen>
  );
}