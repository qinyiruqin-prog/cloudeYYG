import { useState } from 'react';
import { AppScreen } from '../components/AppScreen';
import { ListGroup, Row } from '../components/ui';
import type { Character } from '../types';

interface AutoModeScreenProps {
  characters: Character[];
  onBack: () => void;
  onUpdateCharacter: (charId: string, updates: Partial<Character>) => void;
}

export function AutoModeScreen({
  characters,
  onBack,
  onUpdateCharacter,
}: AutoModeScreenProps) {
  const [selectedCharId, setSelectedCharId] = useState<string>('');

  const selectedChar = characters.find(c => c.id === selectedCharId);

  return (
    <AppScreen title="角色自动档" onBack={onBack}>
      {!selectedCharId ? (
        <>
          {/* 说明 */}
          <div className="mb-4 p-4 glass-strong rounded-2xl">
            <div className="text-[13px] font-medium mb-2 txt-accent">🤖 角色自动档</div>
            <div className="text-[12px] txt-faint space-y-1">
              <div>• 开启后，角色会主动发消息、朋友圈、图片等</div>
              <div>• 可以为每个角色单独设置</div>
              <div>• 自定义行为间隔和行为类型</div>
              <div>• 让角色更加真实和主动</div>
            </div>
          </div>

          {/* 角色列表 */}
          <div className="text-[13px] font-medium mb-2 txt-accent">选择角色</div>
          <ListGroup>
            {characters.map(char => (
              <Row
                key={char.id}
                icon={char.avatar || '👤'}
                label={char.name}
                hint={char.autoMode ? `自动档已开启 · ${char.autoModeInterval || 30}分钟` : '自动档未开启'}
                onClick={() => setSelectedCharId(char.id)}
                right={
                  char.autoMode ? (
                    <span className="text-green-400 text-[18px]">✓</span>
                  ) : (
                    <span className="text-[var(--text-faint)] text-[18px]">→</span>
                  )
                }
              />
            ))}
          </ListGroup>
        </>
      ) : (
        /* 角色设置 */
        <div className="space-y-4">
          <div className="p-4 glass-strong rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-[32px]">{selectedChar?.avatar || '👤'}</div>
              <div className="flex-1">
                <div className="text-[14px] txt-accent font-medium">
                  {selectedChar?.name}
                </div>
                <div className="text-[11px] txt-faint">
                  {selectedChar?.signature}
                </div>
              </div>
              <button
                onClick={() => setSelectedCharId('')}
                className="text-[12px] txt-faint tap"
              >
                返回
              </button>
            </div>
          </div>

          {/* 开关 */}
          <div className="p-4 glass-strong rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[14px] txt-accent font-medium mb-1">
                  开启自动档
                </div>
                <div className="text-[11px] txt-faint">
                  {selectedChar?.autoMode ? '角色会主动行动' : '角色不会主动行动'}
                </div>
              </div>
              <input
                type="checkbox"
                checked={selectedChar?.autoMode || false}
                onChange={(e) => {
                  if (selectedChar) {
                    onUpdateCharacter(selectedChar.id, {
                      autoMode: e.target.checked,
                      autoModeInterval: selectedChar.autoModeInterval || 30,
                      autoActions: selectedChar.autoActions || {
                        sendMessage: true,
                        sendMoment: true,
                        sendImage: true,
                        useSocial: true,
                        useApps: true,
                      },
                    });
                  }
                }}
                className="w-6 h-6 accent-[var(--accent)] cursor-pointer"
              />
            </div>
          </div>

          {selectedChar?.autoMode && (
            <>
              {/* 行为间隔 */}
              <div className="p-4 glass-strong rounded-2xl">
                <div className="text-[14px] txt-accent font-medium mb-3">
                  行为间隔：{selectedChar.autoModeInterval || 30}分钟
                </div>
                <input
                  type="range"
                  min="10"
                  max="360"
                  step="10"
                  value={selectedChar.autoModeInterval || 30}
                  onChange={(e) =>
                    onUpdateCharacter(selectedChar.id, {
                      autoModeInterval: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-[var(--surface)] rounded-full appearance-none cursor-pointer accent-[var(--accent)]"
                />
                <div className="flex justify-between text-[11px] txt-faint mt-2">
                  <span>10分钟</span>
                  <span>1小时</span>
                  <span>6小时</span>
                </div>
                <div className="text-[11px] txt-faint mt-2 text-center">
                  角色每隔这么长时间会执行一次随机行为
                </div>
              </div>

              {/* 行为类型 */}
              <div className="p-4 glass-strong rounded-2xl">
                <div className="text-[14px] txt-accent font-medium mb-3">
                  行为类型
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[20px]">💬</span>
                      <div>
                        <div className="text-[13px] txt-accent">主动发消息</div>
                        <div className="text-[10px] txt-faint">给你发聊天消息</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedChar.autoActions?.sendMessage !== false}
                      onChange={(e) =>
                        onUpdateCharacter(selectedChar.id, {
                          autoActions: {
                            ...selectedChar.autoActions,
                            sendMessage: e.target.checked,
                          },
                        })
                      }
                      className="w-5 h-5 accent-[var(--accent)] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[20px]">📷</span>
                      <div>
                        <div className="text-[13px] txt-accent">主动发朋友圈</div>
                        <div className="text-[10px] txt-faint">发布朋友圈动态</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedChar.autoActions?.sendMoment !== false}
                      onChange={(e) =>
                        onUpdateCharacter(selectedChar.id, {
                          autoActions: {
                            ...selectedChar.autoActions,
                            sendMoment: e.target.checked,
                          },
                        })
                      }
                      className="w-5 h-5 accent-[var(--accent)] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[20px]">🖼️</span>
                      <div>
                        <div className="text-[13px] txt-accent">主动发图片</div>
                        <div className="text-[10px] txt-faint">发送照片消息</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedChar.autoActions?.sendImage !== false}
                      onChange={(e) =>
                        onUpdateCharacter(selectedChar.id, {
                          autoActions: {
                            ...selectedChar.autoActions,
                            sendImage: e.target.checked,
                          },
                        })
                      }
                      className="w-5 h-5 accent-[var(--accent)] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[20px]">🌐</span>
                      <div>
                        <div className="text-[13px] txt-accent">使用社交平台</div>
                        <div className="text-[10px] txt-faint">微博、Twitter等</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedChar.autoActions?.useSocial !== false}
                      onChange={(e) =>
                        onUpdateCharacter(selectedChar.id, {
                          autoActions: {
                            ...selectedChar.autoActions,
                            useSocial: e.target.checked,
                          },
                        })
                      }
                      className="w-5 h-5 accent-[var(--accent)] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[20px]">📱</span>
                      <div>
                        <div className="text-[13px] txt-accent">使用其他应用</div>
                        <div className="text-[10px] txt-faint">外卖、购物等</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedChar.autoActions?.useApps !== false}
                      onChange={(e) =>
                        onUpdateCharacter(selectedChar.id, {
                          autoActions: {
                            ...selectedChar.autoActions,
                            useApps: e.target.checked,
                          },
                        })
                      }
                      className="w-5 h-5 accent-[var(--accent)] cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* 提示 */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
                <div className="text-[12px] txt-accent space-y-1">
                  <div>💡 <strong>提示：</strong></div>
                  <div>• 开启"自动刷新"后，角色会按设定间隔自动行动</div>
                  <div>• 也可以随时手动刷新，立即触发所有角色行动</div>
                  <div>• 手动刷新按钮在桌面右上角（🔄图标）</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </AppScreen>
  );
}
