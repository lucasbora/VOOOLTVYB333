import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppProvider, useApp } from '../app/context/AppContext';
import { initialItems } from '../app/data/items';

// ─── apiClient mock ───────────────────────────────────────────────────────────
vi.mock('../app/api/apiClient', () => {
  const users = new Map();
  users.set('demo@voltvybe.com', { id: 'demo', email: 'demo@voltvybe.com', username: 'DEMO', password: 'demo1234', roleCode: 'USER' });

  return {
    apiClient: {
      setToken: vi.fn(),
      logout: vi.fn(async () => {}),
      getItems: vi.fn(async () => ({ data: [], totalPages: 1 })),
      getGeneratorStatus: vi.fn(async () => {}),
      login: vi.fn(async ({ email, password }) => {
        const u = users.get(email);
        if (u && u.password === password) {
          const { password: _p, ...userData } = u;
          return { token: 'mock-token', user: userData };
        }
        throw new Error('Invalid credentials');
      }),
      register: vi.fn(async ({ email, username, password }) => {
        if (users.has(email)) throw new Error('Email already registered');
        const newUser = { id: Date.now().toString(), email, username, password, roleCode: 'USER' };
        users.set(email, newUser);
        const { password: _p, ...userData } = newUser;
        return { token: 'mock-token', user: userData };
      })
    }
  };
});

// ─── localStorage mock ────────────────────────────────────────────────────────
const createStoreMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
};

const localStorageMock = createStoreMock();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// ─── Test wrapper ─────────────────────────────────────────────────────────────
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

// ─── Helper: get a fresh context ──────────────────────────────────────────────
// Each renderHook call creates a fresh AppProvider, so state is isolated.

