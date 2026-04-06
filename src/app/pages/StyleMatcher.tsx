import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { ClothingItem, ColorGroup, StyleTag } from '../data/items';
import { Zap, Star, ChevronDown, RefreshCw, X, Check } from 'lucide-react';
import { VoltSignature } from '../components/VoltSignature';

// ——— VYBE SCORE ENGINE ———
interface ScoreBreakdown {
  colorHarmony: number;
  styleSync: number;
  categoryBalance: number;
  vibeFactor: number;
  total: number;
  grade: string;
  gradeColor: string;
  gradeBg: string;
  tips: string[];
}

const COLOR_HARMONY: Record<ColorGroup, ColorGroup[]> = {
  vibrant: ['dark', 'neutral'],
  dark: ['vibrant', 'neutral', 'cool'],
  neutral: ['vibrant', 'warm', 'cool', 'dark'],
  warm: ['cool', 'neutral', 'dark'],
  cool: ['warm', 'neutral', 'vibrant'],
};

const CATEGORY_TOPS = ['tee', 'hoodie', 'jacket'];
const CATEGORY_BOTTOMS = ['pants', 'shorts'];
const CATEGORY_ACCESSORIES = ['cap', 'bag', 'socks', 'accessories', 'shoes'];

function calcVybeScore(a: ClothingItem, b: ClothingItem): ScoreBreakdown {
  let colorHarmony = 0;
  let styleSync = 0;
  let categoryBalance = 0;
  let vibeFactor = 0;
  const tips: string[] = [];

  // 1. Color Harmony (max 30)
  if (a.colorGroup === b.colorGroup) {
    colorHarmony = 15;
    tips.push(`Both pieces share ${a.colorGroup} tones — monochromatic looks are clean but consider adding contrast.`);
  } else if (COLOR_HARMONY[a.colorGroup].includes(b.colorGroup)) {
    colorHarmony = 28;
    tips.push(`${a.colorGroup} × ${b.colorGroup} is a strong color pairing — high contrast energy!`);
  } else {
    colorHarmony = 10;
    tips.push(`The color groups ${a.colorGroup} and ${b.colorGroup} clash a bit. Try pairing with a neutral piece.`);
  }
  // Bonus for yellow+black pairing specifically
  if (
    (a.colorName.includes('Yellow') && b.colorName.includes('Black')) ||
    (b.colorName.includes('Yellow') && a.colorName.includes('Black'))
  ) {
    colorHarmony = Math.min(30, colorHarmony + 2);
    tips.push('Yellow + Black is the VOLT VYBE signature combo. Maximum energy!');
  }

  // 2. Style Sync (max 35)
  const sharedTags = a.styleTags.filter(t => b.styleTags.includes(t));
  styleSync = Math.min(35, sharedTags.length * 14);
  if (sharedTags.length > 0) {
    tips.push(`Shared style DNA: ${sharedTags.join(', ')}. You're locked in!`);
  } else {
    tips.push(`No shared style tags. Mix of ${a.styleTags[0]} and ${b.styleTags[0]} can work with intention.`);
  }

  // 3. Category Balance (max 20)
  const aIsTop = CATEGORY_TOPS.includes(a.category);
  const aIsBottom = CATEGORY_BOTTOMS.includes(a.category);
  const aIsAcc = CATEGORY_ACCESSORIES.includes(a.category);
  const bIsTop = CATEGORY_TOPS.includes(b.category);
  const bIsBottom = CATEGORY_BOTTOMS.includes(b.category);
  const bIsAcc = CATEGORY_ACCESSORIES.includes(b.category);

  if ((aIsTop && bIsBottom) || (aIsBottom && bIsTop)) {
    categoryBalance = 20;
    tips.push('Perfect top + bottom pairing. That\'s a full outfit foundation!');
  } else if ((aIsTop || aIsBottom) && bIsAcc) {
    categoryBalance = 15;
    tips.push(`${b.category.toUpperCase()} works as a solid accent to your ${a.category.toUpperCase()}.`);
  } else if (aIsAcc && (bIsTop || bIsBottom)) {
    categoryBalance = 15;
    tips.push(`${a.category.toUpperCase()} works as a solid accent to your ${b.category.toUpperCase()}.`);
  } else if (a.category === b.category) {
    categoryBalance = 3;
    tips.push(`Two ${a.category}s? Bold layering move, but make sure they contrast in color or texture.`);
  } else {
    categoryBalance = 10;
  }

  // 4. Vibe Factor (max 15)
  if (a.featured && b.featured) { vibeFactor += 5; tips.push('Both are featured drops. Certified heat!'); }
  if (a.rating >= 4.5 && b.rating >= 4.5) { vibeFactor += 5; }
  if (a.inStock && b.inStock) { vibeFactor += 3; }
  if (a.featured || b.featured) { vibeFactor += 2; }

  const total = Math.min(100, colorHarmony + styleSync + categoryBalance + vibeFactor);

  let grade: string, gradeColor: string, gradeBg: string;
  if (total >= 90) { grade = 'PERFECT VYBE ⚡'; gradeColor = '#FFE500'; gradeBg = 'rgba(255,229,0,0.15)'; }
  else if (total >= 75) { grade = 'FIRE FIT 🔥'; gradeColor = '#F97316'; gradeBg = 'rgba(249,115,22,0.15)'; }
  else if (total >= 60) { grade = 'SOLID COMBO 💫'; gradeColor = '#00E5FF'; gradeBg = 'rgba(0,229,255,0.1)'; }
  else if (total >= 45) { grade = 'DECENT DRIP 👌'; gradeColor = '#A855F7'; gradeBg = 'rgba(168,85,247,0.1)'; }
  else { grade = 'NEEDS WORK 🔧'; gradeColor = '#6B7280'; gradeBg = 'rgba(107,114,128,0.1)'; }

  return { colorHarmony, styleSync, categoryBalance, vibeFactor, total, grade, gradeColor, gradeBg, tips };
}

