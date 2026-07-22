import { useState } from 'react';
import { ChefHat, Plus, Clock, TrendingUp, Star, Users, Camera } from 'lucide-react';
import { AppScreen } from '../components/AppScreen';
import { Modal } from '../components/Sheet';
import { uid } from '../utils';
import { askAIJson } from '../api';
import type { ApiConfig, Recipe, CookingRecord, Character } from '../types';

const SAMPLE_IMAGES = [
  'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=400',
];

const DIFFICULTY_LABELS = {
  easy: { text: '简单', color: '#10b981' },
  medium: { text: '中等', color: '#f59e0b' },
  hard: { text: '困难', color: '#ef4444' },
};

const SEED_RECIPES: Recipe[] = [
  { id: 'r1', name: '番茄炒蛋', ingredients: [{ name: '番茄', amount: '2个' }, { name: '鸡蛋', amount: '3个' }, { name: '盐', amount: '适量' }], steps: ['番茄切块，鸡蛋打散', '热锅炒鸡蛋至七成熟盛出', '炒番茄至软烂', '加入鸡蛋翻炒，加盐调味'], difficulty: 'easy', time: 15, category: '家常菜', image: SAMPLE_IMAGES[0] },
  { id: 'r2', name: '宫保鸡丁', ingredients: [{ name: '鸡胸肉', amount: '300g' }, { name: '花生米', amount: '50g' }, { name: '干辣椒', amount: '10个' }], steps: ['鸡肉切丁腌制', '调制宫保汁', '热油炒鸡丁至变色', '加入花生米和调料翻炒'], difficulty: 'medium', time: 25, category: '川菜', image: SAMPLE_IMAGES[1] },
];

