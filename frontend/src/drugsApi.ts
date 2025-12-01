import type { Drug } from "./DrugTypes";
import { mockDrugs } from "./mock/DrugMock";

// Функция проверки Tauri - вызывается в runtime, не при загрузке модуля
function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  // Проверяем по hostname - в Tauri это tauri.localhost
  if (window.location.hostname === 'tauri.localhost') return true;
  // Проверяем глобальные объекты Tauri
  if ('__TAURI__' in window || '__TAURI_INTERNALS__' in window) return true;
  return false;
}

// API URL - пустой для относительных путей в браузере
const API_BASE_URL = '';

// Timeout для API запросов (3 секунды)
const API_TIMEOUT = 3000;

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function listDrugs(params?: { 
  name?: string; 
  concentration_min?: number;
  concentration_max?: number;
}): Promise<Drug[]> {
  // В Tauri (desktop) ВСЕГДА используем mock данные - бэкенд недоступен
  if (isTauri()) {
    console.log("[API] Tauri desktop mode - using mock data");
    return filterMockDrugs(params);
  }
  
  try {
    let path = `${API_BASE_URL}/api/drugs/`;
    if (params) {
      const query = new URLSearchParams();
      if (params.name) query.append("name", params.name);
      if (params.concentration_min) query.append("concentration_min", params.concentration_min.toString());
      if (params.concentration_max) query.append("concentration_max", params.concentration_max.toString());
      const queryString = query.toString();
      if (queryString) path += `?${queryString}`;
    }

    const res = await fetchWithTimeout(path, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("[API] error fetching drugs, using mock data", err);
    return filterMockDrugs(params);
  }
}

function filterMockDrugs(params?: { name?: string; concentration_min?: number; concentration_max?: number }): Drug[] {
  return mockDrugs.filter((d) => {
    let matches = true;
    if (params?.name) {
      matches = matches && d.name.toLowerCase().includes(params.name.toLowerCase());
    }
    if (params?.concentration_min !== undefined) {
      matches = matches && d.concentration >= params.concentration_min;
    }
    if (params?.concentration_max !== undefined) {
      matches = matches && d.concentration <= params.concentration_max;
    }
    return matches;
  });
}

export async function getDrug(id: number): Promise<Drug | null> {
  // В Tauri (desktop) ВСЕГДА используем mock данные
  if (isTauri()) {
    console.log("[API] Tauri desktop mode - using mock data for drug", id);
    return mockDrugs.find(d => d.id === id) || null;
  }
  
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/drugs/${id}/`, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("[API] error fetching drug, using mock data", err);
    return mockDrugs.find(d => d.id === id) || null;
  }
}

export interface CartInfo {
  order_id: number;
  count: number;
}

export async function getCartInfo(): Promise<CartInfo> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/orders/cart/`, { 
      headers: { Accept: "application/json" },
      credentials: 'include'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("[API] error fetching cart info", err);
    return { order_id: 0, count: 0 };
  }
}
