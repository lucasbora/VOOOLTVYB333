import { ClothingItem } from '../data/items';

const BASE = '/api';

// ─── Token management ────────────────────────────────────────────────────────
let authToken: string | null = null;

try {
  authToken = localStorage.getItem('volt_vybe_token');
} catch {
  authToken = null;
}

export interface PaginatedResponse {
  data: ClothingItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers ?? {});
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);

  const res = await fetch(url, { ...options, headers });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error ?? `HTTP ${res.status}`), { status: res.status, body });
  }
  return res.json();
}

export const apiClient = {
  /** Called by AppContext after login/register to set the active JWT */
  setToken(token: string | null): void {
    authToken = token;
    if (token) localStorage.setItem('volt_vybe_token', token);
    else        localStorage.removeItem('volt_vybe_token');
  },

  /** @deprecated kept for backwards compatibility — use setToken instead */
  setAuthUser(userId: string | null): void {
    // No-op: auth is now handled by JWT, not user ID header.
    // Kept so AppContext code that calls this doesn't break.
    if (!userId) {
      this.setToken(null);
    }
  },

  getItems(params?: { page?: number; limit?: number; category?: string; inStock?: boolean; colorGroup?: string }): Promise<PaginatedResponse> {
    const q = new URLSearchParams();
    if (params?.page)       q.set('page',       String(params.page));
    if (params?.limit)      q.set('limit',      String(params.limit));
    if (params?.category)   q.set('category',   params.category);
    if (params?.colorGroup) q.set('colorGroup', params.colorGroup);
    if (params?.inStock !== undefined) q.set('inStock', String(params.inStock));
    return request<PaginatedResponse>(`${BASE}/items?${q}`);
  },

  getItem(id: string): Promise<ClothingItem> {
    return request<ClothingItem>(`${BASE}/items/${id}`);
  },

  createItem(data: Omit<ClothingItem, 'id'>): Promise<ClothingItem> {
    return request<ClothingItem>(`${BASE}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  updateItem(id: string, data: Partial<Omit<ClothingItem, 'id'>>): Promise<ClothingItem> {
    return request<ClothingItem>(`${BASE}/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  deleteItem(id: string): Promise<void> {
    return request<void>(`${BASE}/items/${id}`, { method: 'DELETE' });
  },

  getStats(): Promise<Record<string, unknown>> {
    return request<Record<string, unknown>>(`${BASE}/stats`);
  },

  startGenerator(): Promise<{ status: string }> {
    return request<{ status: string }>(`${BASE}/generator/start`, { method: 'POST' });
  },

  stopGenerator(): Promise<{ status: string }> {
    return request<{ status: string }>(`${BASE}/generator/stop`, { method: 'POST' });
  },

  getGeneratorStatus(): Promise<{ running: boolean }> {
    return request<{ running: boolean }>(`${BASE}/generator/status`);
  },

  /** Returns { token, user } */
  register(data: { email: string; username: string; password: string; roleCode?: 'ADMIN' | 'USER' }): Promise<AuthResponse> {
    return request<AuthResponse>(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /** Returns { token, user } */
  login(data: { email: string; password: string }): Promise<AuthResponse> {
    return request<AuthResponse>(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  logout(): Promise<void> {
    return request<void>(`${BASE}/auth/logout`, { method: 'POST' });
  },

  getMe(): Promise<SessionUser> {
    return request<SessionUser>(`${BASE}/auth/me`);
  },

  getObservationList(): Promise<ObservationEntry[]> {
    return request<ObservationEntry[]>(`${BASE}/admin/observation-list`);
  },

  getAuditLogs(): Promise<AuditLogEntry[]> {
    return request<AuditLogEntry[]>(`${BASE}/admin/logs`);
  },

  getChatHistory(roomId: string): Promise<ChatMessage[]> {
    return request<ChatMessage[]>(`${BASE}/chat/${encodeURIComponent(roomId)}/messages`);
  },

  createChatMessage(data: { roomId: string; text: string }): Promise<ChatMessage> {
    return request<ChatMessage>(`${BASE}/chat/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  getReviews(itemId: string): Promise<Review[]> {
    return request<Review[]>(`${BASE}/items/${itemId}/reviews`);
  },

  createReview(itemId: string, data: { author: string; rating: number; comment: string }): Promise<Review> {
    return request<Review>(`${BASE}/items/${itemId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  deleteReview(itemId: string, reviewId: string): Promise<void> {
    return request<void>(`${BASE}/items/${itemId}/reviews/${reviewId}`, { method: 'DELETE' });
  },
};

export interface AuthResponse {
  token: string;
  user: SessionUser;
}

export interface Review {
  id: string;
  itemId: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  roleCode: 'ADMIN' | 'USER';
  permissions: string[];
}

export interface ChatMessage {
  _id?: string;
  roomId: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

export interface ObservationEntry {
  userId: string;
  email: string;
  username: string;
  reason: string;
  status: string;
  riskScore: number;
  flaggedByRule: string;
  addedAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  roleCode: string;
  action: string;
  actionInfo: string;
  createdAt: string;
  suspiciousScore: number;
  user: {
    email: string;
    username: string;
  };
}
