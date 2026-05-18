import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { apiClient, AuditLogEntry, ObservationEntry } from '../api/apiClient';
import {
  Shield, AlertTriangle, Activity, Clock, User, Zap,
  Eye, ChevronDown, ChevronUp, RefreshCw,
} from 'lucide-react';

const RISK_COLOR = (score: number) => {
  if (score >= 90) return '#FF3366';
  if (score >= 70) return '#FF9900';
  return '#FFE500';
};

const ACTION_COLORS: Record<string, string> = {
  LOGIN_SUCCESS:   '#00E5FF',
  LOGIN_FAILED:    '#FF3366',
  REGISTER:        '#7C3AED',
  CREATE_ITEM:     '#00FF88',
  UPDATE_ITEM:     '#FFE500',
  REPLACE_ITEM:    '#FFE500',
  DELETE_ITEM:     '#FF3366',
  CREATE_REVIEW:   '#00E5FF',
  DELETE_REVIEW:   '#FF9900',
  CHAT_MESSAGE:    '#00E5FF',
  GENERATOR_START: '#00FF88',
  GENERATOR_STOP:  '#FF9900',
};

function ActionBadge({ action }: { action: string }) {
  const color = ACTION_COLORS[action] ?? '#FFFFFF';
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '4px',
      background: `${color}18`,
      border: `1px solid ${color}44`,
      color,
      fontSize: '10px',
      fontWeight: 700,
      letterSpacing: '0.08em',
      fontFamily: "'Orbitron', sans-serif",
    }}>
      {action}
    </span>
  );
}

function RiskBar({ score }: { score: number }) {
  const color = RISK_COLOR(score);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        flex: 1, height: '4px', borderRadius: '2px',
        background: 'rgba(255,255,255,0.1)', overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: '2px' }}
        />
      </div>
      <span style={{ color, fontSize: '12px', fontWeight: 700, minWidth: '32px' }}>{score}</span>
    </div>
  );
}

