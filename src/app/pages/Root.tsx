import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { initSession, trackPageVisit } from '../utils/cookieTracker';
import {
  Home, LayoutGrid, BarChart3, Zap, LogOut, Menu, X, MessageCircle, Shield
} from 'lucide-react';

const navItems = [
  { path: '/home', label: 'HOME', icon: Home },
  { path: '/catalog', label: 'CATALOG', icon: LayoutGrid },
  { path: '/stats', label: 'STATS', icon: BarChart3 },
  { path: '/style-matcher', label: 'VYBE CHECK', icon: Zap },
  { path: '/chat', label: 'CHAT', icon: MessageCircle },
];

export function Root() {
  const { user, logout, isAuthenticated, isOnline } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  // Cookie tracking: one-time session init + track every page visit
  React.useEffect(() => { initSession(); }, []);
  React.useEffect(() => { trackPageVisit(location.pathname); }, [location.pathname]);

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#0A0A0A', fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-yellow-400/20 relative">
        <div className="sticky top-0 flex flex-col h-screen">
          {/* Logo */}
          <div className="p-6 border-b border-yellow-400/20">
            <Link to="/home" className="block">
              <div style={{ fontFamily: "'Orbitron', sans-serif" }}>
                <span style={{ color: '#FFE500', fontSize: '22px', fontWeight: 900, letterSpacing: '0.05em', lineHeight: 1 }}>VOLT</span>
                <br />
                <span style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: 900, letterSpacing: '0.05em', lineHeight: 1 }}>VYBE</span>
              </div>
              <div style={{ color: '#00E5FF', fontSize: '9px', letterSpacing: '0.3em', marginTop: '4px' }}>FUTURE FASHION</div>
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(({ path, label, icon: Icon }) => {
              const active = location.pathname.startsWith(path);
              return (
                <Link key={path} to={path}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-3 px-4 py-3 rounded cursor-pointer transition-colors"
                    style={{
                      background: active ? 'rgba(255,229,0,0.12)' : 'transparent',
                      borderLeft: active ? '3px solid #FFE500' : '3px solid transparent',
                      color: active ? '#FFE500' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    <Icon size={16} />
                    <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em', fontFamily: "'Orbitron', sans-serif" }}>{label}</span>
                  </motion.div>
                </Link>
              );
            })}
            
            {user?.roleCode === 'ADMIN' && (
              <Link to="/admin">
                <motion.div
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 px-4 py-3 rounded cursor-pointer transition-colors"
                  style={{
                    background: location.pathname.startsWith('/admin') ? 'rgba(255,229,0,0.12)' : 'transparent',
                    borderLeft: location.pathname.startsWith('/admin') ? '3px solid #FFE500' : '3px solid transparent',
                    color: location.pathname.startsWith('/admin') ? '#FFE500' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  <Shield size={16} />
                  <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em', fontFamily: "'Orbitron', sans-serif" }}>ADMIN</span>
                </motion.div>
              </Link>
            )}
          </nav>

          {/* Categories */}
          <div className="px-4 pb-4">
            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '9px', letterSpacing: '0.3em', padding: '8px 16px 4px' }}>CATEGORIES</div>
            {['TEE', 'PANTS', 'CAP', 'HOODIE', 'JACKET', 'BAG'].map(cat => (
              <Link key={cat} to={`/catalog?category=${cat.toLowerCase()}`}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '0.1em', padding: '4px 16px' }}
                  className="hover:text-yellow-400 transition-colors cursor-pointer">
                  {cat}
                </div>
              </Link>
            ))}
          </div>

          {/* User */}
          <div className="p-4 border-t border-yellow-400/20">
            <div className="flex items-center gap-3 mb-3">
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #FFE500, #00E5FF)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#0A0A0A', fontSize: '14px', fontWeight: 700,
                fontFamily: "'Orbitron', sans-serif"
              }}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ color: '#FFFFFF', fontSize: '12px', fontWeight: 600 }}>{user?.username}</div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>{user?.email}</div>
              </div>
            </div>
            <button onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-red-500/10 transition-colors"
              style={{ color: 'rgba(255,100,100,0.7)', fontSize: '11px', letterSpacing: '0.1em' }}>
              <LogOut size={14} />
              LOGOUT
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: '#0A0A0A', borderBottom: '1px solid rgba(255,229,0,0.2)' }}>
        <Link to="/home" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          <span style={{ color: '#FFE500', fontWeight: 900, fontSize: '18px' }}>VOLT</span>
          <span style={{ color: '#FFFFFF', fontWeight: 900, fontSize: '18px' }}> VYBE</span>
        </Link>
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ color: '#FFE500' }}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="lg:hidden fixed top-14 left-0 right-0 z-40 p-4 space-y-2"
          style={{ background: '#111111', borderBottom: '1px solid rgba(255,229,0,0.2)' }}
        >
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path} onClick={() => setMenuOpen(false)}>
              <div className="flex items-center gap-3 px-4 py-3 rounded"
                style={{ color: location.pathname.startsWith(path) ? '#FFE500' : 'rgba(255,255,255,0.6)' }}>
                <Icon size={16} />
                <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em', fontFamily: "'Orbitron', sans-serif" }}>{label}</span>
              </div>
            </Link>
          ))}
          {user?.roleCode === 'ADMIN' && (
            <Link to="/admin" onClick={() => setMenuOpen(false)}>
              <div className="flex items-center gap-3 px-4 py-3 rounded"
                style={{ color: location.pathname.startsWith('/admin') ? '#FFE500' : 'rgba(255,255,255,0.6)' }}>
                <Shield size={16} />
                <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em', fontFamily: "'Orbitron', sans-serif" }}>ADMIN</span>
              </div>
            </Link>
          )}
          <div className="pt-2 border-t border-yellow-400/20">
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2"
              style={{ color: 'rgba(255,100,100,0.8)', fontSize: '11px' }}>
              <LogOut size={14} /> LOGOUT
            </button>
          </div>
        </motion.div>
      )}

      {/* Main content — fade-in transition on route change */}
      <main className="flex-1 overflow-auto lg:pt-0 pt-14">
        {!isOnline && (
          <div className="px-4 lg:px-6 py-2 sticky top-0 z-30" style={{ background: 'rgba(255,68,68,0.16)', borderBottom: '1px solid rgba(255,68,68,0.45)', color: '#FF6666', fontSize: '12px', letterSpacing: '0.08em' }}>
            OFFLINE - changes will sync when connection is restored
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
