import { useEffect, useCallback, useState } from 'react';
import type { AppSettings } from './types';
import { shouldAutoRefresh, processAllAutoActions, type AutoActionResult } from './autoActions';

/**
 * 自动刷新Hook
 * 处理自动刷新和手动刷新逻辑
 */
export function useAutoRefresh(
  settings: AppSettings,
  onRefresh: (results: AutoActionResult[]) => void,
  onUpdateSettings: (updates: Partial<AppSettings>) => void
) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());

  /**
   * 手动刷新
   */
  const manualRefresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      const results = await processAllAutoActions(settings);
      onRefresh(results);
      setLastRefreshTime(Date.now());
      onUpdateSettings({ lastAutoRefreshTime: Date.now() });
    } catch (err) {
      console.error('手动刷新失败:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, settings, onRefresh, onUpdateSettings]);

  /**
   * 自动刷新检查
   */
  useEffect(() => {
    if (!settings.autoRefreshEnabled) return;

    const checkInterval = setInterval(() => {
      const now = Date.now();
      if (shouldAutoRefresh(settings, now) && !isRefreshing) {
        manualRefresh();
      }
    }, 10000); // 每10秒检查一次

    return () => clearInterval(checkInterval);
  }, [settings, settings.autoRefreshEnabled, isRefreshing, manualRefresh]);

  return {
    manualRefresh,
    isRefreshing,
    lastRefreshTime,
  };
}

/**
 * 刷新按钮组件
 */
export function RefreshButton({
  onRefresh,
  isRefreshing,
  autoEnabled,
}: {
  onRefresh: () => void;
  isRefreshing: boolean;
  autoEnabled: boolean;
}) {
  return (
    <button
      onClick={onRefresh}
      disabled={isRefreshing}
      className="tap relative"
      title={autoEnabled ? '手动刷新（已开启自动刷新）' : '手动刷新'}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isRefreshing ? 'animate-spin' : ''
        }`}
        style={{
          background: autoEnabled ? 'var(--accent)' : 'var(--surface)',
          color: autoEnabled ? 'white' : 'var(--text-accent)',
        }}
      >
        {isRefreshing ? '⟳' : '🔄'}
      </div>
      {autoEnabled && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--bg)]" />
      )}
    </button>
  );
}
