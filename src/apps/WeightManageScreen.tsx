import { useState } from 'react';
import { Scale, Target, TrendingDown, TrendingUp, Plus, Calendar } from 'lucide-react';
import { AppScreen } from '../components/AppScreen';
import { Modal } from '../components/Sheet';
import { uid } from '../utils';
import type { WeightRecord, WeightGoal } from '../types';

const calculateBMI = (weight: number, height: number) => {
  const heightM = height / 100;
  return weight / (heightM * heightM);
};

const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return { text: '偏瘦', color: '#3b82f6' };
  if (bmi < 24) return { text: '正常', color: '#10b981' };
  if (bmi < 28) return { text: '偏胖', color: '#f59e0b' };
  return { text: '肥胖', color: '#ef4444' };
};

export function WeightManageScreen({
  records,
  goals,
  onChange,
  onChangeGoals,
  onBack,
}: {
  records: WeightRecord[];
  goals: WeightGoal[];
  onChange: (r: WeightRecord[]) => void;
  onChangeGoals: (g: WeightGoal[]) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'records' | 'goals'>('records');
  const [composing, setComposing] = useState(false);
  const [addingGoal, setAddingGoal] = useState(false);

  // 记录表单
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('170');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  // 目标表单
  const [targetWeight, setTargetWeight] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [motivation, setMotivation] = useState('');

  const sorted = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latest = sorted[0];
  const activeGoal = goals.find((g) => !g.achieved);

  const addRecord = () => {
    if (!weight.trim() || !height.trim()) return;
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return;

    const bmi = calculateBMI(w, h);
    const r: WeightRecord = {
      id: uid(),
      weight: w,
      height: h,
      bmi,
      date,
      note: note.trim() || undefined,
      ts: Date.now(),
    };
    onChange([...records, r]);
    setWeight('');
    setNote('');
    setComposing(false);

    // 检查是否达成目标
    if (activeGoal && w <= activeGoal.targetWeight) {
      onChangeGoals(goals.map((g) => g.id === activeGoal.id ? { ...g, achieved: true, achievedDate: date } : g));
      alert(`🎉 恭喜！你已达成目标体重 ${activeGoal.targetWeight}kg！`);
    }
  };

  const addGoal = () => {
    if (!targetWeight.trim() || !targetDate) return;
    const tw = parseFloat(targetWeight);
    if (isNaN(tw) || tw <= 0) return;

    const g: WeightGoal = {
      id: uid(),
      targetWeight: tw,
      targetDate,
      motivation: motivation.trim() || undefined,
      startWeight: latest?.weight,
      startDate: latest?.date || new Date().toISOString().split('T')[0],
      achieved: false,
      ts: Date.now(),
    };
    onChangeGoals([...goals, g]);
    setTargetWeight('');
    setTargetDate('');
    setMotivation('');
    setAddingGoal(false);
  };

  const progress = activeGoal && latest && activeGoal.startWeight
    ? Math.min(100, Math.max(0, ((activeGoal.startWeight - latest.weight) / (activeGoal.startWeight - activeGoal.targetWeight)) * 100))
    : 0;

  return (
    <AppScreen
      title="体重管理"
      onBack={onBack}
      noPad
      right={
        <button onClick={() => (tab === 'records' ? setComposing(true) : setAddingGoal(true))} className="tap text-[var(--accent)]">
          <Plus size={22} />
        </button>
      }
    >
      {/* tabs */}
      <div className="px-4 pt-3 pb-2 border-b border-[var(--border)] flex gap-4 shrink-0">
        <button onClick={() => setTab('records')} className={`tap text-[15px] font-medium pb-2 relative ${tab === 'records' ? 'txt-accent' : 'txt-faint'}`}>
          记录
          {tab === 'records' && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: 'var(--accent)' }} />}
        </button>
        <button onClick={() => setTab('goals')} className={`tap text-[15px] font-medium pb-2 relative ${tab === 'goals' ? 'txt-accent' : 'txt-faint'}`}>
          目标
          {tab === 'goals' && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: 'var(--accent)' }} />}
        </button>
      </div>

      {/* 记录Tab */}
      {tab === 'records' && (
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* 当前状态卡片 */}
          {latest && (
            <div className="px-4 py-4 border-b border-[var(--border)]">
              <div className="glass rounded-2xl p-4">
                <div className="text-[13px] txt-faint mb-2">当前体重</div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-[32px] font-bold txt-accent">{latest.weight}</span>
                  <span className="text-[16px] txt-dim">kg</span>
                </div>
                <div className="flex items-center gap-4 text-[13px]">
                  <div>
                    <span className="txt-faint">BMI：</span>
                    <span className="font-medium" style={{ color: getBMICategory(latest.bmi).color }}>{latest.bmi.toFixed(1)}</span>
                    <span className="ml-1 txt-faint">({getBMICategory(latest.bmi).text})</span>
                  </div>
                  <div className="txt-faint">{latest.date}</div>
                </div>
                {activeGoal && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between text-[13px] mb-2">
                      <span className="txt-faint">目标进度</span>
                      <span className="txt-accent font-medium">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--bg-elev)] overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'var(--accent)' }} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] txt-faint mt-1">
                      <span>目标 {activeGoal.targetWeight}kg</span>
                      <span>还需 {Math.max(0, latest.weight - activeGoal.targetWeight).toFixed(1)}kg</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 历史记录 */}
          <div className="px-4 py-3">
            <div className="text-[14px] font-medium mb-3">历史记录</div>
            {sorted.length === 0 ? (
              <div className="text-center txt-faint py-8">还没有记录，添加第一条吧</div>
            ) : (
              <div className="space-y-2">
                {sorted.map((r, i) => {
                  const prev = sorted[i + 1];
                  const diff = prev ? r.weight - prev.weight : 0;
                  return (
                    <div key={r.id} className="glass rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="txt-faint" />
                          <span className="text-[13px] txt-dim">{r.date}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-[18px] font-bold">{r.weight}</span>
                          <span className="text-[12px] txt-faint">kg</span>
                          {diff !== 0 && (
                            <span className={`text-[11px] ml-2 flex items-center gap-0.5 ${diff > 0 ? 'text-red-500' : 'text-green-500'}`}>
                              {diff > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                              {Math.abs(diff).toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-[12px] txt-faint">
                        BMI {r.bmi.toFixed(1)} · {getBMICategory(r.bmi).text}
                      </div>
                      {r.note && <div className="text-[13px] txt-dim mt-2">{r.note}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 目标Tab */}
      {tab === 'goals' && (
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4">
          {goals.length === 0 ? (
            <div className="text-center txt-faint py-8">还没有目标，设定一个吧</div>
          ) : (
            <div className="space-y-3">
              {goals.map((g) => {
                const isActive = !g.achieved;
                const daysLeft = g.targetDate ? Math.ceil((new Date(g.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
                return (
                  <div key={g.id} className={`glass rounded-2xl p-4 ${g.achieved ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Target size={18} className={g.achieved ? 'txt-faint' : 'txt-accent'} />
                        <span className="text-[15px] font-medium">{g.achieved ? '已完成' : '进行中'}</span>
                      </div>
                      {g.achieved && <span className="text-[12px] px-2 py-1 rounded-full bg-green-500/20 text-green-500">✓ 已达成</span>}
                    </div>
                    <div className="space-y-2 text-[14px]">
                      <div className="flex items-center justify-between">
                        <span className="txt-faint">目标体重</span>
                        <span className="font-bold txt-accent">{g.targetWeight} kg</span>
                      </div>
                      {g.startWeight && (
                        <div className="flex items-center justify-between">
                          <span className="txt-faint">起始体重</span>
                          <span className="txt-dim">{g.startWeight} kg</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="txt-faint">目标日期</span>
                        <span className="txt-dim">{g.targetDate}</span>
                      </div>
                      {isActive && daysLeft > 0 && (
                        <div className="text-[12px] txt-faint">还有 {daysLeft} 天</div>
                      )}
                      {g.achieved && g.achievedDate && (
                        <div className="text-[12px] text-green-500">于 {g.achievedDate} 达成</div>
                      )}
                    </div>
                    {g.motivation && (
                      <div className="mt-3 pt-3 border-t border-[var(--border)] text-[13px] txt-dim">
                        💪 {g.motivation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 添加记录模态框 */}
      <Modal open={composing} onClose={() => setComposing(false)} title="记录体重">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full glass rounded-xl px-3 h-11 text-[14px] outline-none bg-transparent mb-3"
        />
        <input
          type="number"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="体重 (kg)"
          className="w-full glass rounded-xl px-3 h-11 text-[14px] outline-none bg-transparent mb-3"
          autoFocus
        />
        <input
          type="number"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          placeholder="身高 (cm)"
          className="w-full glass rounded-xl px-3 h-11 text-[14px] outline-none bg-transparent mb-3"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="备注（选填）"
          rows={2}
          className="w-full glass rounded-xl px-3 py-2.5 text-[14px] outline-none bg-transparent resize-none mb-3"
        />
        <button onClick={addRecord} disabled={!weight.trim() || !height.trim()} className="tap w-full h-11 rounded-full font-medium text-[var(--bg)] disabled:opacity-50" style={{ background: 'var(--accent)' }}>
          添加
        </button>
      </Modal>

      {/* 添加目标模态框 */}
      <Modal open={addingGoal} onClose={() => setAddingGoal(false)} title="设定目标">
        <input
          type="number"
          step="0.1"
          value={targetWeight}
          onChange={(e) => setTargetWeight(e.target.value)}
          placeholder="目标体重 (kg)"
          className="w-full glass rounded-xl px-3 h-11 text-[14px] outline-none bg-transparent mb-3"
          autoFocus
        />
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="w-full glass rounded-xl px-3 h-11 text-[14px] outline-none bg-transparent mb-3"
        />
        <input
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          placeholder="动力/目标描述（选填）"
          className="w-full glass rounded-xl px-3 h-11 text-[14px] outline-none bg-transparent mb-3"
        />
        <button onClick={addGoal} disabled={!targetWeight.trim() || !targetDate} className="tap w-full h-11 rounded-full font-medium text-[var(--bg)] disabled:opacity-50" style={{ background: 'var(--accent)' }}>
          设定
        </button>
      </Modal>
    </AppScreen>
  );
}
