import React from 'react';
import { AppScreen } from '../components/AppScreen';
import { ListGroup, Row } from '../components/ui';
import { Clock, MapPin, Check } from 'lucide-react';
import type { AppSettings } from '../types';

const COUNTRIES = [
  { name: '中国 (China)', timezone: 'Asia/Shanghai' },
  { name: '美国 (USA)', timezone: 'America/New_York' },
  { name: '日本 (Japan)', timezone: 'Asia/Tokyo' },
  { name: '英国 (UK)', timezone: 'Europe/London' },
  { name: '法国 (France)', timezone: 'Europe/Paris' },
  { name: '德国 (Germany)', timezone: 'Europe/Berlin' },
  { name: '澳大利亚 (Australia)', timezone: 'Australia/Sydney' },
];

export function TimePerceptionScreen({
  settings,
  updateSettings,
  onBack,
}: {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  onBack: () => void;
}) {
  return (
    <AppScreen title="时间感知" onBack={onBack}>
      <div className="space-y-4 p-4">
        <ListGroup>
          <Row
            label="感知真实时间"
            icon={<Clock size={17} />}
            hint={settings.useRealTime !== false ? '开启' : '关闭'}
            right={
              <input
                type="checkbox"
                checked={settings.useRealTime !== false}
                onChange={(e) => updateSettings({ useRealTime: e.target.checked })}
                className="w-5 h-5 accent-[var(--accent)] cursor-pointer"
              />
            }
          />
        </ListGroup>

        {!settings.useRealTime && (
          <div className="space-y-3 p-4 glass rounded-xl border border-[var(--border)]">
            <label className="text-[12px] txt-dim block">自定义时间 (ISO格式)</label>
            <input
              type="datetime-local"
              value={settings.customTime || ''}
              onChange={(e) => updateSettings({ customTime: e.target.value })}
              className="w-full glass rounded-xl px-3 h-10 text-[13px] outline-none bg-transparent border border-[var(--border)]"
            />
          </div>
        )}

        <div className="text-[13px] font-medium mb-2 mt-4 txt-accent">地区时区</div>
        <ListGroup>
          {COUNTRIES.map((ct) => (
            <Row
              key={ct.name}
              label={ct.name}
              icon={<MapPin size={16} />}
              onClick={() => updateSettings({ timezone: ct.timezone })}
              right={settings.timezone === ct.timezone ? <Check size={16} className="text-[var(--accent)]" /> : null}
            />
          ))}
        </ListGroup>

        <div className="text-[11px] txt-faint mt-4 px-2 italic">
          开启“感知真实时间”后，AI 将自动获取所选地区的当前时间进行对话互动。关闭则使用你手动设定的自定义时间。
        </div>
      </div>
    </AppScreen>
  );
}