function ItemPicker({
  label, selected, items, onSelect
}: {
  label: string;
  selected: ClothingItem | null;
  items: ClothingItem[];
  onSelect: (item: ClothingItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <div style={{ color: '#FFE500', fontSize: '10px', letterSpacing: '0.3em', marginBottom: '8px', fontFamily: "'Orbitron', sans-serif" }}>
        {label}
      </div>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-3 rounded text-left transition-colors"
        style={{
          background: selected ? 'rgba(255,229,0,0.06)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${selected ? 'rgba(255,229,0,0.4)' : 'rgba(255,255,255,0.1)'}`,
        }}>
        {selected ? (
          <>
            <img src={selected.imageUrl} alt={selected.name} className="rounded object-cover flex-shrink-0"
              style={{ width: 48, height: 48 }} />
            <div className="flex-1 min-w-0">
              <div style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: '12px', fontWeight: 600 }}>{selected.name}</div>
              <div style={{ color: '#FFE500', fontSize: '11px' }}>${selected.price} · {selected.category}</div>
            </div>
          </>
        ) : (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', flex: 1 }}>
            Select a piece...
          </div>
        )}
        <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="absolute z-30 left-0 right-0 mt-1 rounded overflow-hidden"
            style={{ background: '#1A1A1A', border: '1px solid rgba(255,229,0,0.2)', maxHeight: '320px', overflowY: 'auto' }}>
            <div className="p-2 sticky top-0" style={{ background: '#1A1A1A', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Filter items..."
                className="w-full px-3 py-2 rounded outline-none text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF' }} />
            </div>
            {filtered.map(item => (
              <button key={item.id} onClick={() => { onSelect(item); setOpen(false); setSearch(''); }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors text-left">
                <img src={item.imageUrl} alt={item.name} className="rounded object-cover flex-shrink-0"
                  style={{ width: 36, height: 36 }} />
                <div className="flex-1 min-w-0">
                  <div style={{ color: '#FFFFFF', fontSize: '12px', fontWeight: 600, fontFamily: "'Orbitron', sans-serif" }}>{item.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{item.category} · ${item.price}</div>
                </div>
                {selected?.id === item.id && <Check size={14} style={{ color: '#FFE500', flexShrink: 0 }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function StyleMatcher() {
  const { items } = useApp();
  const [item1, setItem1] = useState<ClothingItem | null>(null);
  const [item2, setItem2] = useState<ClothingItem | null>(null);

  const score = useMemo(() => {
    if (!item1 || !item2) return null;
    return calcVybeScore(item1, item2);
  }, [item1, item2]);

  const reset = () => { setItem1(null); setItem2(null); };

  const autoSuggest = () => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setItem1(shuffled[0]);
    setItem2(shuffled[1]);
  };

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh', fontFamily: "'Space Grotesk', sans-serif" }} className="p-6 lg:p-10">

      {/* Header — BAZINGA feature */}
      <div className="mb-10">
        <div style={{ color: '#00E5FF', fontSize: '10px', letterSpacing: '0.4em', marginBottom: '6px' }}>// BAZINGA FEATURE · ORIGINAL</div>
        <h1 style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: 'clamp(24px, 5vw, 48px)', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em' }}>
          VYBE<br /><span style={{ color: '#FFE500' }}>CHECK</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginTop: '10px', maxWidth: '480px', lineHeight: 1.6 }}>
          Drop two pieces and we'll analyze their compatibility — color harmony, style sync,
          category balance, and vibe factor — to give you a <strong style={{ color: '#FFE500' }}>VYBE SCORE</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Selectors */}
        <div className="lg:col-span-1 space-y-6">
          <ItemPicker label="PIECE 01" selected={item1} items={items.filter(i => i.id !== item2?.id)} onSelect={setItem1} />
          <div className="flex items-center justify-center">
            <div style={{ color: '#FFE500', fontFamily: "'Orbitron', sans-serif", fontSize: '20px', fontWeight: 900 }}>×</div>
          </div>
          <ItemPicker label="PIECE 02" selected={item2} items={items.filter(i => i.id !== item1?.id)} onSelect={setItem2} />

          <div className="flex gap-3 pt-2">
            <motion.button onClick={autoSuggest} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded"
              style={{ border: '1px solid rgba(0,229,255,0.3)', color: '#00E5FF', fontFamily: "'Orbitron', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em' }}>
              <Zap size={14} /> RANDOM
            </motion.button>
            {(item1 || item2) && (
              <motion.button onClick={reset} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="px-4 py-3 rounded"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
                <RefreshCw size={14} />
              </motion.button>
            )}
          </div>
        </div>

        {/* Right: Result */}
        <div className="lg:col-span-2">
          {!item1 || !item2 ? (
            <div className="h-full flex flex-col items-center justify-center py-20 gap-4">
              <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 2 }}>
                <Zap size={56} style={{ color: '#FFE500' }} />
              </motion.div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', letterSpacing: '0.1em', textAlign: 'center' }}>
                SELECT TWO PIECES<br />TO GET YOUR VYBE SCORE
              </p>
            </div>
          ) : score ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              {/* Preview both items */}
              <div className="flex gap-4 mb-8">
                {[item1, item2].map((item, i) => (
                  <div key={item.id} className="flex-1 rounded overflow-hidden relative"
                    style={{ border: '1px solid rgba(255,229,0,0.15)' }}>
                    <img src={item.imageUrl} alt={item.name} className="w-full object-cover" style={{ height: 140 }} />
                    <div className="p-3" style={{ background: '#111111' }}>
                      <div style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em' }}>{item.name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginTop: '2px' }}>{item.category} · ${item.price}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* BIG SCORE */}
              <div className="text-center mb-8 p-8 rounded"
                style={{ background: score.gradeBg, border: `1px solid ${score.gradeColor}40` }}>
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                  style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 'clamp(64px, 12vw, 96px)', fontWeight: 900, color: score.gradeColor, lineHeight: 1 }}>
                  {score.total}
                </motion.div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', letterSpacing: '0.2em', marginTop: '4px' }}>/ 100 VYBE SCORE</div>
                <div style={{ color: score.gradeColor, fontFamily: "'Orbitron', sans-serif", fontSize: '16px', fontWeight: 700, letterSpacing: '0.1em', marginTop: '8px' }}>
                  {score.grade}
                </div>
              </div>

              {/* Score breakdown */}
              <div className="space-y-4 mb-8">
                {[
                  { label: 'COLOR HARMONY', score: score.colorHarmony, max: 30, color: '#FFE500' },
                  { label: 'STYLE SYNC', score: score.styleSync, max: 35, color: '#00E5FF' },
                  { label: 'CATEGORY BALANCE', score: score.categoryBalance, max: 20, color: '#A855F7' },
                  { label: 'VIBE FACTOR', score: score.vibeFactor, max: 15, color: '#F97316' },
                ].map(({ label, score: s, max, color }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', letterSpacing: '0.15em', fontFamily: "'Orbitron', sans-serif" }}>{label}</span>
                      <span style={{ color, fontFamily: "'Orbitron', sans-serif", fontSize: '13px', fontWeight: 700 }}>
                        {s} / {max}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(s / max) * 100}%` }} transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="h-full rounded-full" style={{ background: color }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Tips */}
              <div className="p-5 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#FFE500', fontFamily: "'Orbitron', sans-serif", fontSize: '11px', letterSpacing: '0.2em', marginBottom: '12px' }}>
                  ⚡ STYLE INTEL
                </div>
                <div className="space-y-2">
                  {score.tips.map((tip, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-2">
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#FFE500', flexShrink: 0, marginTop: '6px' }} />
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: 1.5 }}>{tip}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* VOLT SIGNATURE — BAZINGA: generative waveform fingerprint */}
              <motion.div className="mt-6 p-5 rounded"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                style={{ background: 'rgba(0,229,255,0.03)', border: '1px solid rgba(0,229,255,0.12)' }}>
                <VoltSignature
                  item1={item1}
                  item2={item2}
                  score={score.total}
                  gradeColor={score.gradeColor}
                  height={130}
                />
              </motion.div>
            </motion.div>
          ) : null}
        </div>
      </div>

      {/* Leaderboard of best pairs */}
      <div className="mt-16 pt-10 border-t" style={{ borderColor: 'rgba(255,229,0,0.1)' }}>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.3em', marginBottom: '6px' }}>// SUGGESTED COMBOS</div>
        <h3 style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
          TOP PAIRINGS
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { a: '1', b: '2', note: 'The classic VOLT stack' },
            { a: '5', b: '9', note: 'Bomber + Joggers — techwear energy' },
            { a: '4', b: '3', note: 'Static Hoodie + Volt Cap — streetwear essentials' },
            { a: '8', b: '2', note: 'Signal Kicks + Cyber Cargo — full outfit' },
            { a: '10', b: '6', note: 'Grid Tee + Circuit Shorts — summer drip' },
            { a: '1', b: '7', note: 'Neon Tee + Pulse Bag — everyday carry' },
          ].map(({ a, b, note }) => {
            const itemA = items.find(i => i.id === a);
            const itemB = items.find(i => i.id === b);
            if (!itemA || !itemB) return null;
            const s = calcVybeScore(itemA, itemB);
            return (
              <motion.button key={`${a}-${b}`} whileHover={{ y: -3 }}
                onClick={() => { setItem1(itemA); setItem2(itemB); }}
                className="text-left p-4 rounded transition-colors"
                style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <img src={itemA.imageUrl} alt="" className="rounded object-cover" style={{ width: 36, height: 36 }} />
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '16px' }}>+</span>
                  <img src={itemB.imageUrl} alt="" className="rounded object-cover" style={{ width: 36, height: 36 }} />
                  <div className="ml-auto">
                    <span style={{ background: s.gradeBg, color: s.gradeColor, fontFamily: "'Orbitron', sans-serif", fontSize: '16px', fontWeight: 900, padding: '2px 8px', border: `1px solid ${s.gradeColor}40` }}>
                      {s.total}
                    </span>
                  </div>
                </div>
                <div style={{ color: '#FFFFFF', fontSize: '12px', fontWeight: 600, fontFamily: "'Orbitron', sans-serif' " }}>{note}</div>
                <div style={{ color: s.gradeColor, fontSize: '11px', marginTop: '4px' }}>{s.grade}</div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}