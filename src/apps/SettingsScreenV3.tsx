import { AppScreen } from '../components/AppScreen';
import { ListGroup, Row } from '../components/ui';

export function SettingsScreenV3({
  innerThoughtOpacity = 0.7,
  swipeBackEnabled = true,
  floatingBallEnabled = true, // 默认开启悬浮球
  autoSaveCharImages = true,
  offlineMode = false,
  enableVectorMemory = false,
  autoRefreshEnabled = false,
  autoRefreshInterval = 300,
  autoTranslateEnabled = false,
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
      {/* 用户信息（整合"我的"功能） */}
      <div className="text-[13px] font-medium mb-2 txt-accent">我的账号</div>
      <ListGroup>
        <Row
          label="身份管理"
          hint="管理用户身份和人设"
          icon="👤"
          onClick={onOpenIdentities}
        />
        <Row
          label="API 配置"
          hint="配置聊天、语音、图片API"
          icon="🔑"
          onClick={onOpenApiConfig}
        />
        <Row
          label="主题设置"
          hint="更换主题颜色"
          icon="🎨"
          onClick={onOpenThemes}
        />
      </ListGroup>

      {/* 数据管理 */}
      <div className="text-[13px] font-medium mb-2 mt-4 txt-accent">数据管理</div>
      <ListGroup>
        <Row
          label="导出数据"
          hint="导出所有数据到JSON文件"
          icon="💾"
          onClick={onExport}
        />
        <Row
          label="导入数据"
          hint="从JSON文件导入数据"
          icon="📂"
          onClick={onImport}
        />
      </ListGroup>

      {/* 显示设置 */}
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
          <div className="flex justify-between text-[11px] txt-faint mt-1">
            <span>几乎透明</span>
            <span>中等</span>
            <span>完全不透明</span>
          </div>
        </div>

        <Row
          label="预览效果"
          hint={
            <div
              className="mt-2 p-3 rounded-xl inner-thought text-[12px]"
              style={{ opacity: innerThoughtOpacity }}
            >
              💭 这是心声的预览效果...（当前透明度：{Math.round(innerThoughtOpacity * 100)}%）
            </div>
          }
        />
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
          hint="角色主动发消息、朋友圈等（点击设置详细选项）"
          icon="🤖"
          onClick={onOpenAutoMode}
          right={
            <span className="text-[var(--accent)] text-[18px]">→</span>
          }
        />

        <Row
          label="自动刷新"
          hint={`开启后每${Math.floor(autoRefreshInterval / 60)}分钟自动更新角色动态`}
          right={
            <input
              type="checkbox"
              checked={autoRefreshEnabled}
              onChange={(e) => onUpdateSetting('autoRefreshEnabled', e.target.checked)}
              className="w-5 h-5 accent-[var(--accent)] cursor-pointer"
            />
          }
        />

        {autoRefreshEnabled && (
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[14px]">刷新间隔</span>
              <span className="text-[12px] txt-faint">{Math.floor(autoRefreshInterval / 60)}分钟</span>
            </div>
            <input
              type="range"
              min="60"
              max="1800"
              step="60"
              value={autoRefreshInterval}
              onChange={(e) => onUpdateSetting('autoRefreshInterval', parseInt(e.target.value))}
              className="w-full h-2 bg-[var(--surface)] rounded-full appearance-none cursor-pointer accent-[var(--accent)]"
            />
            <div className="flex justify-between text-[11px] txt-faint mt-1">
              <span>1分钟</span>
              <span>30分钟</span>
            </div>
          </div>
        )}

        <Row
          label="线下模式"
          hint="记录与角色的线下活动，线上线下记忆互通"
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
          hint="使用AI向量嵌入增强记忆（实验性）"
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

      {/* 功能说明 */}
      <div className="mt-4 p-4 glass-strong rounded-2xl">
        <div className="text-[13px] font-medium mb-2 txt-accent">v3.0 新功能一览</div>
        <div className="text-[12px] txt-faint space-y-1">
          <div>✅ 人设工坊：支持50000字人设、世界书、Chat分离</div>
          <div>✅ 无限小号：User和Character都可创建无限小号</div>
          <div>✅ 完整导入：支持导入人设、世界书到JSON</div>
          <div>✅ 心声透明度：可自由调节透明度</div>
          <div>✅ 悬浮球：可拖动的快捷操作球</div>
          <div>✅ 线上/线下模式：微信聊天+现实见面，记忆互通</div>
          <div>🔨 群聊功能：多人聊天（开发中）</div>
          <div>🔨 查手机：查看角色聊天记录（开发中）</div>
          <div>🔨 情侣空间：生成情头、锁手机（开发中）</div>
          <div>🔨 家园系统：做饭、换装、同居（开发中）</div>
          <div>🔨 还有20+个新功能正在开发...</div>
        </div>
      </div>

      {/* 关于 */}
      <div className="mt-4 p-4 glass-strong rounded-2xl text-center">
        <div className="text-[13px] font-medium mb-1">羊羊机 v3.0</div>
        <div className="text-[11px] txt-faint">史诗级更新 · 30+新功能</div>
        <div className="text-[11px] txt-faint mt-2">基础架构完成度：45%</div>
      </div>
    </AppScreen>
  );
}