export function AdminPanel() {
  const { user } = useApp();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [watchlist, setWatchlist] = useState<ObservationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'logs' | 'watchlist'>('logs');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState('');

  const isAdmin = user?.roleCode === 'ADMIN';

  const load = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const [l, w] = await Promise.all([apiClient.getAuditLogs(), apiClient.getObservationList()]);
      setLogs(l);
      setWatchlist(w);
    } catch {
      // Unauthorized or server error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div style={{
        minHeight: '80vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '16px',
      }}>
        <Shield size={64} color="rgba(255,255,255,0.1)" />
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', letterSpacing: '0.1em' }}>
          RESTRICTED ACCESS — ADMIN ONLY
        </div>
      </div>
    );
  }

  const filteredLogs = filterAction
    ? logs.filter(l => l.action.toLowerCase().includes(filterAction.toLowerCase()))
    : logs;

  const suspiciousCount = logs.filter(l => l.suspiciousScore >= 70).length;

  return (
    <div style={{ padding: '32px', fontFamily: "'Space Grotesk', sans-serif", color: '#FFFFFF', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <div style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '24px', fontWeight: 900, color: '#FFE500',
            letterSpacing: '0.05em',
          }}>
            ADMIN PANEL
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', letterSpacing: '0.15em', marginTop: '4px' }}>
            SYSTEM MONITORING & SECURITY
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={load}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '8px', border: 'none',
            background: 'rgba(255,229,0,0.1)', color: '#FFE500',
            cursor: 'pointer', fontSize: '12px', fontWeight: 600,
            letterSpacing: '0.1em',
          }}
        >
          <RefreshCw size={14} />
          REFRESH
        </motion.button>
      </div>

      {/* Stats overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'TOTAL EVENTS', value: logs.length, icon: Activity, color: '#00E5FF' },
          { label: 'SUSPICIOUS', value: suspiciousCount, icon: AlertTriangle, color: '#FF3366' },
          { label: 'WATCHLISTED', value: watchlist.length, icon: Eye, color: '#FF9900' },
          { label: 'UNIQUE USERS', value: new Set(logs.map(l => l.userId)).size, icon: User, color: '#7C3AED' },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '20px',
              borderRadius: '12px',
              background: `${color}08`,
              border: `1px solid ${color}25`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Icon size={16} color={color} />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.2em' }}>{label}</span>
            </div>
            <div style={{ color, fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 900 }}>
              {loading ? '—' : value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', padding: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', width: 'fit-content' }}>
        {(['logs', 'watchlist'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: activeTab === tab ? '#FFE500' : 'transparent',
              color: activeTab === tab ? '#0A0A0A' : 'rgba(255,255,255,0.5)',
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
              fontFamily: "'Orbitron', sans-serif",
              transition: 'all 0.15s',
            }}
          >
            {tab === 'logs' ? 'ACTIVITY LOGS' : `WATCHLIST (${watchlist.length})`}
          </button>
        ))}
      </div>

      {/* Activity Logs Tab */}
      {activeTab === 'logs' && (
        <div>
          {/* Filter */}
          <div style={{ marginBottom: '16px' }}>
            <input
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              placeholder="Filter by action type…"
              style={{
                padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(255,229,0,0.2)',
                background: 'rgba(255,255,255,0.05)', color: '#FFFFFF', fontSize: '13px',
                outline: 'none', width: '280px',
              }}
              onFocus={e => { e.target.style.borderColor = '#FFE500'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,229,0,0.2)'; }}
            />
          </div>

          {loading ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px' }}>
              Loading logs…
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px' }}>
              No log entries found.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filteredLogs.map(log => {
                const isExpanded = expandedLog === log.id;
                const isSuspicious = log.suspiciousScore >= 70;
                return (
                  <motion.div
                    key={log.id}
                    layout
                    style={{
                      borderRadius: '8px',
                      border: isSuspicious
                        ? `1px solid ${RISK_COLOR(log.suspiciousScore)}40`
                        : '1px solid rgba(255,255,255,0.06)',
                      background: isSuspicious
                        ? `${RISK_COLOR(log.suspiciousScore)}08`
                        : 'rgba(255,255,255,0.03)',
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                      style={{
                        width: '100%', padding: '12px 16px', border: 'none', cursor: 'pointer',
                        background: 'transparent', display: 'flex', alignItems: 'center',
                        gap: '12px', textAlign: 'left',
                      }}
                    >
                      {isSuspicious && <AlertTriangle size={14} color={RISK_COLOR(log.suspiciousScore)} />}
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <ActionBadge action={log.action} />
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                          {log.user?.username ?? log.userId}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px' }}>
                          {log.actionInfo.slice(0, 60)}
                          {log.actionInfo.length > 60 ? '…' : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 'fit-content' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>
                          <Clock size={10} />
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                        {isSuspicious && (
                          <span style={{
                            padding: '2px 8px', borderRadius: '4px',
                            background: `${RISK_COLOR(log.suspiciousScore)}25`,
                            color: RISK_COLOR(log.suspiciousScore),
                            fontSize: '10px', fontWeight: 700, fontFamily: "'Orbitron', sans-serif",
                          }}>
                            RISK {log.suspiciousScore}
                          </span>
                        )}
                        {isExpanded ? <ChevronUp size={14} color="rgba(255,255,255,0.3)" /> : <ChevronDown size={14} color="rgba(255,255,255,0.3)" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '12px' }}>
                          <div>
                            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.15em', marginBottom: '4px' }}>USER ID</div>
                            <div style={{ color: '#FFFFFF', fontSize: '12px', fontFamily: 'monospace' }}>{log.userId}</div>
                          </div>
                          <div>
                            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.15em', marginBottom: '4px' }}>ROLE</div>
                            <div style={{ color: '#00E5FF', fontSize: '12px', fontWeight: 700 }}>{log.roleCode}</div>
                          </div>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.15em', marginBottom: '4px' }}>ACTION INFO</div>
                            <div style={{ color: '#FFFFFF', fontSize: '12px' }}>{log.actionInfo}</div>
                          </div>
                          <div>
                            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.15em', marginBottom: '4px' }}>SUSPICIOUS SCORE</div>
                            <RiskBar score={log.suspiciousScore} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Watchlist Tab */}
      {activeTab === 'watchlist' && (
        <div>
          {loading ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px' }}>Loading…</div>
          ) : watchlist.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Shield size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: '12px' }} />
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
                No suspicious users detected
              </div>
              <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '12px', marginTop: '6px' }}>
                The system is clean
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {watchlist.map((entry, i) => (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: `${RISK_COLOR(entry.riskScore)}06`,
                    border: `1px solid ${RISK_COLOR(entry.riskScore)}30`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: `${RISK_COLOR(entry.riskScore)}25`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: RISK_COLOR(entry.riskScore), fontWeight: 700,
                        fontFamily: "'Orbitron', sans-serif", fontSize: '14px',
                      }}>
                        {entry.username?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ color: '#FFFFFF', fontWeight: 700 }}>{entry.username}</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{entry.email}</div>
                      </div>
                    </div>

                    <div style={{
                      padding: '4px 12px', borderRadius: '20px',
                      background: `${RISK_COLOR(entry.riskScore)}20`,
                      border: `1px solid ${RISK_COLOR(entry.riskScore)}50`,
                      color: RISK_COLOR(entry.riskScore),
                      fontSize: '11px', fontWeight: 700,
                      fontFamily: "'Orbitron', sans-serif",
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                      <AlertTriangle size={12} />
                      {entry.status}
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.15em', marginBottom: '6px' }}>
                      RISK SCORE
                    </div>
                    <RiskBar score={entry.riskScore} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.15em', marginBottom: '4px' }}>REASON</div>
                      <div style={{ color: '#FFFFFF', fontSize: '13px' }}>{entry.reason}</div>
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.15em', marginBottom: '4px' }}>FLAGGED BY RULE</div>
                      <div style={{ color: RISK_COLOR(entry.riskScore), fontSize: '12px', fontWeight: 600 }}>{entry.flaggedByRule}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                      <Clock size={12} />
                      Added: {new Date(entry.addedAt).toLocaleString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
