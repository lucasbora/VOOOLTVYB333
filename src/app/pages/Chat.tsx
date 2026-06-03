import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { apiClient, ChatMessage, getWsUrl } from '../api/apiClient';
import { Send, MessageCircle, Users, Zap, Wifi, WifiOff } from 'lucide-react';

const ROOMS = [
  { id: 'global', label: 'GLOBAL', color: '#FFE500' },
  { id: 'drops',  label: 'DROPS',  color: '#00E5FF' },
  { id: 'style',  label: 'STYLE',  color: '#FF3366' },
];

export function Chat() {
  const { user } = useApp();
  const [roomId, setRoomId] = useState('global');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Chat history is automatically loaded via WebSocket on connection.

  // WebSocket connection
  useEffect(() => {
    if (!user) return;

    let isCancelled = false;
    setMessages([]);

    const connect = () => {
      if (isCancelled) return;

      const ws = new WebSocket(
        getWsUrl(`/ws/chat?roomId=${encodeURIComponent(roomId)}&userId=${encodeURIComponent(user.id)}`)
      );
      wsRef.current = ws;

      ws.onopen = () => {
        if (isCancelled) {
          ws.close();
          return;
        }
        setConnected(true);
      };

      ws.onclose = () => {
        if (isCancelled) return;
        setConnected(false);
        setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();

      ws.onmessage = (e) => {
        if (isCancelled) return;
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'CHAT_HISTORY') {
            setMessages(msg.messages ?? []);
          } else if (msg.type === 'CHAT_MESSAGE' && msg.message) {
            setMessages(prev => {
              if (prev.some(m => m._id === msg.message._id)) return prev;
              return [...prev, msg.message];
            });
          }
        } catch { /* ignore */ }
      };
    };

    connect();
    return () => {
      isCancelled = true;
      wsRef.current?.close();
    };
  }, [roomId, user?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate online count fluctuation
  useEffect(() => {
    const iv = setInterval(() => {
      setOnlineCount(2 + Math.floor(Math.random() * 5));
    }, 8000);
    return () => clearInterval(iv);
  }, []);

  const sendMessage = () => {
    const trimmed = text.trim();
    if (!trimmed || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'CHAT_MESSAGE', text: trimmed }));
    setText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const activeRoom = ROOMS.find(r => r.id === roomId) ?? ROOMS[0];

  if (!user) {
    return (
      <div style={{ color: 'rgba(255,255,255,0.4)', padding: '48px', textAlign: 'center' }}>
        Please log in to use chat.
      </div>
    );
  }

  return (
    <div
      style={{
        height: 'calc(100vh - 0px)',
        display: 'flex',
        flexDirection: 'column',
        background: '#0A0A0A',
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255,229,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255,229,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <MessageCircle size={20} color="#FFE500" />
          <div>
            <div style={{ color: '#FFE500', fontSize: '14px', fontWeight: 700, fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.1em' }}>
              VOLT CHAT
            </div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.2em' }}>
              REAL-TIME MESSAGING
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
            <Users size={14} />
            <span>{onlineCount} online</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            color: connected ? '#00E5FF' : '#FF6B6B', fontSize: '11px',
          }}>
            {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
            {connected ? 'LIVE' : 'CONNECTING'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar: rooms */}
        <div style={{
          width: '180px',
          borderRight: '1px solid rgba(255,229,0,0.1)',
          padding: '16px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '9px', letterSpacing: '0.3em', padding: '4px 12px 8px' }}>
            ROOMS
          </div>
          {ROOMS.map(room => (
            <button
              key={room.id}
              onClick={() => setRoomId(room.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: roomId === room.id ? `${room.color}18` : 'transparent',
                borderLeft: roomId === room.id ? `3px solid ${room.color}` : '3px solid transparent',
                color: roomId === room.id ? room.color : 'rgba(255,255,255,0.45)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                fontFamily: "'Orbitron', sans-serif",
                transition: 'all 0.15s',
              }}
            >
              # {room.label}
            </button>
          ))}
        </div>

        {/* Messages area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Room indicator */}
          <div style={{
            padding: '10px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ color: activeRoom.color, fontSize: '13px', fontWeight: 700, fontFamily: "'Orbitron', sans-serif" }}>
              #{activeRoom.label}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>
              {messages.length} messages
            </span>
          </div>

          {/* Message list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', marginTop: '40px', fontSize: '13px' }}>
                No messages yet. Be the first to chat!
              </div>
            )}

            <AnimatePresence>
              {messages.map((msg, idx) => {
                const isOwn = msg.userId === user.id;
                const prevMsg = messages[idx - 1];
                const showHeader = !prevMsg || prevMsg.userId !== msg.userId;

                return (
                  <motion.div
                    key={msg._id ?? `${msg.userId}-${idx}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isOwn ? 'flex-end' : 'flex-start',
                      marginTop: showHeader ? '12px' : '2px',
                    }}
                  >
                    {showHeader && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px',
                        flexDirection: isOwn ? 'row-reverse' : 'row',
                      }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: isOwn
                            ? 'linear-gradient(135deg, #FFE500, #FF9900)'
                            : 'linear-gradient(135deg, #00E5FF, #7C3AED)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', fontWeight: 700, color: '#0A0A0A',
                          fontFamily: "'Orbitron', sans-serif",
                        }}>
                          {msg.username?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                          {msg.username}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}

                    <div style={{
                      maxWidth: '70%',
                      padding: '8px 14px',
                      borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isOwn
                        ? 'linear-gradient(135deg, rgba(255,229,0,0.2), rgba(255,229,0,0.08))'
                        : 'rgba(255,255,255,0.06)',
                      border: isOwn
                        ? '1px solid rgba(255,229,0,0.3)'
                        : '1px solid rgba(255,255,255,0.06)',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                    }}>
                      {msg.text}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}>
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${activeRoom.label.toLowerCase()}…`}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255,229,0,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: '#FFFFFF',
                fontSize: '14px',
                outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = '#FFE500'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,229,0,0.15)'; }}
              maxLength={1000}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={sendMessage}
              disabled={!text.trim() || !connected}
              style={{
                width: 44, height: 44,
                borderRadius: '8px',
                border: 'none',
                cursor: text.trim() && connected ? 'pointer' : 'not-allowed',
                background: text.trim() && connected ? '#FFE500' : 'rgba(255,255,255,0.1)',
                color: text.trim() && connected ? '#0A0A0A' : 'rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              <Send size={18} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Connection indicator (bottom) */}
      {!connected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            padding: '8px 24px',
            background: 'rgba(255,68,68,0.12)',
            borderTop: '1px solid rgba(255,68,68,0.3)',
            color: '#FF6B6B',
            fontSize: '11px',
            letterSpacing: '0.1em',
            textAlign: 'center',
          }}
        >
          <Zap size={12} style={{ display: 'inline', marginRight: 6 }} />
          RECONNECTING TO CHAT SERVER…
        </motion.div>
      )}
    </div>
  );
}
