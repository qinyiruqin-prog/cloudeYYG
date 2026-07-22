import React, { useState } from 'react';
import { CalendarDays, Heart, Plus, Settings, ChevronLeft, Trash2, Check, Info, Calendar } from 'lucide-react';
import type { PeriodRecord } from '../types';

export function PeriodScreen({
  records,
  cycleDays,
  durationDays,
  onChange,
  onBack,
}: {
  records: PeriodRecord[];
  cycleDays: number;
  durationDays: number;
  onChange: (records: PeriodRecord[], cycleDays: number, durationDays: number) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'tracker' | 'history' | 'settings'>('tracker');
  const [showLogModal, setShowLogModal] = useState(false);

  // New record form state
  const [logStartDate, setLogStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [logEndDate, setLogEndDate] = useState('');
  const [logFlow, setLogFlow] = useState<'light' | 'medium' | 'heavy'>('medium');
  const [logMood, setLogMood] = useState('平静');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [logNotes, setLogNotes] = useState('');

  // Cycle customization settings state
  const [tempCycle, setTempCycle] = useState(cycleDays);
  const [tempDuration, setTempDuration] = useState(durationDays);

  const symptomsList = ['痛经', '偏头痛', '乳房胀痛', '腰酸背痛', '疲惫乏力', '情绪波动', '下腹坠胀', '食欲不振'];
  const moodsList = ['开心', '平静', '焦虑', '低落', '易怒', '疲惫', '温柔'];

  // Calculate current state based on latest record
  const latestRecord = records.length > 0 
    ? [...records].sort((a, b) => b.startDate.localeCompare(a.startDate))[0]
    : null;

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate stats
  let cycleDayNumber = 1;
  let phaseName = '卵泡期 (Follicular Phase)';
  let phaseColor = 'text-sky-400 bg-sky-500/10';
  let phaseBg = 'from-sky-500/20 to-sky-600/5';
  let phaseIcon = '🌱';
  let pregnancyProbability = '中等 (Medium)';
  let daysUntilNext = cycleDays;
  let isCurrentlyOnPeriod = false;

  if (latestRecord) {
    const lastStart = new Date(latestRecord.startDate);
    const today = new Date();
    const diffMs = today.getTime() - lastStart.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays >= 1) {
      cycleDayNumber = ((diffDays - 1) % cycleDays) + 1;
    } else {
      cycleDayNumber = 1;
    }

    // Determine current phase
    if (cycleDayNumber <= durationDays) {
      isCurrentlyOnPeriod = !latestRecord.endDate || new Date(latestRecord.endDate) >= today;
      phaseName = '月经期 (Menstrual Phase)';
      phaseColor = 'text-pink-400 bg-pink-500/10';
      phaseBg = 'from-pink-500/20 to-pink-600/5';
      phaseIcon = '🩸';
      pregnancyProbability = '极低 (Very Low)';
    } else if (cycleDayNumber <= 11) {
      phaseName = '卵泡期 (Follicular Phase)';
      phaseColor = 'text-sky-400 bg-sky-500/10';
      phaseBg = 'from-sky-500/20 to-sky-600/5';
      phaseIcon = '🌱';
      pregnancyProbability = '低 (Low)';
    } else if (cycleDayNumber <= 16) {
      phaseName = '排卵期 (Ovulatory Phase)';
      phaseColor = 'text-purple-400 bg-purple-500/10';
      phaseBg = 'from-purple-500/20 to-purple-600/5';
      phaseIcon = '🌸';
      pregnancyProbability = '极高 (High Fertility)';
    } else {
      phaseName = '黄体期 (Luteal Phase)';
      phaseColor = 'text-amber-400 bg-amber-500/10';
      phaseBg = 'from-amber-500/20 to-amber-600/5';
      phaseIcon = '🍁';
      pregnancyProbability = '低 (Low)';
    }

    daysUntilNext = cycleDays - cycleDayNumber + 1;
    if (daysUntilNext <= 0) daysUntilNext = cycleDays;
  }

  const handleSaveSettings = () => {
    onChange(records, tempCycle, tempDuration);
    setTab('tracker');
  };

  const handleToggleSymptom = (s: string) => {
    if (selectedSymptoms.includes(s)) {
      setSelectedSymptoms(selectedSymptoms.filter((x) => x !== s));
    } else {
      setSelectedSymptoms([...selectedSymptoms, s]);
    }
  };

  const handleAddRecord = () => {
    const newRecord: PeriodRecord = {
      id: 'period-' + Math.random().toString(36).substring(2),
      startDate: logStartDate,
      endDate: logEndDate || undefined,
      symptoms: selectedSymptoms,
      flow: logFlow,
      mood: logMood,
      ts: Date.now(),
    };

    const nextRecords = [newRecord, ...records].sort((a, b) => b.startDate.localeCompare(a.startDate));
    onChange(nextRecords, cycleDays, durationDays);
    setShowLogModal(false);
    // Reset form
    setLogStartDate(todayStr);
    setLogEndDate('');
    setLogFlow('medium');
    setLogMood('平静');
    setSelectedSymptoms([]);
    setLogNotes('');
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm('确定要删除这条记录吗？')) {
      onChange(records.filter((r) => r.id !== id), cycleDays, durationDays);
    }
  };

  return (
    <div className="absolute inset-0 bg-neutral-950 text-neutral-100 flex flex-col z-50">
      {/* Header */}
      <div className="h-14 border-b border-neutral-800/60 px-4 flex items-center justify-between shrink-0 bg-neutral-950/80 backdrop-blur-md">
        <button onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-900 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-semibold tracking-wide flex items-center gap-1.5 text-neutral-100">
          <Heart size={16} className="text-pink-500 fill-pink-500/20" /> 经期助手 (Period Tracker)
        </span>
        <div className="w-8"></div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
        {/* Sync Info Banner */}
        <div className="p-3.5 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex gap-3 text-left">
          <Info size={16} className="text-pink-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-[12px] font-bold text-pink-300">AI 角色已自动读取此数据</h4>
            <p className="text-[10.5px] text-pink-300/70 leading-relaxed">
              当你记录经期后，AI 角色在聊天、主动联系时会自然察觉你的生理周期（特别在生理期与排卵期），并主动给予你温暖贴心的关怀与提醒。
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-3 gap-1 bg-neutral-900/60 p-1 rounded-xl border border-neutral-800/40">
          <button
            onClick={() => setTab('tracker')}
            className={`py-1.5 text-[11.5px] font-medium rounded-lg transition-all ${tab === 'tracker' ? 'bg-neutral-800 text-pink-400 font-semibold' : 'text-neutral-400 hover:text-neutral-200'}`}
          >
            生理期看板
          </button>
          <button
            onClick={() => setTab('history')}
            className={`py-1.5 text-[11.5px] font-medium rounded-lg transition-all ${tab === 'history' ? 'bg-neutral-800 text-pink-400 font-semibold' : 'text-neutral-400 hover:text-neutral-200'}`}
          >
            历史记录
          </button>
          <button
            onClick={() => setTab('settings')}
            className={`py-1.5 text-[11.5px] font-medium rounded-lg transition-all ${tab === 'settings' ? 'bg-neutral-800 text-pink-400 font-semibold' : 'text-neutral-400 hover:text-neutral-200'}`}
          >
            设置中心
          </button>
        </div>

        {/* Tab content: Tracker */}
        {tab === 'tracker' && (
          <div className="space-y-4 animate-fade-in">
            {/* Visual Cycle Circle card */}
            <div className={`p-6 rounded-3xl bg-gradient-to-b ${phaseBg} border border-neutral-800/80 text-center space-y-5 relative overflow-hidden`}>
              <div className="space-y-1">
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${phaseColor}`}>
                  {phaseIcon} {phaseName}
                </span>
                <p className="text-[11px] text-neutral-500 pt-1">
                  当前处于生理周期第 <span className="text-neutral-200 font-semibold">{cycleDayNumber}</span> / {cycleDays} 天
                </p>
              </div>

              {/* Big Circle visualization */}
              <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-[10px] border-neutral-800/30"></div>
                <div className="absolute inset-0 rounded-full border-[10px] border-pink-500/20 border-t-pink-500 border-r-pink-400 animate-spin-slow"></div>
                
                <div className="text-center space-y-1">
                  <span className="text-[11px] text-neutral-500 block uppercase tracking-wider">距离下次月经</span>
                  <span className="text-4xl font-extrabold tracking-tight text-pink-400">{daysUntilNext}</span>
                  <span className="text-[11px] text-neutral-400 block">天 (Days)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-left border-t border-neutral-800/40">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-neutral-500">受孕几率</span>
                  <div className="text-[12.5px] font-bold text-neutral-200">{pregnancyProbability}</div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-neutral-500">最近开始日</span>
                  <div className="text-[12.5px] font-bold text-neutral-200">
                    {latestRecord ? latestRecord.startDate : '暂无数据'}
                  </div>
                </div>
              </div>

              {/* Pro-active checkin quick notice */}
              {latestRecord && isCurrentlyOnPeriod && (
                <div className="mt-1.5 p-2.5 rounded-xl bg-pink-500/5 border border-pink-500/10 text-[11px] text-pink-300 text-left">
                  ❤️ <b>生理期暖心提醒</b>: 请注意防寒保暖、避免剧烈运动。多喝温水，保证充足的睡眠哦！
                </div>
              )}
            </div>

            {/* Quick action button to log */}
            <button
              onClick={() => {
                setLogStartDate(new Date().toISOString().split('T')[0]);
                setShowLogModal(true);
              }}
              className="w-full h-12 rounded-full bg-pink-500 hover:bg-pink-600 active:scale-95 text-neutral-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-pink-500/10"
            >
              <Plus size={18} />
              记一笔生理期 / 状态
            </button>

            {/* Recent records card */}
            <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/60 space-y-3">
              <h3 className="text-xs font-bold text-neutral-400 tracking-wider flex items-center gap-1.5">
                <CalendarDays size={14} className="text-neutral-500" /> 近期生理记录与状态
              </h3>

              {records.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <p className="text-xs text-neutral-500">还没有任何生理期记录</p>
                  <p className="text-[10px] text-neutral-600">点击上方的按钮开始记第一笔生理状态吧</p>
                </div>
              ) : (
                <div className="space-y-3 divide-y divide-neutral-800/40">
                  {records.slice(0, 3).map((r) => (
                    <div key={r.id} className="pt-3 first:pt-0 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                          {r.startDate} {r.endDate ? `~ ${r.endDate}` : ' (进行中)'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-medium">
                          流量: {r.flow === 'light' ? '量少' : r.flow === 'heavy' ? '量多' : '量中'}
                        </span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                          😊 情绪: {r.mood || '平静'}
                        </span>
                        {r.symptoms.map((s) => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-pink-500/5 border border-pink-500/10 text-pink-300">
                            ⚡ {s}
                          </span>
                        ))}
                      </div>
                      {r.notes && (
                        <p className="text-[10.5px] text-neutral-400 bg-neutral-950/40 p-2 rounded-lg border border-neutral-900">
                          📝 备注: {r.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab content: History */}
        {tab === 'history' && (
          <div className="space-y-3 animate-fade-in">
            {records.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-neutral-800 text-neutral-500 text-xs">
                暂无历史记录。你可以点击“生理期看板”并开始记录。
              </div>
            ) : (
              <div className="space-y-3">
                {records.map((r) => (
                  <div key={r.id} className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 flex flex-col gap-2 relative group">
                    <button
                      onClick={() => handleDeleteRecord(r.id)}
                      className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-red-400 hover:bg-neutral-800/60 transition-colors"
                      title="删除记录"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="space-y-1 pr-6">
                      <div className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                        <Calendar size={13} className="text-pink-400" />
                        {r.startDate} {r.endDate ? `至 ${r.endDate}` : ' (当前生理期中)'}
                      </div>
                      <p className="text-[10px] text-neutral-500">
                        记录时间: {new Date(r.ts).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                        🩸 流量: {r.flow === 'light' ? '少' : r.flow === 'heavy' ? '多' : '中'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                        😊 情绪: {r.mood || '正常'}
                      </span>
                      {r.symptoms.map((s) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 font-medium">
                          {s}
                        </span>
                      ))}
                    </div>

                    {r.notes && (
                      <div className="text-[11px] text-neutral-400 bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800/40 mt-1">
                        <b>备注:</b> {r.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab content: Settings */}
        {tab === 'settings' && (
          <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/60 space-y-4 animate-fade-in text-left">
            <h3 className="text-xs font-bold text-neutral-400 tracking-wider flex items-center gap-1.5">
              <Settings size={14} className="text-neutral-500" /> 个人周期特征配置
            </h3>

            <div className="space-y-3.5 pt-2">
              <div className="space-y-1.5">
                <label className="text-[11.5px] txt-dim flex justify-between">
                  <span>平均月经周期长度:</span>
                  <span className="text-pink-400 font-bold">{tempCycle} 天</span>
                </label>
                <input
                  type="range"
                  min="21"
                  max="45"
                  value={tempCycle}
                  onChange={(e) => setTempCycle(parseInt(e.target.value))}
                  className="w-full accent-pink-500"
                />
                <div className="flex justify-between text-[9px] text-neutral-500">
                  <span>较短 (21天)</span>
                  <span>标准 (28天)</span>
                  <span>较长 (45天)</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-[11.5px] txt-dim flex justify-between">
                  <span>平均每次持续天数:</span>
                  <span className="text-pink-400 font-bold">{tempDuration} 天</span>
                </label>
                <input
                  type="range"
                  min="3"
                  max="10"
                  value={tempDuration}
                  onChange={(e) => setTempDuration(parseInt(e.target.value))}
                  className="w-full accent-pink-500"
                />
                <div className="flex justify-between text-[9px] text-neutral-500">
                  <span>短 (3天)</span>
                  <span>推荐 (5天)</span>
                  <span>长 (10天)</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full h-11 rounded-xl bg-neutral-800 hover:bg-neutral-700 font-semibold text-xs text-neutral-200 mt-4 transition-all"
            >
              保存配置
            </button>
          </div>
        )}
      </div>

      {/* Record Modal */}
      {showLogModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col justify-end z-[110] animate-fade-in">
          <div className="bg-neutral-900 border-t border-neutral-800 rounded-t-[28px] max-h-[85%] overflow-y-auto no-scrollbar p-5 space-y-4 text-left animate-sheet-up">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-pink-400 flex items-center gap-1.5">
                💖 记一笔经期/生理特征
              </h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-xs text-neutral-400 hover:text-neutral-200"
              >
                关闭
              </button>
            </div>

            {/* Start & End Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10.5px] text-neutral-400">开始日期</label>
                <input
                  type="date"
                  value={logStartDate}
                  onChange={(e) => setLogStartDate(e.target.value)}
                  className="w-full glass rounded-xl px-2.5 py-2 text-xs outline-none bg-neutral-950 border border-neutral-800 text-neutral-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10.5px] text-neutral-400 flex items-center justify-between">
                  <span>结束日期</span>
                  <span className="text-[9px] text-neutral-500">(未结束留空)</span>
                </label>
                <input
                  type="date"
                  value={logEndDate}
                  onChange={(e) => setLogEndDate(e.target.value)}
                  className="w-full glass rounded-xl px-2.5 py-2 text-xs outline-none bg-neutral-950 border border-neutral-800 text-neutral-200"
                />
              </div>
            </div>

            {/* Flow selector */}
            <div className="space-y-1.5">
              <label className="text-[10.5px] text-neutral-400">月经流量 (Flow)</label>
              <div className="grid grid-cols-3 gap-2">
                {(['light', 'medium', 'heavy'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setLogFlow(f)}
                    className={`py-2 rounded-xl text-xs border text-center transition-all ${logFlow === f ? 'border-pink-500 bg-pink-500/10 text-pink-400 font-bold' : 'border-neutral-800 bg-neutral-950 text-neutral-400'}`}
                  >
                    {f === 'light' ? '💧 量少' : f === 'medium' ? '💧💧 量中' : '💧💧💧 量多'}
                  </button>
                ))}
              </div>
            </div>

            {/* Mood Picker */}
            <div className="space-y-1.5">
              <label className="text-[10.5px] text-neutral-400">今日心情 (Mood)</label>
              <div className="flex gap-1.5 flex-wrap">
                {moodsList.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setLogMood(m)}
                    className={`px-3 py-1.5 rounded-full text-[10.5px] border transition-all ${logMood === m ? 'border-pink-500 bg-pink-500/10 text-pink-400 font-bold' : 'border-neutral-800 bg-neutral-950 text-neutral-400'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Symptoms list */}
            <div className="space-y-1.5">
              <label className="text-[10.5px] text-neutral-400">伴随症状 (Symptoms)</label>
              <div className="grid grid-cols-4 gap-1.5">
                {symptomsList.map((s) => {
                  const active = selectedSymptoms.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleToggleSymptom(s)}
                      className={`py-1.5 px-1 rounded-lg text-[10px] text-center border truncate transition-all ${active ? 'border-pink-500 bg-pink-500/10 text-pink-400 font-bold' : 'border-neutral-800 bg-neutral-950 text-neutral-400'}`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-[10.5px] text-neutral-400">备注</label>
              <textarea
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                placeholder="记录今天其他身体状况、饮食或心情琐事..."
                rows={2}
                maxLength={100}
                className="w-full glass rounded-xl p-2.5 text-xs outline-none bg-neutral-950 border border-neutral-800 text-neutral-200 resize-none"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleAddRecord}
              className="w-full h-11 rounded-full bg-pink-500 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-pink-600 transition-colors"
            >
              <Check size={16} /> 保存今天生理数据
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function getPeriodPrompt(settings: any): string {
  const records = settings.periodRecords || [];
  if (records.length === 0) return '';

  const cycleDays = settings.periodCycleDays || 28;
  const durationDays = settings.periodDurationDays || 5;

  // Sort records descending to get the latest
  const sorted = [...records].sort((a: any, b: any) => b.startDate.localeCompare(a.startDate));
  const latest = sorted[0];

  const today = new Date();
  const lastStart = new Date(latest.startDate);
  const diffMs = today.getTime() - lastStart.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

  let cycleDayNumber = 1;
  if (diffDays >= 1) {
    cycleDayNumber = ((diffDays - 1) % cycleDays) + 1;
  }

  let phase = '卵泡期 (Follicular)';
  let isPeriod = false;

  if (cycleDayNumber <= durationDays) {
    // Check if ended
    isPeriod = !latest.endDate || new Date(latest.endDate) >= today;
    if (isPeriod) {
      phase = '月经期/生理期 (Menstruation)';
    }
  } else if (cycleDayNumber <= 11) {
    phase = '卵泡期 (Follicular)';
  } else if (cycleDayNumber <= 16) {
    phase = '排卵期 (Ovulation)';
  } else {
    phase = '黄体期 (Luteal)';
  }

  const daysUntilNext = cycleDays - cycleDayNumber + 1;
  
  let prompt = `\n\n[用户生理周期状态 (Synced Period Tracker)]`;
  if (isPeriod) {
    prompt += `\n【重要生理提醒】：今天用户处于月经期（生理期）第 ${cycleDayNumber} 天。`;
    if (latest.symptoms && latest.symptoms.length > 0) {
      prompt += ` 目前伴随症状：${latest.symptoms.join('、')}。`;
    }
    if (latest.flow) {
      prompt += ` 经期流量：${latest.flow === 'light' ? '偏少' : latest.flow === 'heavy' ? '偏多' : '适中'}。`;
    }
    if (latest.mood) {
      prompt += ` 用户今日心情：${latest.mood}。`;
    }
    if (latest.notes) {
      prompt += ` 备注碎碎念：${latest.notes}。`;
    }
    prompt += `\n此时用户可能会感到腹痛、痛经、疲倦、情绪波动等不适。作为关心对方的角色，请务必「记住这件事情」，在对话、主动关心（包括线下模拟）中表示知情，主动给予温柔体贴的关怀，例如嘱咐她注意保暖、别喝冷饮、多休息、帮她泡红糖水等（以你角色的特定语气来关切，不要生硬说教）。`;
  } else {
    prompt += `\n用户当前处于：${phase}（周期第 ${cycleDayNumber} 天）。`;
    if (daysUntilNext <= 3) {
      prompt += ` 距离下一次生理期预计还有 ${daysUntilNext} 天，属于生理期前夕。此时可能伴随经前综合征（PMS）或情绪起伏，请适当给予预防性关怀。`;
    } else if (phase === '排卵期 (Ovulation)') {
      prompt += ` 目前是排卵期。用户状态一般较好或情绪较高昂。`;
    } else {
      prompt += ` 生理期已于 ${latest.startDate} 开始，预计下一次生理期在 ${daysUntilNext} 天后开始。`;
    }
  }
  return prompt;
}