describe('AppContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  // ── Initial state ────────────────────────────────────────────────────────────
  describe('initial state', () => {
    it('loads initial items from data when localStorage is empty', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      expect(result.current.items).toHaveLength(initialItems.length);
    });

    it('starts unauthenticated when localStorage has no user', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('restores persisted items from localStorage', () => {
      const subset = initialItems.slice(0, 3);
      localStorageMock.setItem('volt_vybe_items', JSON.stringify(subset));
      const { result } = renderHook(() => useApp(), { wrapper });
      expect(result.current.items).toHaveLength(3);
    });
  });

  // ── getItem ──────────────────────────────────────────────────────────────────
  describe('getItem', () => {
    it('returns the correct item by id', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      const item = result.current.getItem('1');
      expect(item).toBeDefined();
      expect(item?.id).toBe('1');
      expect(item?.name).toBe('NEON SURGE TEE');
    });

    it('returns undefined for an unknown id', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      expect(result.current.getItem('99999')).toBeUndefined();
    });

    it('returns undefined for empty string id', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      expect(result.current.getItem('')).toBeUndefined();
    });
  });

  // ── addItem ──────────────────────────────────────────────────────────────────
  describe('addItem', () => {
    it('increases items count by 1', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      const before = result.current.items.length;
      const { id: _id, ...itemWithoutId } = initialItems[0];

      act(() => { result.current.addItem(itemWithoutId); });

      expect(result.current.items).toHaveLength(before + 1);
    });

    it('prepends the new item to the list', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      const { id: _id, ...itemWithoutId } = { ...initialItems[0], name: 'FIRST ITEM' };

      act(() => { result.current.addItem(itemWithoutId); });

      expect(result.current.items[0].name).toBe('FIRST ITEM');
    });

    it('assigns a non-empty string id to the new item', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      const { id: _id, ...itemWithoutId } = initialItems[0];

      act(() => { result.current.addItem(itemWithoutId); });

      const newItem = result.current.items[0];
      expect(typeof newItem.id).toBe('string');
      expect(newItem.id.length).toBeGreaterThan(0);
    });

    it('does not reuse an existing id', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      const { id: _id, ...itemWithoutId } = initialItems[0];

      act(() => { result.current.addItem(itemWithoutId); });

      const existingIds = initialItems.map(i => i.id);
      expect(existingIds).not.toContain(result.current.items[0].id);
    });

    it('preserves all fields on the new item', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      const { id: _id, ...itemWithoutId } = {
        ...initialItems[0],
        name: 'FIELD TEST',
        price: 77,
        rating: 4.2,
        stock: 33,
      };

      act(() => { result.current.addItem(itemWithoutId); });

      const newItem = result.current.items[0];
      expect(newItem.name).toBe('FIELD TEST');
      expect(newItem.price).toBe(77);
      expect(newItem.rating).toBe(4.2);
      expect(newItem.stock).toBe(33);
    });
  });

  // ── updateItem ───────────────────────────────────────────────────────────────
  describe('updateItem', () => {
    it('updates specified fields', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => { result.current.updateItem('1', { name: 'UPDATED NAME', price: 999 }); });

      const updated = result.current.getItem('1');
      expect(updated?.name).toBe('UPDATED NAME');
      expect(updated?.price).toBe(999);
    });

    it('preserves fields that are not in the update payload', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      const originalRating = result.current.getItem('1')?.rating;

      act(() => { result.current.updateItem('1', { name: 'PARTIAL UPDATE' }); });

      expect(result.current.getItem('1')?.rating).toBe(originalRating);
    });

    it('does not change the item id', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => { result.current.updateItem('1', { price: 50 }); });

      expect(result.current.getItem('1')?.id).toBe('1');
    });

    it('does not affect other items', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      const originalItem2 = result.current.getItem('2');

      act(() => { result.current.updateItem('1', { name: 'CHANGED' }); });

      expect(result.current.getItem('2')).toEqual(originalItem2);
    });

    it('does nothing for an unknown id', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      const before = result.current.items.length;

      act(() => { result.current.updateItem('99999', { name: 'GHOST' }); });

      expect(result.current.items).toHaveLength(before);
    });
  });

  // ── deleteItem ───────────────────────────────────────────────────────────────
  describe('deleteItem', () => {
    it('removes the item with the given id', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => { result.current.deleteItem('1'); });

      expect(result.current.getItem('1')).toBeUndefined();
    });

    it('decreases the items count by 1', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      const before = result.current.items.length;

      act(() => { result.current.deleteItem('1'); });

      expect(result.current.items).toHaveLength(before - 1);
    });

    it('does not remove other items', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => { result.current.deleteItem('1'); });

      expect(result.current.getItem('2')).toBeDefined();
      expect(result.current.getItem('3')).toBeDefined();
    });

    it('handles a non-existent id without error', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      const before = result.current.items.length;

      act(() => { result.current.deleteItem('99999'); });

      expect(result.current.items).toHaveLength(before);
    });

    it('can delete multiple items sequentially', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      const before = result.current.items.length;

      act(() => { result.current.deleteItem('1'); });
      act(() => { result.current.deleteItem('2'); });

      expect(result.current.items).toHaveLength(before - 2);
      expect(result.current.getItem('1')).toBeUndefined();
      expect(result.current.getItem('2')).toBeUndefined();
    });
  });

  // ── register ─────────────────────────────────────────────────────────────────
  describe('register', () => {
    it('returns true and authenticates for a new email', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      let ok: boolean | undefined;

      await act(async () => { ok = await result.current.register('new@user.com', 'NEWUSER', 'password123'); });

      expect(ok).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('sets user email and username on successful register', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => { await result.current.register('volt@test.com', 'VOLTFAN', 'abc123abc'); });

      expect(result.current.user?.email).toBe('volt@test.com');
      expect(result.current.user?.username).toBe('VOLTFAN');
    });

    it('returns false when email is already registered', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      let ok2: boolean | undefined;

      await act(async () => { await result.current.register('dup@user.com', 'USER1', 'password123'); });
      await act(async () => { ok2 = await result.current.register('dup@user.com', 'USER2', 'password456'); });

      expect(ok2).toBe(false);
    });

    it('persists user to localStorage on successful register', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => { await result.current.register('persist@test.com', 'PERSISTED', 'testpass1'); });

      const stored = localStorageMock.getItem('volt_vybe_user');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.email).toBe('persist@test.com');
    });
  });

  // ── login ────────────────────────────────────────────────────────────────────
  describe('login', () => {
    it('authenticates with built-in demo credentials', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      let ok: boolean | undefined;

      await act(async () => { ok = await result.current.login('demo@voltvybe.com', 'demo1234'); });

      expect(ok).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('demo@voltvybe.com');
    });

    it('returns false and stays unauthenticated for wrong credentials', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      let ok: boolean | undefined;

      await act(async () => { ok = await result.current.login('wrong@email.com', 'wrongpass'); });

      expect(ok).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('can log in a previously registered user', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => { await result.current.register('reg@login.com', 'REGUSER', 'mypassword1'); });
      act(() => { result.current.logout(); });

      let ok: boolean | undefined;
      await act(async () => { ok = await result.current.login('reg@login.com', 'mypassword1'); });

      expect(ok).toBe(true);
      expect(result.current.user?.username).toBe('REGUSER');
    });

    it('fails login with the correct email but wrong password', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => { await result.current.register('pass@check.com', 'PASSUSER', 'correctpass'); });
      act(() => { result.current.logout(); });

      let ok: boolean | undefined;
      await act(async () => { ok = await result.current.login('pass@check.com', 'wrongpass'); });

      expect(ok).toBe(false);
    });

    it('sets isAuthenticated to true after successful login', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => { await result.current.login('demo@voltvybe.com', 'demo1234'); });

      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  // ── logout ───────────────────────────────────────────────────────────────────
  describe('logout', () => {
    it('sets isAuthenticated to false', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => { await result.current.login('demo@voltvybe.com', 'demo1234'); });
      expect(result.current.isAuthenticated).toBe(true);

      act(() => { result.current.logout(); });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('clears the user object', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => { await result.current.login('demo@voltvybe.com', 'demo1234'); });
      act(() => { result.current.logout(); });

      expect(result.current.user).toBeNull();
    });

    it('removes user from localStorage', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => { await result.current.login('demo@voltvybe.com', 'demo1234'); });
      act(() => { result.current.logout(); });

      expect(localStorageMock.getItem('volt_vybe_user')).toBeNull();
    });

    it('does not affect items list', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      const itemCount = result.current.items.length;

      await act(async () => { await result.current.login('demo@voltvybe.com', 'demo1234'); });
      act(() => { result.current.logout(); });

      expect(result.current.items).toHaveLength(itemCount);
    });
  });
});
