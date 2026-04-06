import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ClothingItem, initialItems } from '../data/items';

interface User {
  email: string;
  username: string;
}

export interface Activity {
  id: string;
  type: 'added' | 'updated' | 'deleted' | 'login' | 'register' | 'logout';
  label: string;
  timestamp: number;
}

interface AppContextType {
  items: ClothingItem[];
  user: User | null;
  isAuthenticated: boolean;
  activities: Activity[];
  login: (email: string, password: string) => boolean;
  register: (email: string, username: string, password: string) => boolean;
  logout: () => void;
  addItem: (item: Omit<ClothingItem, 'id'>) => void;
  updateItem: (id: string, item: Partial<ClothingItem>) => void;
  deleteItem: (id: string) => void;
  getItem: (id: string) => ClothingItem | undefined;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  ITEMS: 'volt_vybe_items',
  USER: 'volt_vybe_user',
  USERS: 'volt_vybe_users',
  ACTIVITIES: 'volt_vybe_activities',
};

const MAX_ACTIVITIES = 20;

export function AppProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ClothingItem[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.ITEMS);
    return stored ? JSON.parse(stored) : initialItems;
  });

  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  }, [activities]);

  const logActivity = (type: Activity['type'], label: string) => {
    const entry: Activity = {
      id: Date.now().toString(),
      type,
      label,
      timestamp: Date.now(),
    };
    setActivities(prev => [entry, ...prev].slice(0, MAX_ACTIVITIES));
  };

  const login = (email: string, password: string): boolean => {
    const stored = localStorage.getItem(STORAGE_KEYS.USERS);
    const users: Array<{ email: string; username: string; password: string }> = stored ? JSON.parse(stored) : [];
    const found = users.find(u => u.email === email && u.password === password);
    if (found) {
      const userData = { email: found.email, username: found.username };
      setUser(userData);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      logActivity('login', `${found.username} logged in`);
      return true;
    }
    if (email === 'demo@voltvybe.com' && password === 'demo1234') {
      const userData = { email, username: 'VOLT_DEMO' };
      setUser(userData);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      logActivity('login', 'VOLT_DEMO logged in');
      return true;
    }
    return false;
  };

  const register = (email: string, username: string, password: string): boolean => {
    const stored = localStorage.getItem(STORAGE_KEYS.USERS);
    const users: Array<{ email: string; username: string; password: string }> = stored ? JSON.parse(stored) : [];
    if (users.find(u => u.email === email)) return false;
    const updated = [...users, { email, username, password }];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    const userData = { email, username };
    setUser(userData);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    logActivity('register', `${username} joined VOLT VYBE`);
    return true;
  };

  const logout = () => {
    if (user) logActivity('logout', `${user.username} logged out`);
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
  };

  const addItem = (item: Omit<ClothingItem, 'id'>) => {
    const newItem: ClothingItem = { ...item, id: Date.now().toString() };
    setItems(prev => [newItem, ...prev]);
    logActivity('added', `Added "${item.name}"`);
  };

  const updateItem = (id: string, updates: Partial<ClothingItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    const item = items.find(i => i.id === id);
    if (item) logActivity('updated', `Updated "${updates.name ?? item.name}"`);
  };

  const deleteItem = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) logActivity('deleted', `Deleted "${item.name}"`);
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const getItem = (id: string) => items.find(item => item.id === id);

  return (
    <AppContext.Provider value={{
      items, user, isAuthenticated: !!user,
      activities,
      login, register, logout,
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
