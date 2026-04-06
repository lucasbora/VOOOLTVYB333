import React from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { ArrowRight, Zap, Star, TrendingUp, Activity, Plus, Edit3, Trash2, LogIn, LogOut, UserPlus } from 'lucide-react';
import { DesignPrincipleDemo } from '../components/DesignPrincipleDemo';

const heroImg = 'https://images.unsplash.com/photo-1702221294206-7557582244af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200';

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const ACTIVITY_ICONS = {
  added:    { icon: Plus,     color: '#00E5FF' },
  updated:  { icon: Edit3,    color: '#FFE500' },
  deleted:  { icon: Trash2,   color: '#FF4444' },
  login:    { icon: LogIn,    color: '#A855F7' },
  register: { icon: UserPlus, color: '#10B981' },
  logout:   { icon: LogOut,   color: 'rgba(255,255,255,0.3)' },
};

export function Home() {
  const { items, user, activities } = useApp();
  const featured = items.filter(i => i.featured).slice(0, 4);
  const topRated = [...items].sort((a, b) => b.rating - a.rating).slice(0, 3);

  return (
    <div style={{ background: '#0A0A0A', fontFamily: "'Space Grotesk', sans-serif", minHeight: '100vh' }}>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden" style={{ minHeight: '100vh' }}>
        {/* Background image */}
        <div className="absolute inset-0">
          <img src={heroImg} alt="hero" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0.3) 0%, #0A0A0A 100%)' }} />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, #FFE500 0, #FFE500 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, #FFE500 0, #FFE500 1px, transparent 1px, transparent 60px)',
            }} />
        </div>

        <div className="relative z-10 flex flex-col justify-center min-h-screen px-8 lg:px-12">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-16">
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '0.3em' }}>
              SS26 COLLECTION
            </div>
            <div className="flex gap-6">
              {['about', 'item', 'sale', 'category'].map(item => (
                <span key={item} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '0.1em', cursor: 'pointer' }}
                  className="hover:text-yellow-400 transition-colors">
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Big hero text — inspired by Good Vibes Kyoto bold typography */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div style={{ fontFamily: "'Orbitron', sans-serif" }}>
              {['VOLT', 'VYBE', 'SS26'].map((word, i) => (
                <motion.div key={word}
                  initial={{ opacity: 0, x: -60 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.12, duration: 0.6 }}
                  style={{
                    fontSize: 'clamp(70px, 14vw, 160px)',
                    fontWeight: 900,
                    lineHeight: 0.88,
                    color: i === 0 ? '#FFE500' : i === 1 ? '#FFFFFF' : 'rgba(255,255,255,0.2)',
                    letterSpacing: '-0.02em',
                    textShadow: i === 0 ? '0 0 60px rgba(255,229,0,0.3)' : 'none',
                  }}>
                  {word}
                </motion.div>
              ))}
            </div>

            {/* Right info column — like Good Vibes Kyoto's vertical nav */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="flex flex-col gap-3 lg:text-right">
              <div style={{ color: '#FFE500', fontSize: '12px', letterSpacing: '0.1em' }}>
                each piece is a<br />
                <span style={{ color: '#00E5FF' }}>pulse of the future</span>
              </div>
              <div className="flex flex-col gap-1 mt-2">
                {['tee', 'pants', 'socks', 'cap', 'bag', 'shoes'].map(cat => (
                  <Link key={cat} to={`/catalog?category=${cat}`}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', letterSpacing: '0.2em' }}
                      className="hover:text-yellow-400 transition-colors cursor-pointer block">
                      {cat.toUpperCase()}
                    </span>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="flex items-center gap-6 mt-12">
            <Link to="/catalog">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="flex items-center gap-3 px-8 py-4 rounded"
                style={{ background: '#FFE500', color: '#0A0A0A', fontFamily: "'Orbitron', sans-serif", fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em' }}>
                <Zap size={16} />
                SHOP NOW
                <ArrowRight size={16} />
              </motion.button>
            </Link>
            <Link to="/style-matcher">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="flex items-center gap-3 px-8 py-4 rounded border"
                style={{ border: '1px solid rgba(0,229,255,0.5)', color: '#00E5FF', fontFamily: "'Orbitron', sans-serif", fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em' }}>
                <Zap size={16} />
                VYBE CHECK
              </motion.button>
            </Link>
          </motion.div>

          {/* Stats ticker */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            className="flex items-center gap-8 mt-12 pt-8 border-t"
            style={{ borderColor: 'rgba(255,229,0,0.15)' }}>
            {[
              { label: 'ITEMS', value: items.length },
              { label: 'IN STOCK', value: items.filter(i => i.inStock).length },
              { label: 'AVG RATING', value: (items.reduce((s, i) => s + i.rating, 0) / items.length).toFixed(1) },
            ].map(stat => (
              <div key={stat.label}>
                <div style={{ color: '#FFE500', fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 700 }}>
                  {stat.value}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', letterSpacing: '0.25em' }}>{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURED ITEMS */}
      <section className="px-8 lg:px-12 py-20">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div style={{ color: '#FFE500', fontSize: '10px', letterSpacing: '0.4em', marginBottom: '6px' }}>/ / FEATURED</div>
            <h2 style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 700 }}>
              HOT DROPS
            </h2>
          </div>
          <Link to="/catalog">
            <span style={{ color: '#FFE500', fontSize: '11px', letterSpacing: '0.2em' }}
              className="flex items-center gap-2 hover:gap-4 transition-all">
              VIEW ALL <ArrowRight size={14} />
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featured.map((item, i) => (
            <motion.div key={item.id}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }}>
              <Link to={`/catalog/${item.id}`}>
                <div className="rounded overflow-hidden cursor-pointer group"
                  style={{ border: '1px solid rgba(255,229,0,0.1)', background: '#111111' }}>
                  <div className="relative overflow-hidden" style={{ aspectRatio: '4/5' }}>
                    <img src={item.imageUrl} alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.8) 100%)' }} />
                    <div className="absolute top-3 left-3">
                      <span style={{ background: '#FFE500', color: '#0A0A0A', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', padding: '3px 8px', fontFamily: "'Orbitron', sans-serif" }}>
                        FEATURED
                      </span>
                    </div>
                    {!item.inStock && (
                      <div className="absolute top-3 right-3">
                        <span style={{ background: 'rgba(0,0,0,0.8)', color: '#FF4444', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', padding: '3px 8px', border: '1px solid #FF4444' }}>
                          SOLD OUT
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', letterSpacing: '0.25em', marginBottom: '4px' }}>
                      {item.category.toUpperCase()}
                    </div>
                    <div style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em' }}>
                      {item.name}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span style={{ color: '#FFE500', fontFamily: "'Orbitron', sans-serif", fontSize: '16px', fontWeight: 700 }}>
                        ${item.price}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star size={11} fill="#FFE500" color="#FFE500" />
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{item.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* DESIGN LAB — Gold Challenge: interactive design principle demo */}
      <DesignPrincipleDemo />

      {/* TOP RATED */}
      <section className="px-8 lg:px-12 py-20">
        <div className="flex items-center gap-3 mb-10">
          <TrendingUp size={20} style={{ color: '#FFE500' }} />
          <h2 style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: '22px', fontWeight: 700 }}>
            TOP RATED
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {topRated.map((item, i) => (
            <Link key={item.id} to={`/catalog/${item.id}`}>
              <motion.div whileHover={{ borderColor: 'rgba(255,229,0,0.5)' }}
                className="flex items-center gap-4 p-4 rounded"
                style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#111111', transition: 'border-color 0.2s' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: '#FFE500', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#0A0A0A', fontFamily: "'Orbitron', sans-serif", fontSize: '18px', fontWeight: 900, flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <img src={item.imageUrl} alt={item.name} className="rounded object-cover flex-shrink-0"
                  style={{ width: 56, height: 56 }} />
                <div className="flex-1 min-w-0">
                  <div style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em' }}>
                    {item.name}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} size={10} fill={s < Math.round(item.rating) ? '#FFE500' : 'transparent'} color="#FFE500" />
                    ))}
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginLeft: '4px' }}>{item.rating}</span>
                  </div>
                </div>
                <div style={{ color: '#FFE500', fontFamily: "'Orbitron', sans-serif", fontSize: '16px', fontWeight: 700, flexShrink: 0 }}>
                  ${item.price}
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* RECENT ACTIVITY */}
      <section className="px-8 lg:px-12 py-20 border-t" style={{ borderColor: 'rgba(255,229,0,0.08)' }}>
        <div className="flex items-center gap-3 mb-8">
          <Activity size={18} style={{ color: '#FFE500' }} />
          <div>
            <div style={{ color: '#FFE500', fontSize: '10px', letterSpacing: '0.4em', marginBottom: '2px' }}>// LIVE LOG</div>
            <h2 style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: '22px', fontWeight: 700 }}>
              RECENT ACTIVITY
            </h2>
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3"
            style={{ border: '1px solid rgba(255,229,0,0.1)', borderRadius: '6px', background: 'rgba(255,255,255,0.02)' }}>
            <Activity size={32} style={{ color: 'rgba(255,229,0,0.2)' }} />
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', letterSpacing: '0.15em' }}>
              NO ACTIVITY YET — ADD AN ITEM OR LOG IN
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-w-2xl">
            {activities.slice(0, 10).map((act, i) => {
              const cfg = ACTIVITY_ICONS[act.type];
              const Icon = cfg.icon;
              return (
                <motion.div key={act.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-4 py-3 rounded"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: `${cfg.color}15`,
                    border: `1px solid ${cfg.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={13} style={{ color: cfg.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ color: '#FFFFFF', fontSize: '13px' }}>{act.label}</span>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', flexShrink: 0, letterSpacing: '0.05em' }}>
                    {timeAgo(act.timestamp)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="px-8 lg:px-12 py-10 border-t" style={{ borderColor: 'rgba(255,229,0,0.1)' }}>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div style={{ fontFamily: "'Orbitron', sans-serif" }}>
            <span style={{ color: '#FFE500', fontWeight: 900, fontSize: '20px' }}>VOLT</span>
            <span style={{ color: '#FFFFFF', fontWeight: 900, fontSize: '20px' }}> VYBE</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', letterSpacing: '0.1em' }}>
            © 2026 VOLT VYBE / FUTURE FASHION / ALL RIGHTS RESERVED
          </p>
        </div>
      </footer>
    </div>
  );
}