export function KitchenScreen({
  api,
  characters,
  recipes,
  records,
  onChange,
  onChangeRecords,
  onBack,
}: {
  api: ApiConfig;
  characters: Character[];
  recipes: Recipe[];
  records: CookingRecord[];
  onChange: (r: Recipe[]) => void;
  onChangeRecords: (r: CookingRecord[]) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'recipes' | 'records'>('recipes');
  const [addingRecipe, setAddingRecipe] = useState(false);
  const [addingRecord, setAddingRecord] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [detail, setDetail] = useState<Recipe | null>(null);

  // 菜谱表单
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState('');
  const [difficulty, setDifficulty] = useState<Recipe['difficulty']>('easy');
  const [time, setTime] = useState('30');
  const [category, setCategory] = useState('');

  // 烹饪记录表单
  const [recipeId, setRecipeId] = useState('');
  const [cookId, setCookId] = useState('');
  const [result, setResult] = useState<CookingRecord['result']>('success');
  const [taste, setTaste] = useState(5);

  const allRecipes = recipes.length > 0 ? recipes : SEED_RECIPES;
  if (recipes.length === 0) onChange(SEED_RECIPES);

  const resetRecipeForm = () => {
    setName('');
    setIngredients('');
    setSteps('');
    setDifficulty('easy');
    setTime('30');
    setCategory('');
  };

  const addRecipe = () => {
    if (!name.trim() || !ingredients.trim() || !steps.trim()) return;
    const r: Recipe = {
      id: uid(),
      name: name.trim(),
      ingredients: ingredients.split('\n').filter(Boolean).map((line) => {
        const [n, a] = line.split(/[:：]/).map((s) => s.trim());
        return { name: n || line, amount: a || '适量' };
      }),
      steps: steps.split('\n').filter(Boolean),
      difficulty,
      time: parseInt(time) || 30,
      category: category.trim() || '自定义',
      image: SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)],
    };
    onChange([...allRecipes, r]);
    resetRecipeForm();
    setAddingRecipe(false);
  };

  const aiGenerate = async () => {
    setGenerating(true);
    try {
      const sys = '你在生成菜谱。返回JSON：{"name":"菜名","ingredients":[{"name":"食材","amount":"用量"}],"steps":["步骤1","步骤2"],"difficulty":"easy/medium/hard","time":30,"category":"分类"}';
      const data = await askAIJson<Recipe>(api, sys, '请生成一个家常菜谱：', { temperature: 0.8, maxTokens: 500 });
      const r: Recipe = {
        ...data,
        id: uid(),
        image: SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)],
      };
      onChange([...allRecipes, r]);
      setAddingRecipe(false);
    } catch (e) {
      alert(`AI生成失败：${(e as Error).message}`);
    } finally {
      setGenerating(false);
    }
  };

  const addRecord = () => {
    if (!recipeId || !cookId) return;
    const rec: CookingRecord = {
      id: uid(),
      recipeId,
      cookId,
      result,
      taste,
      ts: Date.now(),
    };
    onChangeRecords([...records, rec]);
    setRecipeId('');
    setCookId('');
    setResult('success');
    setTaste(5);
    setAddingRecord(false);
  };

  // 详情页
  if (detail) {
    const r = allRecipes.find((x) => x.id === detail.id) ?? detail;
    const diffInfo = DIFFICULTY_LABELS[r.difficulty];
    const recipeRecords = records.filter((rec) => rec.recipeId === r.id);
    return (
      <AppScreen title={r.name} onBack={() => setDetail(null)} noPad>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <img src={r.image} className="w-full h-48 object-cover" alt="" />
          <div className="px-4 py-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2.5 py-1 rounded-full text-[12px]" style={{ background: `${diffInfo.color}20`, color: diffInfo.color }}>{diffInfo.text}</span>
              <div className="flex items-center gap-1 text-[13px] txt-faint">
                <Clock size={14} />
                <span>{r.time}分钟</span>
              </div>
              <span className="text-[13px] txt-faint">{r.category}</span>
            </div>
            <div className="mb-4">
              <div className="text-[15px] font-medium mb-2">食材</div>
              <div className="glass rounded-xl p-3 space-y-1.5">
                {r.ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center justify-between text-[14px]">
                    <span className="txt-dim">{ing.name}</span>
                    <span className="txt-faint">{ing.amount}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <div className="text-[15px] font-medium mb-2">步骤</div>
              <div className="space-y-2">
                {r.steps.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[12px] font-medium txt-accent" style={{ background: 'var(--icon-bg-active)' }}>{i + 1}</div>
                    <div className="flex-1 text-[14px] txt-dim pt-0.5">{step}</div>
                  </div>
                ))}
              </div>
            </div>
            {recipeRecords.length > 0 && (
              <div>
                <div className="text-[15px] font-medium mb-2">烹饪记录 ({recipeRecords.length})</div>
                <div className="space-y-2">
                  {recipeRecords.slice(0, 3).map((rec) => {
                    const cook = characters.find((c) => c.id === rec.cookId);
                    return (
                      <div key={rec.id} className="glass rounded-xl p-3 flex items-center gap-3">
                        {cook?.avatar ? (
                          <img src={cook.avatar} className="w-9 h-9 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="w-9 h-9 rounded-full icon-bg flex items-center justify-center text-[13px] txt-accent">{cook?.name[0] || '?'}</div>
                        )}
                        <div className="flex-1">
                          <div className="text-[14px] font-medium">{cook?.name}</div>
                          <div className="text-[12px] txt-faint">{new Date(rec.ts).toLocaleDateString()}</div>
                        </div>
                        {rec.taste && (
                          <div className="flex items-center gap-0.5 text-[12px] txt-accent">
                            <Star size={12} fill="currentColor" />
                            <span>{rec.taste}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="px-4 py-3 border-t border-[var(--border)] shrink-0">
          <button onClick={() => { setRecipeId(r.id); setAddingRecord(true); setDetail(null); }} className="tap w-full h-11 rounded-full font-medium text-[var(--bg)]" style={{ background: 'var(--accent)' }}>
            开始烹饪
          </button>
        </div>
      </AppScreen>
    );
  }

  return (
    <AppScreen
      title="厨房"
      onBack={onBack}
      noPad
      right={
        <button onClick={() => (tab === 'recipes' ? setAddingRecipe(true) : setAddingRecord(true))} className="tap text-[var(--accent)]">
          <Plus size={22} />
        </button>
      }
    >
      {/* tabs */}
      <div className="px-4 pt-3 pb-2 border-b border-[var(--border)] flex gap-4 shrink-0">
        <button onClick={() => setTab('recipes')} className={`tap text-[15px] font-medium pb-2 relative ${tab === 'recipes' ? 'txt-accent' : 'txt-faint'}`}>
          菜谱
          {tab === 'recipes' && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: 'var(--accent)' }} />}
        </button>
        <button onClick={() => setTab('records')} className={`tap text-[15px] font-medium pb-2 relative ${tab === 'records' ? 'txt-accent' : 'txt-faint'}`}>
          记录
          {tab === 'records' && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: 'var(--accent)' }} />}
        </button>
      </div>

      {/* 菜谱Tab */}
      {tab === 'recipes' && (
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3">
          <div className="grid grid-cols-2 gap-3">
            {allRecipes.map((r) => {
              const diffInfo = DIFFICULTY_LABELS[r.difficulty];
              return (
                <div key={r.id} className="tap glass rounded-2xl overflow-hidden" onClick={() => setDetail(r)}>
                  <img src={r.image} className="w-full aspect-[4/3] object-cover" alt="" />
                  <div className="p-3">
                    <div className="text-[14px] font-medium mb-2 line-clamp-1">{r.name}</div>
                    <div className="flex items-center gap-2 text-[12px]">
                      <span className="px-2 py-0.5 rounded-full" style={{ background: `${diffInfo.color}20`, color: diffInfo.color }}>{diffInfo.text}</span>
                      <span className="txt-faint">{r.time}分</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 记录Tab */}
      {tab === 'records' && (
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3">
          {records.length === 0 ? (
            <div className="text-center txt-faint py-8">还没有烹饪记录</div>
          ) : (
            <div className="space-y-2">
              {records.sort((a, b) => b.ts - a.ts).map((rec) => {
                const recipe = allRecipes.find((r) => r.id === rec.recipeId);
                const cook = characters.find((c) => c.id === rec.cookId);
                return (
                  <div key={rec.id} className="glass rounded-2xl p-3 flex gap-3">
                    <img src={recipe?.image} className="w-16 h-16 rounded-xl object-cover" alt="" />
                    <div className="flex-1">
                      <div className="text-[14px] font-medium mb-1">{recipe?.name}</div>
                      <div className="flex items-center gap-2 text-[12px] txt-faint mb-1">
                        <ChefHat size={12} />
                        <span>{cook?.name}</span>
                      </div>
                      <div className="text-[11px] txt-faint">{new Date(rec.ts).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })}</div>
                    </div>
                    {rec.taste && (
                      <div className="flex flex-col items-end justify-center">
                        <div className="flex items-center gap-0.5 text-[13px] txt-accent mb-0.5">
                          <Star size={13} fill="currentColor" />
                          <span className="font-medium">{rec.taste}</span>
                        </div>
                        <div className="text-[10px] txt-faint">味道</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 添加菜谱模态框 */}
      <Modal open={addingRecipe} onClose={() => { setAddingRecipe(false); resetRecipeForm(); }} title="添加菜谱">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="菜名" className="w-full glass rounded-xl px-3 h-11 text-[14px] outline-none bg-transparent mb-3" autoFocus />
        <textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="食材（每行一个，格式：食材名：用量）" rows={3} className="w-full glass rounded-xl px-3 py-2.5 text-[14px] outline-none bg-transparent resize-none mb-3" />
        <textarea value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="步骤（每行一个）" rows={4} className="w-full glass rounded-xl px-3 py-2.5 text-[14px] outline-none bg-transparent resize-none mb-3" />
        <div className="flex gap-3 mb-3">
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Recipe['difficulty'])} className="flex-1 glass rounded-xl px-3 h-11 text-[14px] outline-none bg-transparent">
            <option value="easy">简单</option>
            <option value="medium">中等</option>
            <option value="hard">困难</option>
          </select>
          <input type="number" value={time} onChange={(e) => setTime(e.target.value)} placeholder="时间(分)" className="flex-1 glass rounded-xl px-3 h-11 text-[14px] outline-none bg-transparent" />
        </div>
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="分类（如：川菜、粤菜）" className="w-full glass rounded-xl px-3 h-11 text-[14px] outline-none bg-transparent mb-3" />
        <div className="flex gap-3">
          <button onClick={aiGenerate} disabled={generating} className="tap flex-1 h-11 rounded-full glass font-medium disabled:opacity-50">{generating ? '生成中…' : 'AI 生成'}</button>
          <button onClick={addRecipe} disabled={!name.trim() || !ingredients.trim() || !steps.trim()} className="tap flex-1 h-11 rounded-full font-medium text-[var(--bg)] disabled:opacity-50" style={{ background: 'var(--accent)' }}>添加</button>
        </div>
      </Modal>

      {/* 添加烹饪记录模态框 */}
      <Modal open={addingRecord} onClose={() => setAddingRecord(false)} title="烹饪记录">
        <select value={recipeId} onChange={(e) => setRecipeId(e.target.value)} className="w-full glass rounded-xl px-3 h-11 text-[14px] outline-none bg-transparent mb-3">
          <option value="">选择菜谱</option>
          {allRecipes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select value={cookId} onChange={(e) => setCookId(e.target.value)} className="w-full glass rounded-xl px-3 h-11 text-[14px] outline-none bg-transparent mb-3">
          <option value="">选择厨师</option>
          {characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={result} onChange={(e) => setResult(e.target.value as CookingRecord['result'])} className="w-full glass rounded-xl px-3 h-11 text-[14px] outline-none bg-transparent mb-3">
          <option value="success">大成功</option>
          <option value="normal">普通</option>
          <option value="failed">失败</option>
        </select>
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] txt-dim">味道评分</span>
            <span className="text-[14px] txt-accent font-medium">{taste}</span>
          </div>
          <input type="range" min="1" max="10" value={taste} onChange={(e) => setTaste(parseInt(e.target.value))} className="w-full" />
        </div>
        <button onClick={addRecord} disabled={!recipeId || !cookId} className="tap w-full h-11 rounded-full font-medium text-[var(--bg)] disabled:opacity-50" style={{ background: 'var(--accent)' }}>记录</button>
      </Modal>
    </AppScreen>
  );
}
