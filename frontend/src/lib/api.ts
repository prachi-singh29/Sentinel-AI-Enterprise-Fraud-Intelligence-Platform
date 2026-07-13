import type {
  Transaction, TransactionPage, KPIStats, TimeseriesPoint,
  CategoryBreakdown, CountryBreakdown, User,
} from "@/types";

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const WS_BASE = API_BASE.replace(/^http/, "ws");

function getToken() {
  return localStorage.getItem("sentinel_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || "Request failed");
  }
  return res.json();
}

export const api = {
  async login(email: string, password: string) {
    const form = new URLSearchParams();
    form.set("username", email);
    form.set("password", password);
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(body.detail || "Login failed");
    }
    return res.json() as Promise<{ access_token: string; user: User }>;
  },

  async register(email: string, full_name: string, password: string) {
    return request<{ access_token: string; user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, full_name, password }),
    });
  },

  async me() {
    return request<User>("/api/auth/me");
  },

  async getKpis() {
    return request<KPIStats>("/api/dashboard/kpis");
  },

  async getTimeseries(hours = 24) {
    return request<TimeseriesPoint[]>(`/api/dashboard/timeseries?hours=${hours}`);
  },

  async getByCategory() {
    return request<CategoryBreakdown[]>("/api/dashboard/by-category");
  },

  async getByCountry() {
    return request<CountryBreakdown[]>("/api/dashboard/by-country");
  },

  async getTransactions(params: Record<string, string | number | undefined> = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    });
    return request<TransactionPage>(`/api/transactions?${qs.toString()}`);
  },

  async getTransaction(id: string) {
    return request<Transaction>(`/api/transactions/${id}`);
  },

  async reviewTransaction(transaction_id: string, decision: string, notes?: string) {
    return request(`/api/transactions/review`, {
      method: "POST",
      body: JSON.stringify({ transaction_id, decision, notes }),
    });
  },
};

export function setToken(token: string) {
  localStorage.setItem("sentinel_token", token);
}
export function clearToken() {
  localStorage.removeItem("sentinel_token");
}
export { getToken };
