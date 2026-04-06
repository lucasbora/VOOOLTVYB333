import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend
} from 'recharts';
import { BarChart3, Grid, Star, TrendingUp, Info } from 'lucide-react';

const YELLOW = '#FFE500';
const CYAN = '#00E5FF';
const WHITE = 'rgba(255,255,255,0.7)';
const CHART_COLORS = ['#FFE500', '#00E5FF', '#FF6B6B', '#A855F7', '#22D3EE', '#F97316', '#10B981', '#EC4899'];

type ViewMode = 'visual' | 'table';

export function Statistics() {
  const { items } = useApp();
  const [view, setView] = useState<ViewMode>('visual');
  const [showPrinciple, setShowPrinciple] = useState(false);

  // Category breakdown
  const categoryData = Object.entries(
    items.reduce((acc, item) => { acc[item.category] = (acc[item.category] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, count]) => ({ name: name.toUpperCase(), count })).sort((a, b) => b.count - a.count);

  // Color group pie
  const colorData = Object.entries(
    items.reduce((acc, item) => { acc[item.colorGroup] = (acc[item.colorGroup] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name: name.toUpperCase(), value }));

  // Price range distribution
  const priceData = [
    { range: '$0-50', count: items.filter(i => i.price <= 50).length },
    { range: '$51-80', count: items.filter(i => i.price > 50 && i.price <= 80).length },
    { range: '$81-120', count: items.filter(i => i.price > 80 && i.price <= 120).length },
    { range: '$120+', count: items.filter(i => i.price > 120).length },
  ];

  // Style tag radar
  const allTags = ['streetwear', 'sporty', 'minimal', 'avant-garde', 'casual', 'techwear'];
  const radarData = allTags.map(tag => ({
    tag: tag.toUpperCase(),
    count: items.filter(i => i.styleTags.includes(tag as any)).length,
  }));

  // Ranked items
  const ranked = [...items].sort((a, b) => b.rating - a.rating);

  const totalValue = items.reduce((s, i) => s + i.price * i.stock, 0);
  const avgPrice = items.reduce((s, i) => s + i.price, 0) / items.length;
  const avgRating = items.reduce((s, i) => s + i.rating, 0) / items.length;

  const getRankBadge = (rating: number) => {
    if (rating >= 4.8) return { label: 'S TIER', color: '#FFE500', bg: 'rgba(255,229,0,0.15)' };
    if (rating >= 4.5) return { label: 'A TIER', color: '#00E5FF', bg: 'rgba(0,229,255,0.1)' };
    if (rating >= 4.2) return { label: 'B TIER', color: '#A855F7', bg: 'rgba(168,85,247,0.1)' };
    if (rating >= 4.0) return { label: 'C TIER', color: '#F97316', bg: 'rgba(249,115,22,0.1)' };
    return { label: 'D TIER', color: '#6B7280', bg: 'rgba(107,114,128,0.1)' };
  };

  const customTooltipStyle = {
    background: '#1A1A1A', border: '1px solid rgba(255,229,0,0.2)',
    borderRadius: '4px', color: '#FFFFFF', fontSize: '12px',
  };

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh', fontFamily: "'Space Grotesk', sans-serif" }} className="p-6 lg:p-10">

      {/* HEADER — GOLD CHALLENGE: DICHOTOMY then SYMMETRY */}
      {/* This header intentionally breaks UNITY (uniform appearance) with DICHOTOMY  */}
      {/* (extreme contrast: half black text, half yellow block), then SYMMETRY */}
      {/* in the stat cards below brings BALANCE back. */}
      <div className="mb-10">
        <div className="flex flex-col lg:flex-row lg:items-stretch gap-0 overflow-hidden rounded"
          style={{ border: '1px solid rgba(255,229,0,0.2)' }}>
          {/* Dark half — DICHOTOMY intentional contrast */}
          <div className="flex-1 p-8" style={{ background: '#111111' }}>
            <div style={{ color: '#FFE500', fontSize: '10px', letterSpacing: '0.4em', marginBottom: '8px' }}>// DATA ANALYTICS</div>
            <h1 style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, lineHeight: 1 }}>
              VOLT VYBE<br />STATISTICS
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '12px' }}>
              Full spectrum analysis of inventory, ratings, and trends.
            </p>
          </div>
          {/* Yellow half — DICHOTOMY breaks unity */}
          <div className="flex-1 p-8 flex flex-col justify-center" style={{ background: '#FFE500' }}>
            <div style={{ fontFamily: "'Orbitron', sans-serif", color: '#0A0A0A', fontSize: '10px', letterSpacing: '0.3em', marginBottom: '12px' }}>COLLECTION SNAPSHOT</div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { v: items.length, l: 'ITEMS' },
                { v: `$${avgPrice.toFixed(0)}`, l: 'AVG PRICE' },
                { v: avgRating.toFixed(1), l: 'AVG RATING' },
              ].map(s => (
                <div key={s.l}>
                  <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 900, color: '#0A0A0A', lineHeight: 1 }}>{s.v}</div>
                  <div style={{ fontSize: '9px', color: 'rgba(0,0,0,0.5)', letterSpacing: '0.2em', marginTop: '4px' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Design principle note button */}
        <button onClick={() => setShowPrinciple(!showPrinciple)}
          className="flex items-center gap-2 mt-3 text-xs"
          style={{ color: 'rgba(255,229,0,0.5)', letterSpacing: '0.1em' }}>
          <Info size={12} />
          {showPrinciple ? 'HIDE' : 'VIEW'} DESIGN PRINCIPLE NOTE (GOLD CHALLENGE)
        </button>

        <AnimatePresence>
          {showPrinciple && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mt-3 p-4 rounded overflow-hidden"
              style={{ background: 'rgba(255,229,0,0.05)', border: '1px solid rgba(255,229,0,0.15)' }}>
              <div style={{ color: '#FFE500', fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', marginBottom: '8px', fontFamily: "'Orbitron', sans-serif" }}>
                GOLD CHALLENGE: DESIGN PRINCIPLE — DICHOTOMY → SYMMETRY
              </div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: 1.6 }}>
                <strong style={{ color: '#FFE500' }}>Breaking UNITY with DICHOTOMY:</strong> The header above intentionally
                shatters monotony by splitting into two extreme halves — a dark (#111) panel and a bright yellow panel.
                This DICHOTOMY creates dramatic contrast that catches the eye but could feel unbalanced. <br />
                <strong style={{ color: '#00E5FF' }}>Fixing with SYMMETRY:</strong> The stat cards below restore visual
                BALANCE through equal-width symmetric columns, uniform spacing, and consistent typographic hierarchy —
                creating a stable grid that anchors the volatile dichotomy above.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SYMMETRY: Balanced stat cards — fixes DICHOTOMY above */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'IN STOCK', value: items.filter(i => i.inStock).length, sub: `/ ${items.length} total`, color: CYAN },
          { label: 'TOTAL VALUE', value: `$${(totalValue / 1000).toFixed(1)}K`, sub: 'inventory worth', color: YELLOW },
          { label: 'FEATURED', value: items.filter(i => i.featured).length, sub: 'hot items', color: '#A855F7' },
          { label: 'CATEGORIES', value: new Set(items.map(i => i.category)).size, sub: 'product types', color: '#F97316' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="p-5 rounded" style={{ background: '#111111', border: `1px solid ${stat.color}30` }}>
            <div style={{ color: stat.color, fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 700 }}>{stat.value}</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', letterSpacing: '0.2em', marginTop: '2px' }}>{stat.sub}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', letterSpacing: '0.15em', marginTop: '8px', fontWeight: 600 }}>{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-4 mb-8">
        <div style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: '14px', fontWeight: 700 }}>VIEW MODE</div>
        <div className="flex p-1 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {([
            { mode: 'visual', icon: BarChart3, label: 'VISUAL' },
            { mode: 'table', icon: Grid, label: 'TABLE' },
          ] as const).map(({ mode, icon: Icon, label }) => (
            <button key={mode} onClick={() => setView(mode)}
              className="flex items-center gap-2 px-4 py-2 rounded transition-all"
              style={{
                background: view === mode ? '#FFE500' : 'transparent',
                color: view === mode ? '#0A0A0A' : 'rgba(255,255,255,0.4)',
                fontFamily: "'Orbitron', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
              }}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'visual' ? (
          <motion.div key="visual" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {/* Charts grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Category Bar Chart */}
              <div className="p-6 rounded" style={{ background: '#111111', border: '1px solid rgba(255,229,0,0.12)' }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.3em', marginBottom: '4px' }}>DISTRIBUTION</div>
                <h3 style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>ITEMS BY CATEGORY</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={categoryData} barCategoryGap="30%">
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: 'rgba(255,229,0,0.05)' }} />
                    <Bar dataKey="count" fill={YELLOW} radius={[3, 3, 0, 0]}>
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? YELLOW : i === 1 ? CYAN : CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Color Pie Chart */}
              <div className="p-6 rounded" style={{ background: '#111111', border: '1px solid rgba(255,229,0,0.12)' }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.3em', marginBottom: '4px' }}>BREAKDOWN</div>
                <h3 style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>ITEMS BY COLOR GROUP</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={colorData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}>
                      {colorData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={customTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Price Range Bar */}
              <div className="p-6 rounded" style={{ background: '#111111', border: '1px solid rgba(255,229,0,0.12)' }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.3em', marginBottom: '4px' }}>PRICING</div>
                <h3 style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>PRICE RANGE DISTRIBUTION</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={priceData} barCategoryGap="30%">
                    <XAxis dataKey="range" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: 'rgba(255,229,0,0.05)' }} />
                    <Bar dataKey="count" fill={CYAN} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Style Radar */}
              <div className="p-6 rounded" style={{ background: '#111111', border: '1px solid rgba(255,229,0,0.12)' }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.3em', marginBottom: '4px' }}>STYLE DNA</div>
                <h3 style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>STYLE TAG RADAR</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="tag" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 9 }} />
                    <Radar name="Items" dataKey="count" stroke={YELLOW} fill={YELLOW} fillOpacity={0.2} />
                    <Tooltip contentStyle={customTooltipStyle} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RANKING — Star/Class system */}
            <div className="p-6 rounded" style={{ background: '#111111', border: '1px solid rgba(255,229,0,0.12)' }}>
              <div className="flex items-center gap-3 mb-6">
                <Star size={16} style={{ color: YELLOW }} />
                <h3 style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: '16px', fontWeight: 700 }}>TIER RANKING</h3>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>— by rating score</div>
              </div>
              <div className="space-y-3">
                {ranked.map((item, i) => {
                  const badge = getRankBadge(item.rating);
                  const pct = (item.rating / 5) * 100;
                  return (
                    <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-4 p-3 rounded"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ width: 28, color: 'rgba(255,255,255,0.3)', fontFamily: "'Orbitron', sans-serif", fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
                        #{i + 1}
                      </div>
                      <img src={item.imageUrl} alt={item.name} className="rounded object-cover flex-shrink-0"
                        style={{ width: 40, height: 40 }} />
                      <div className="flex-1 min-w-0">
                        <div style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: '12px', fontWeight: 600, letterSpacing: '0.03em' }}>
                          {item.name}
                        </div>
                        <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)', width: '100%' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: i * 0.04 + 0.3, duration: 0.6 }}
                            className="h-full rounded-full" style={{ background: badge.color }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star key={s} size={10} fill={s < Math.round(item.rating) ? badge.color : 'transparent'} color={badge.color} />
                        ))}
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginLeft: '4px' }}>{item.rating}</span>
                      </div>
                      <span style={{ background: badge.bg, color: badge.color, fontSize: '9px', fontWeight: 700, padding: '3px 8px', letterSpacing: '0.1em', fontFamily: "'Orbitron', sans-serif", flexShrink: 0, border: `1px solid ${badge.color}40` }}>
                        {badge.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          // TABLE VIEW
          <motion.div key="table" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="rounded overflow-hidden" style={{ border: '1px solid rgba(255,229,0,0.15)' }}>
              <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,229,0,0.08)', borderBottom: '1px solid rgba(255,229,0,0.2)' }}>
                    {['RANK', 'ITEM', 'CATEGORY', 'PRICE', 'RATING', 'STOCK', 'STYLE', 'TIER'].map(h => (
                      <th key={h} className="text-left px-4 py-3"
                        style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.2em', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((item, i) => {
                    const badge = getRankBadge(item.rating);
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
                        <td className="px-4 py-3" style={{ color: i < 3 ? YELLOW : 'rgba(255,255,255,0.3)', fontFamily: "'Orbitron', sans-serif", fontSize: '13px', fontWeight: 700 }}>
                          #{i + 1}
                        </td>
                        <td className="px-4 py-3" style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: '12px', fontWeight: 600 }}>{item.name}</td>
                        <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '0.1em' }}>{item.category.toUpperCase()}</td>
                        <td className="px-4 py-3" style={{ color: YELLOW, fontFamily: "'Orbitron', sans-serif", fontSize: '14px', fontWeight: 700 }}>${item.price}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Star size={11} fill={YELLOW} color={YELLOW} />
                            <span style={{ color: '#FFFFFF', fontSize: '13px' }}>{item.rating}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3" style={{ color: item.stock > 20 ? CYAN : item.stock > 5 ? YELLOW : '#FF4444', fontSize: '13px', fontWeight: 600 }}>{item.stock}</td>
                        <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{item.styleTags[0]}</td>
                        <td className="px-4 py-3">
                          <span style={{ background: badge.bg, color: badge.color, fontSize: '9px', fontWeight: 700, padding: '3px 8px', letterSpacing: '0.1em', fontFamily: "'Orbitron', sans-serif" }}>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>

            {/* Summary row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {Object.entries(
                ranked.reduce((acc, item) => {
                  const tier = getRankBadge(item.rating).label;
                  acc[tier] = (acc[tier] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([tier, count]) => {
                const badge = ['S TIER', 'A TIER', 'B TIER', 'C TIER', 'D TIER'].includes(tier) ? getRankBadge(
                  tier === 'S TIER' ? 5 : tier === 'A TIER' ? 4.6 : tier === 'B TIER' ? 4.3 : tier === 'C TIER' ? 4.0 : 3.0
                ) : { color: '#6B7280', bg: 'rgba(107,114,128,0.1)' };
                return (
                  <div key={tier} className="p-4 rounded flex items-center gap-3"
                    style={{ background: badge.bg, border: `1px solid ${badge.color}30` }}>
                    <span style={{ color: badge.color, fontFamily: "'Orbitron', sans-serif", fontSize: '24px', fontWeight: 900 }}>{count}</span>
                    <span style={{ color: badge.color, fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em' }}>{tier}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
