import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, register, isAuthenticated } = useApp();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate('/home');
    return null;
  }

  const validateEmail = (addr: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('Email is required.'); return; }
    if (!validateEmail(email)) { setError('Please enter a valid email address.'); return; }
    if (!password) { setError('Password is required.'); return; }

    if (mode === 'login') {
      const ok = login(email, password);
      if (ok) navigate('/home');
      else setError('Invalid credentials. Try demo@voltvybe.com / demo1234');
    } else {
      if (!username.trim()) { setError('Username is required.'); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
      const ok = register(email, username, password);
      if (ok) navigate('/home');
      else setError('Email already registered.');
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#0A0A0A', fontFamily: "'Space Grotesk', sans-serif", overflow: 'hidden' }}>
      {/* Left: branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative"
        style={{ background: '#FFE500', overflow: 'hidden' }}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, #000 0, #000 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #000 0, #000 1px, transparent 1px, transparent 40px)',
          }} />

        <div className="relative z-10">
          <div style={{ fontFamily: "'Orbitron', sans-serif", color: '#0A0A0A' }}>
            <div style={{ fontSize: '80px', fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.02em' }}>VOLT</div>
            <div style={{ fontSize: '80px', fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.02em' }}>VYBE</div>
          </div>
          <div style={{ color: '#0A0A0A', fontSize: '11px', letterSpacing: '0.4em', marginTop: '16px', opacity: 0.6 }}>
            FUTURE FASHION / EST. 2025
          </div>
        </div>

        <div className="relative z-10">
          <div className="mb-8">
            {/* Glitchy big text similar to Good Vibes Kyoto */}
            {['CHARGED', 'READY', 'WIRED'].map((word, i) => (
              <motion.div key={word}
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                style={{
                  fontSize: i === 0 ? '56px' : i === 1 ? '48px' : '52px',
                  fontWeight: 900,
                  fontFamily: "'Orbitron', sans-serif",
                  color: '#0A0A0A',
                  lineHeight: 1,
                  opacity: 1 - i * 0.15,
                }}
              >
                {word}
              </motion.div>
            ))}
          </div>
          <p style={{ color: '#0A0A0A', opacity: 0.6, fontSize: '14px', maxWidth: '300px', lineHeight: 1.6 }}>
            Each piece is a pulse of the future. Wear the frequency.
          </p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            <span style={{ color: '#FFE500', fontSize: '32px', fontWeight: 900 }}>VOLT</span>
            <span style={{ color: '#FFFFFF', fontSize: '32px', fontWeight: 900 }}> VYBE</span>
          </div>

          {/* Toggle */}
          <div className="flex mb-8 p-1 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                className="flex-1 py-2 rounded transition-all"
                style={{
                  background: mode === m ? '#FFE500' : 'transparent',
                  color: mode === m ? '#0A0A0A' : 'rgba(255,255,255,0.5)',
                  fontSize: '12px', fontWeight: 700,
                  letterSpacing: '0.1em',
                  fontFamily: "'Orbitron', sans-serif",
                }}>
                {m.toUpperCase()}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form key={mode}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', letterSpacing: '0.2em', display: 'block', marginBottom: '6px' }}>
                  EMAIL ADDRESS
                </label>
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded outline-none transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,229,0,0.2)',
                    color: '#FFFFFF', fontSize: '14px',
                  }}
                  onFocus={e => e.target.style.borderColor = '#FFE500'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,229,0,0.2)'}
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', letterSpacing: '0.2em', display: 'block', marginBottom: '6px' }}>
                    USERNAME
                  </label>
                  <input
                    type="text" value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="VOLT_USER"
                    className="w-full px-4 py-3 rounded outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,229,0,0.2)',
                      color: '#FFFFFF', fontSize: '14px',
                    }}
                    onFocus={e => e.target.style.borderColor = '#FFE500'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,229,0,0.2)'}
                  />
                </div>
              )}

              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', letterSpacing: '0.2em', display: 'block', marginBottom: '6px' }}>
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} required value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded outline-none pr-12"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,229,0,0.2)',
                      color: '#FFFFFF', fontSize: '14px',
                    }}
                    onFocus={e => e.target.style.borderColor = '#FFE500'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,229,0,0.2)'}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-2 px-4 py-3 rounded"
                  style={{ background: 'rgba(255,60,60,0.1)', border: '1px solid rgba(255,60,60,0.3)', color: '#FF6B6B', fontSize: '13px' }}>
                  <AlertCircle size={14} />
                  {error}
                </motion.div>
              )}

              <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded flex items-center justify-center gap-2 transition-colors"
                style={{
                  background: '#FFE500', color: '#0A0A0A',
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '13px', fontWeight: 700, letterSpacing: '0.15em',
                  marginTop: '8px',
                }}>
                <Zap size={16} />
                {mode === 'login' ? 'ENTER THE VOLT' : 'JOIN THE VYBE'}
              </motion.button>

              {mode === 'login' && (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'center' }}>
                  Demo: demo@voltvybe.com / demo1234
                </p>
              )}
            </motion.form>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
