import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, ShieldCheck, ShieldOff, AlertCircle, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { apiClient } from '../api/apiClient';

interface MfaSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type MfaStep = 'status' | 'setup' | 'enable' | 'disable';

export function MfaSettingsModal({ isOpen, onClose }: MfaSettingsModalProps) {
  const [step, setStep] = useState<MfaStep>('status');
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [secret, setSecret] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    } else {
      // Reset state when closed
      setStep('status');
      setCode('');
      setError('');
      setSuccess('');
      setSecret('');
    }
  }, [isOpen]);

  async function loadStatus() {
    try {
      const res = await apiClient.getMfaStatus();
      setTotpEnabled(res.totpEnabled);
      setStep('status');
    } catch {
      setError('Failed to load MFA status.');
    }
  }

  async function handleSetup() {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.setupMfa();
      setSecret(res.secret);
      setOtpauthUrl(res.otpauthUrl);
      setStep('enable');
    } catch {
      setError('Failed to start MFA setup. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleEnable() {
    if (!/^\d{6}$/.test(code)) { setError('Please enter a valid 6-digit code.'); return; }
    setLoading(true);
    setError('');
    try {
      await apiClient.enableMfa(code);
      setTotpEnabled(true);
      setSuccess('MFA has been enabled! Your account is now protected with 3-way authentication.');
      setStep('status');
      setCode('');
    } catch {
      setError('Invalid code. Please check your authenticator app and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    if (!/^\d{6}$/.test(code)) { setError('Please enter a valid 6-digit code.'); return; }
    setLoading(true);
    setError('');
    try {
      await apiClient.disableMfa(code);
      setTotpEnabled(false);
      setSuccess('MFA has been disabled.');
      setStep('status');
      setCode('');
    } catch {
      setError('Invalid code. Please check your authenticator app and try again.');
    } finally {
      setLoading(false);
    }
  }

  function copySecret() {
    navigator.clipboard.writeText(secret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md rounded-xl overflow-hidden"
          style={{ background: '#111111', border: '1px solid rgba(255,229,0,0.2)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'rgba(255,229,0,0.15)' }}>
            <div className="flex items-center gap-3">
              {totpEnabled
                ? <ShieldCheck size={20} style={{ color: '#22c55e' }} />
                : <Shield size={20} style={{ color: '#FFE500' }} />
              }
              <span style={{ fontFamily: "'Orbitron', sans-serif", color: '#FFFFFF', fontWeight: 700, fontSize: '14px', letterSpacing: '0.1em' }}>
                MFA SETTINGS
              </span>
            </div>
            <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.4)' }} className="hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-4">

            {/* Status View */}
            {step === 'status' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg"
                  style={{ background: totpEnabled ? 'rgba(34,197,94,0.08)' : 'rgba(255,229,0,0.05)', border: `1px solid ${totpEnabled ? 'rgba(34,197,94,0.3)' : 'rgba(255,229,0,0.15)'}` }}>
                  <div>
                    <div style={{ color: totpEnabled ? '#22c55e' : '#FFE500', fontWeight: 700, fontSize: '13px', fontFamily: "'Orbitron', sans-serif" }}>
                      {totpEnabled ? '3-WAY AUTH ACTIVE' : '3-WAY AUTH INACTIVE'}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '4px' }}>
                      {totpEnabled
                        ? 'Your account requires a TOTP code on each login.'
                        : 'Enable MFA for stronger account security.'}
                    </div>
                  </div>
                  {totpEnabled ? <ShieldCheck size={24} style={{ color: '#22c55e' }} /> : <ShieldOff size={24} style={{ color: 'rgba(255,255,255,0.2)' }} />}
                </div>

                {success && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', fontSize: '13px' }}>
                    <CheckCircle size={14} /> {success}
                  </div>
                )}

                {totpEnabled ? (
                  <button onClick={() => { setStep('disable'); setError(''); setCode(''); }}
                    className="w-full py-3 rounded flex items-center justify-center gap-2 transition-colors"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '12px', fontFamily: "'Orbitron', sans-serif", fontWeight: 700, letterSpacing: '0.1em' }}>
                    <ShieldOff size={16} /> DISABLE MFA
                  </button>
                ) : (
                  <button onClick={handleSetup} disabled={loading}
                    className="w-full py-3 rounded flex items-center justify-center gap-2 transition-colors"
                    style={{ background: '#FFE500', color: '#0A0A0A', fontSize: '12px', fontFamily: "'Orbitron', sans-serif", fontWeight: 700, letterSpacing: '0.1em', opacity: loading ? 0.7 : 1 }}>
                    <Shield size={16} /> {loading ? 'SETTING UP...' : 'ENABLE MFA'}
                  </button>
                )}
              </div>
            )}

            {/* Enable MFA — show secret + QR instructions */}
            {step === 'enable' && (
              <div className="space-y-4">
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: 1.6 }}>
                  <strong style={{ color: '#FFE500' }}>Step 1:</strong> Open Google Authenticator, Authy, or any TOTP app and add a new account. Scan the QR code or manually enter the secret key below.
                </p>

                {/* otpauth link */}
                <a href={otpauthUrl} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 py-3 rounded transition-colors"
                  style={{ background: 'rgba(255,229,0,0.08)', border: '1px solid rgba(255,229,0,0.25)', color: '#FFE500', fontSize: '12px', fontFamily: "'Orbitron', sans-serif", fontWeight: 700 }}>
                  <ExternalLink size={14} /> OPEN IN AUTHENTICATOR APP
                </a>

                {/* Manual secret */}
                <div className="p-3 rounded" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.2em', marginBottom: '6px' }}>MANUAL ENTRY KEY</div>
                  <div className="flex items-center justify-between gap-2">
                    <code style={{ color: '#FFE500', fontSize: '13px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{secret}</code>
                    <button onClick={copySecret} style={{ color: copied ? '#22c55e' : 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                      {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                  <strong style={{ color: '#FFE500' }}>Step 2:</strong> Enter the 6-digit code from your app to confirm setup.
                </p>

                <input
                  id="mfa-enable-code"
                  type="text" maxLength={6} value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full px-4 py-3 rounded outline-none text-center"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,229,0,0.3)', color: '#FFE500', fontSize: '24px', fontFamily: 'monospace', letterSpacing: '0.3em' }}
                />

                <button onClick={handleEnable} disabled={loading}
                  className="w-full py-3 rounded flex items-center justify-center gap-2"
                  style={{ background: '#FFE500', color: '#0A0A0A', fontSize: '12px', fontFamily: "'Orbitron', sans-serif", fontWeight: 700, letterSpacing: '0.1em', opacity: loading ? 0.7 : 1 }}>
                  <ShieldCheck size={16} /> {loading ? 'VERIFYING...' : 'ACTIVATE MFA'}
                </button>

                <button onClick={() => setStep('status')} style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'center' }}>
                  Cancel
                </button>
              </div>
            )}

            {/* Disable MFA */}
            {step === 'disable' && (
              <div className="space-y-4">
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: 1.6 }}>
                  Enter your current 6-digit TOTP code to confirm disabling MFA.
                </p>
                <input
                  id="mfa-disable-code"
                  type="text" maxLength={6} value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full px-4 py-3 rounded outline-none text-center"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '24px', fontFamily: 'monospace', letterSpacing: '0.3em' }}
                />
                <button onClick={handleDisable} disabled={loading}
                  className="w-full py-3 rounded flex items-center justify-center gap-2"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', fontSize: '12px', fontFamily: "'Orbitron', sans-serif", fontWeight: 700, letterSpacing: '0.1em', opacity: loading ? 0.7 : 1 }}>
                  <ShieldOff size={16} /> {loading ? 'DISABLING...' : 'CONFIRM DISABLE MFA'}
                </button>
                <button onClick={() => setStep('status')} style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'center' }}>
                  Cancel
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded" style={{ background: 'rgba(255,60,60,0.1)', border: '1px solid rgba(255,60,60,0.3)', color: '#FF6B6B', fontSize: '13px' }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
