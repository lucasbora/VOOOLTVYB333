import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { ClothingItem, initialItems } from '../data/items';
import { apiClient, SessionUser } from '../api/apiClient';

interface User extends SessionUser { }

export interface Activity {
  id: string;
  type: 'added' | 'updated' | 'deleted' | 'login' | 'register' | 'logout';
  label: string;
  timestamp: number;
}

type QueuedOp =
  | { id: string; type: 'create'; data: Omit<ClothingItem, 'id'> }
  | { id: string; type: 'update'; itemId: string; data: Partial<ClothingItem> }
  | { id: string; type: 'delete'; itemId: string };

interface AppContextType {
  items: ClothingItem[];
  user: User | null;
  isAuthenticated: boolean;
  isOnline: boolean;
  activities: Activity[];
  login: (email: string, password: string) => Promise<{ success: boolean; mfaRequired?: boolean; tempToken?: string }>;
  verifyMfaLogin: (tempToken: string, code: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (email: string, username: string, password: string) => Promise<boolean>;
  logout: () => void;
  addItem: (item: Omit<ClothingItem, 'id'>) => Promise<void>;
  updateItem: (id: string, item: Partial<ClothingItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  getItem: (id: string) => ClothingItem | undefined;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  USER: 'volt_vybe_user',
  TOKEN: 'volt_vybe_token',
  ACTIVITIES: 'volt_vybe_activities',
  ITEMS_CACHE: 'volt_vybe_items_cache',
  ITEMS_CACHE_LEGACY: 'volt_vybe_items',
  OFFLINE_QUEUE: 'volt_vybe_offline_queue',
};

const MAX_ACTIVITIES = 20;
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes → auto-logout

function isRetryableSyncError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return true;
  const status = (err as { status?: unknown }).status;
  if (typeof status !== 'number') return true;
  return status >= 500;
}

// ─── Offline queue helpers ────────────────────────────────────────────────────
function getQueue(): QueuedOp[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE) ?? '[]'); }
  catch { return []; }
}
function saveQueue(q: QueuedOp[]) {
  localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(q));
}
function enqueue(op: QueuedOp) {
  const queue = getQueue();
  if (op.type === 'create') {
    saveQueue([...queue, op]);
    return;
  }
  const filtered = queue.filter((q) => {
    if (q.type === 'create') return true;
    return q.itemId !== op.itemId;
  });
  saveQueue([...filtered, op]);
}
function clearQueue() {
  localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
}
function dropQueuedOpsForItem(itemId: string) {
  const queue = getQueue();
  const filtered = queue.filter((op) => {
    if (op.type === 'create') return op.id !== itemId;
    return op.itemId !== itemId;
  });
  if (filtered.length === 0) clearQueue();
  else saveQueue(filtered);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ClothingItem[]>(() => {
    try {
      const c = localStorage.getItem(STORAGE_KEYS.ITEMS_CACHE)
        ?? localStorage.getItem(STORAGE_KEYS.ITEMS_CACHE_LEGACY);
      return c ? JSON.parse(c) : initialItems;
    }
    catch { return initialItems; }
  });

  const [user, setUser] = useState<User | null>(() => {
    try { const s = localStorage.getItem(STORAGE_KEYS.USER); return s ? JSON.parse(s) : null; }
    catch { return null; }
  });

  // Sync stored JWT token into apiClient on mount
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    apiClient.setToken(token);
  }, []);

  const [activities, setActivities] = useState<Activity[]>(() => {
    try { const s = localStorage.getItem(STORAGE_KEYS.ACTIVITIES); return s ? JSON.parse(s) : []; }
    catch { return []; }
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const wsRef = useRef<WebSocket | null>(null);
  const backendReachableRef = useRef(true);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Persist items cache ──────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ITEMS_CACHE, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  }, [activities]);

  // ─── Auth helpers ─────────────────────────────────────────────────────────
  const logActivity = (type: Activity['type'], label: string) => {
    setActivities(prev => [
      { id: Date.now().toString(), type, label, timestamp: Date.now() },
      ...prev,
    ].slice(0, MAX_ACTIVITIES));
  };

  const doLogout = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    // Best-effort server-side log (fire-and-forget)
    apiClient.logout().catch(() => { });
    apiClient.setToken(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    setUser(null);
  }, []);

  // ─── Inactivity timer ─────────────────────────────────────────────────────
  const resetInactivityTimer = useCallback(() => {
    if (!user) return; // only track while logged in
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      logActivity('logout', 'Session expired due to inactivity');
      doLogout();
    }, INACTIVITY_TIMEOUT);
  }, [user, doLogout]);

  useEffect(() => {
    if (!user) {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      return;
    }

    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    const handler = () => resetInactivityTimer();
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    resetInactivityTimer(); // start timer immediately on login

    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [user, resetInactivityTimer]);

  // ─── Load items from backend on mount ────────────────────────────────────
  useEffect(() => {
    loadFromServer();
  }, []);

  const loadFromServer = async () => {
    try {
      const pages: ClothingItem[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const result = await apiClient.getItems({ page, limit: 100 });
        pages.push(...result.data);
        totalPages = result.totalPages;
        page++;
      } while (page <= totalPages);
      setItems(pages);
    } catch {
      // Server unreachable — keep cached / initial items
    }
  };

  // ─── Offline / online detection ───────────────────────────────────────────
  useEffect(() => {
    let lastBackendReachable = false;
    let syncing = false;

    const maybeSyncQueue = () => {
      if (syncing) return;
      syncing = true;
      syncOfflineQueue().finally(() => { syncing = false; });
    };

    const checkBackendReachability = async () => {
      try {
        await apiClient.getGeneratorStatus();
        backendReachableRef.current = true;
        return true;
      } catch {
        backendReachableRef.current = false;
        return false;
      }
    };

    const checkConnectivity = async () => {
      const browserOnline = navigator.onLine;
      setIsOnline(browserOnline);

      if (!browserOnline) {
        backendReachableRef.current = false;
        lastBackendReachable = false;
        return false;
      }

      const backendReachable = await checkBackendReachability();
      if (backendReachable && !lastBackendReachable) maybeSyncQueue();
      lastBackendReachable = backendReachable;
      return browserOnline;
    };

    checkConnectivity();

    const handleOnline = () => { checkConnectivity(); };
    const handleOffline = () => {
      setIsOnline(false);
      lastBackendReachable = backendReachableRef.current;
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkConnectivity();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);
    const intervalId = window.setInterval(() => { checkConnectivity(); }, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(intervalId);
    };
  }, []);

  const syncOfflineQueue = async () => {
    const queue = getQueue();
    if (queue.length === 0) return;
    const syncedTempIdMap = new Map<string, string>();
    for (let i = 0; i < queue.length; i++) {
      const op = queue[i];
      try {
        if (op.type === 'create') {
          const created = await apiClient.createItem(op.data);
          syncedTempIdMap.set(op.id, created.id);
        } else if (op.type === 'update') {
          const itemId = syncedTempIdMap.get(op.itemId) ?? op.itemId;
          await apiClient.updateItem(itemId, op.data);
        } else if (op.type === 'delete') {
          const itemId = syncedTempIdMap.get(op.itemId) ?? op.itemId;
          await apiClient.deleteItem(itemId);
        }
      } catch {
        saveQueue(queue.slice(i));
        return;
      }
    }
    clearQueue();
    await loadFromServer();
  };

  // ─── WebSocket — generator live updates ──────────────────────────────────
  useEffect(() => {
    const connect = () => {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'ITEM_ADDED' && msg.item) {
            setItems(prev => {
              if (prev.some(i => i.id === msg.item.id)) return prev;
              return [msg.item, ...prev];
            });
            logActivity('added', `[AUTO] ${msg.item.name} generated`);
          }
        } catch { /* ignore malformed messages */ }
      };

      ws.onclose = () => {
        setTimeout(connect, 3000);
      };
    };

    connect();
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; mfaRequired?: boolean; tempToken?: string }> => {
    try {
      const res = await apiClient.login({ email, password });
      if ('mfaRequired' in res) {
        return { success: true, mfaRequired: true, tempToken: res.tempToken };
      }
      const { token, user: userData } = res;
      apiClient.setToken(token);
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      setUser(userData as User);
      logActivity('login', `${userData.username} logged in`);
      return { success: true };
    } catch {
      return { success: false };
    }
  };

  const verifyMfaLogin = async (tempToken: string, code: string): Promise<boolean> => {
    try {
      const { token, user: userData } = await apiClient.verifyMfa(tempToken, code);
      apiClient.setToken(token);
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      setUser(userData as User);
      logActivity('login', `${userData.username} logged in (MFA)`);
      return true;
    } catch {
      return false;
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiClient.forgotPassword(email);
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Request failed' };
    }
  };

  const resetPassword = async (token: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiClient.resetPassword({ token, password });
      return { success: res.success, message: res.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Reset failed' };
    }
  };

  const register = async (email: string, username: string, password: string): Promise<boolean> => {
    try {
      const roleCode = email.endsWith('@admin.voltvybe.com') ? 'ADMIN' : 'USER';
      const { token, user: userData } = await apiClient.register({ email, username, password, roleCode });
      apiClient.setToken(token);
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      setUser(userData);
      logActivity('register', `${username} joined VOLT VYBE`);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    if (user) logActivity('logout', `${user.username} logged out`);
    doLogout();
  };

  // ─── CRUD — API with offline fallback ────────────────────────────────────
  const addItem = async (data: Omit<ClothingItem, 'id'>) => {
    const normalizedData = { ...data, inStock: data.stock > 0 };
    const tempId = `temp_${Date.now()}`;
    const optimistic: ClothingItem = { ...normalizedData, id: tempId };
    setItems(prev => [optimistic, ...prev]);
    logActivity('added', `Added "${normalizedData.name}"`);

    if (!backendReachableRef.current) {
      enqueue({ id: tempId, type: 'create', data: normalizedData });
      return;
    }
    try {
      const created = await apiClient.createItem(normalizedData);
      setItems(prev => prev.map(i => i.id === tempId ? created : i));
      dropQueuedOpsForItem(tempId);
    } catch (err) {
      if (isRetryableSyncError(err)) {
        enqueue({ id: tempId, type: 'create', data: normalizedData });
      } else {
        setItems(prev => prev.filter(i => i.id !== tempId));
      }
    }
  };

  const updateItem = async (id: string, data: Partial<ClothingItem>) => {
    const normalizedData = data.stock !== undefined
      ? { ...data, inStock: data.stock > 0 }
      : data;
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...normalizedData } : i));
    const item = items.find(i => i.id === id);
    if (item) logActivity('updated', `Updated "${normalizedData.name ?? item.name}"`);

    if (!backendReachableRef.current) {
      enqueue({ id: Date.now().toString(), type: 'update', itemId: id, data: normalizedData });
      return;
    }
    try {
      await apiClient.updateItem(id, normalizedData);
      dropQueuedOpsForItem(id);
    } catch (err) {
      if (isRetryableSyncError(err)) {
        enqueue({ id: Date.now().toString(), type: 'update', itemId: id, data: normalizedData });
      } else {
        await loadFromServer();
      }
    }
  };

  const deleteItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) logActivity('deleted', `Deleted "${item.name}"`);
    setItems(prev => prev.filter(i => i.id !== id));

    if (!backendReachableRef.current) {
      enqueue({ id: Date.now().toString(), type: 'delete', itemId: id });
      return;
    }
    try {
      await apiClient.deleteItem(id);
      dropQueuedOpsForItem(id);
    } catch (err) {
      if (isRetryableSyncError(err)) {
        enqueue({ id: Date.now().toString(), type: 'delete', itemId: id });
      } else {
        await loadFromServer();
      }
    }
  };

  const getItem = (id: string) => items.find(i => i.id === id);

  return (
    <AppContext.Provider value={{
      items, user, isAuthenticated: !!user, isOnline, activities,
      login, verifyMfaLogin, forgotPassword, resetPassword, register, logout,
      addItem, updateItem, deleteItem, getItem,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
