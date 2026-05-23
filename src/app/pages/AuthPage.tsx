import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token');

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // MFA State
  const [mfaRequired, setMfaRequired] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  // Forgot password state
  const [isForgot, setIsForgot] = useState(false);

  const { login, register, verifyMfaLogin, forgotPassword, resetPassword, isAuthenticated } = useApp();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate('/home');
    return null;
  }

  const validateEmail = (addr: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // ── 1. Reset Password (URL has ?token=...) ─────────────────────────────
    if (tokenParam) {
      if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
      const res = await resetPassword(tokenParam, newPassword);
      if (res.success) {
        setMessage('Password reset! You can now log in with your new password.');
        setNewPassword('');
        navigate('/auth');
      } else {
        setError(res.message);
      }
      return;
    }

    // ── 2. Forgot Password ─────────────────────────────────────────────────
    if (isForgot) {
      if (!email.trim()) { setError('Email is required.'); return; }
      if (!validateEmail(email)) { setError('Please enter a valid email address.'); return; }
      const res = await forgotPassword(email);
      if (res.success) setMessage(res.message);
      else setError(res.message);
      return;
    }

    // ── 3. MFA Verification ────────────────────────────────────────────────
    if (mfaRequired) {
      if (!/^\d{6}$/.test(mfaCode)) { setError('MFA code must be exactly 6 digits.'); return; }
      const ok = await verifyMfaLogin(tempToken, mfaCode);
      if (ok) navigate('/home');
      else setError('Invalid or expired MFA code. Please try again.');
      return;
    }

    // ── 4. Standard Login / Register ────────────────────────────────────────
    if (!email.trim()) { setError('Email is required.'); return; }
    if (!validateEmail(email)) { setError('Please enter a valid email address.'); return; }
    if (!password) { setError('Password is required.'); return; }

    if (mode === 'login') {
      const res = await login(email, password);
      if (res.success) {
        if (res.mfaRequired) {
          setMfaRequired(true);
          setTempToken(res.tempToken || '');
          setMfaCode('');
        } else {
          navigate('/home');
        }
      } else {
        setError('Invalid credentials. Try demo@voltvybe.com / demo1234');
      }
    } else {
      if (!username.trim()) { setError('Username is required.'); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
      const ok = await register(email, username, password);
      if (ok) navigate('/home');
      else setError('Email already registered.');
    }
  };

  const isResetMode = !!tokenParam;

  return (
    <div className="min-h-screen flex" style={{ background: '#0A0A0A', fontFamily: "'Space Grotesk', sans-serif", overflow: 'hidden' }}>
      {/* Left: branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative"
        style={{ background: '#FFE500', overflow: 'hidden' }}>
        {/* Background grid pattern */}
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

          {/* Mode toggle — only shown on standard login/register */}
          {!isResetMode && !isForgot && !mfaRequired && (
            <div className="flex mb-8 p-1 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
              {(['login', 'register'] as const).map(m => (
                <button key={m} onClick={() => { setMode(m); setError(''); setMessage(''); }}
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
          )}

          <AnimatePresence mode="wait">
            <motion.form key={isResetMode ? 'reset' : isForgot ? 'forgot' : mfaRequired ? 'mfa' : mode}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSubmit} className="space-y-4">

              {isResetMode ? (
                /* ── 1. RESET PASSWORD ────────────────────────────────────── */
                <div className="space-y-4">
                  <div style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    <span style={{ color: '#FFE500', fontSize: '22px', fontWeight: 900 }}>RESET</span>
                    <span style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: 900 }}> PASSWORD</span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', lineHeight: 1.5 }}>
                    Enter a secure new password for your VOLT VYBE account.
                  </p>
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', letterSpacing: '0.2em', display: 'block', marginBottom: '6px' }}>
                      NEW PASSWORD
                    </label>
                    <div className="relative">
                      <input
                        id="reset-password-input"
                        type={showPassword ? 'text' : 'password'} required value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 rounded outline-none pr-12"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,229,0,0.2)', color: '#FFFFFF', fontSize: '14px' }}
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
                  <motion.button id="reset-password-btn" type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full py-4 rounded flex items-center justify-center gap-2"
                    style={{ background: '#FFE500', color: '#0A0A0A', fontFamily: "'Orbitron', sans-serif", fontSize: '13px', fontWeight: 700, letterSpacing: '0.15em', marginTop: '8px' }}>
                    <Zap size={16} /> UPDATE PASSWORD
                  </motion.button>
                  <p style={{ textAlign: 'center', marginTop: '16px' }}>
                    <button type="button" onClick={() => navigate('/auth')}
                      style={{ color: '#FFE500', fontSize: '12px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Orbitron', sans-serif", fontWeight: 700, letterSpacing: '0.05em' }}>
                      RETURN TO LOGIN
                    </button>
                  </p>
                </div>

              ) : isForgot ? (
                /* ── 2. FORGOT PASSWORD ───────────────────────────────────── */
                <div className="space-y-4">
                  <div style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    <span style={{ color: '#FFE500', fontSize: '22px', fontWeight: 900 }}>RECOVER</span>
                    <span style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: 900 }}> ACCOUNT</span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', lineHeight: 1.5 }}>
                    Enter your email. A password recovery link will be printed to the backend console.
                  </p>
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', letterSpacing: '0.2em', display: 'block', marginBottom: '6px' }}>
                      EMAIL ADDRESS
                    </label>
                    <input
                      id="forgot-email-input"
                      type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded outline-none transition-colors"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,229,0,0.2)', color: '#FFFFFF', fontSize: '14px' }}
                      onFocus={e => e.target.style.borderColor = '#FFE500'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,229,0,0.2)'}
                    />
                  </div>
                  <motion.button id="forgot-submit-btn" type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full py-4 rounded flex items-center justify-center gap-2"
                    style={{ background: '#FFE500', color: '#0A0A0A', fontFamily: "'Orbitron', sans-serif", fontSize: '13px', fontWeight: 700, letterSpacing: '0.15em', marginTop: '8px' }}>
                    <Zap size={16} /> GENERATE RECOVERY LINK
                  </motion.button>
                  <p style={{ textAlign: 'center', marginTop: '16px' }}>
                    <button type="button" onClick={() => { setIsForgot(false); setError(''); setMessage(''); }}
                      style={{ color: '#FFE500', fontSize: '12px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Orbitron', sans-serif", fontWeight: 700 }}>
                      BACK TO LOGIN
                    </button>
                  </p>
                </div>

              ) : mfaRequired ? (
                /* ── 3. MFA / 3-WAY VERIFICATION ─────────────────────────── */
                <div className="space-y-4 text-center">
                  <div style={{ fontFamily: "'Orbitron', sans-serif", textAlign: 'left' }}>
                    <span style={{ color: '#FFE500', fontSize: '22px', fontWeight: 900 }}>3-WAY</span>
                    <span style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: 900 }}> VERIFICATION</span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', lineHeight: 1.5, textAlign: 'left' }}>
                    Multi-Factor Authentication is enabled. Open your authenticator app (Google Authenticator, Authy, etc.) and enter the 6-digit code.
                  </p>
                  <div className="py-4">
                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', letterSpacing: '0.2em', display: 'block', marginBottom: '12px', textAlign: 'left' }}>
                      ENTER 6-DIGIT CODE
                    </label>
                    <input
                      id="mfa-code-input"
                      type="text" required maxLength={6} pattern="\d{6}" value={mfaCode}
                      onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000 000"
                      autoComplete="one-time-code"
                      className="w-full px-4 py-3 rounded outline-none transition-colors text-center"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,229,0,0.4)', color: '#FFE500', fontSize: '28px', letterSpacing: '0.2em', fontWeight: 900, fontFamily: "'Orbitron', sans-serif" }}
                      onFocus={e => e.target.style.borderColor = '#FFE500'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,229,0,0.4)'}
                    />
                  </div>
                  <motion.button id="mfa-verify-btn" type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full py-4 rounded flex items-center justify-center gap-2"
                    style={{ background: '#FFE500', color: '#0A0A0A', fontFamily: "'Orbitron', sans-serif", fontSize: '13px', fontWeight: 700, letterSpacing: '0.15em', marginTop: '8px' }}>
                    <Zap size={16} /> AUTHORIZE &amp; SECURE
                  </motion.button>
                  <p style={{ textAlign: 'center', marginTop: '16px' }}>
                    <button type="button" onClick={() => { setMfaRequired(false); setError(''); setMfaCode(''); setTempToken(''); }}
                      style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Orbitron', sans-serif", fontWeight: 700 }}>
                      CANCEL LOGIN
                    </button>
                  </p>
                </div>

              ) : (
                /* ── 4. STANDARD LOGIN / REGISTER ─────────────────────────── */
                <>
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', letterSpacing: '0.2em', display: 'block', marginBottom: '6px' }}>
                      EMAIL ADDRESS
                    </label>
                    <input
                      id="auth-email-input"
                      type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded outline-none transition-colors"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,229,0,0.2)', color: '#FFFFFF', fontSize: '14px' }}
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
                        id="auth-username-input"
                        type="text" value={username} onChange={e => setUsername(e.target.value)}
                        placeholder="VOLT_USER"
                        className="w-full px-4 py-3 rounded outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,229,0,0.2)', color: '#FFFFFF', fontSize: '14px' }}
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
                        id="auth-password-input"
                        type={showPassword ? 'text' : 'password'} required value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 rounded outline-none pr-12"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,229,0,0.2)', color: '#FFFFFF', fontSize: '14px' }}
                        onFocus={e => e.target.style.borderColor = '#FFE500'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,229,0,0.2)'}
                      />
                      <button type="button" id="toggle-password-btn" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {mode === 'login' && (
                    <div style={{ textAlign: 'right', marginTop: '-4px' }}>
                      <button id="forgot-password-link" type="button" onClick={() => { setIsForgot(true); setError(''); setMessage(''); }}
                        style={{ color: '#FFE500', fontSize: '12px', background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.8 }}
                        className="hover:opacity-100 transition-opacity">
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  <motion.button id="auth-submit-btn" type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full py-4 rounded flex items-center justify-center gap-2 transition-colors"
                    style={{ background: '#FFE500', color: '#0A0A0A', fontFamily: "'Orbitron', sans-serif", fontSize: '13px', fontWeight: 700, letterSpacing: '0.15em', marginTop: '8px' }}>
                    <Zap size={16} />
                    {mode === 'login' ? 'ENTER THE VOLT' : 'JOIN THE VYBE'}
                  </motion.button>

                  {mode === 'login' && (
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'center' }}>
                      Demo: demo@voltvybe.com / demo1234
                    </p>
                  )}
                </>
              )}

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-2 px-4 py-3 rounded"
                  style={{ background: 'rgba(255,60,60,0.1)', border: '1px solid rgba(255,60,60,0.3)', color: '#FF6B6B', fontSize: '13px' }}>
                  <AlertCircle size={14} />
                  {error}
                </motion.div>
              )}

              {message && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-2 px-4 py-3 rounded"
                  style={{ background: 'rgba(60,255,60,0.1)', border: '1px solid rgba(60,255,60,0.3)', color: '#6BFF6B', fontSize: '13px' }}>
                  <CheckCircle size={14} />
                  {message}
                </motion.div>
              )}

            </motion.form>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
