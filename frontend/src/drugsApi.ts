import type { Drug } from "./DrugTypes";

const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

const API_BASE_URL = isTauri 
  ? 'http://localhost:8005'
  : (import.meta.env.VITE_API_BASE_URL || '');

// Функция для преобразования URL изображений через прокси порта 3005
function proxyImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  
  // Если Tauri, возвращаем как есть
  if (isTauri) return url;
  
  // В dev режиме (с Vite proxy): заменяем localhost:9000 на пустую строку
  // http://localhost:9000/images/... -> /images/...
  // В production: заменяем localhost:9000 на API_BASE_URL
  // http://localhost:9000/images/... -> http://192.168.1.240:8005/images/...
  if (API_BASE_URL) {
    // Production mode - используем API_BASE_URL
    return url.replace('http://localhost:9000', API_BASE_URL);
  } else {
    // Dev mode - используем Vite proxy
    return url.replace('http://localhost:9000', '');
  }
}

// Функция для преобразования Drug объекта с проксированным URL
export function proxyDrugImageUrl(drug: Drug): Drug {
  return {
    ...drug,
    image_url: proxyImageUrl(drug.image_url)
  };
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Accept': 'application/json',
  };
  
  if (API_BASE_URL && API_BASE_URL.includes('ngrok')) {
    headers['ngrok-skip-browser-warning'] = '1';
  }
  return headers;
}

export async function listDrugs(params?: { 
  name?: string; 
  concentration_min?: number;
  concentration_max?: number;
}): Promise<Drug[]> {
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

    const res = await fetch(path, { headers: getHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const drugs: Drug[] = await res.json();
    // Преобразуем URL изображений для работы через прокси
    return drugs.map(proxyDrugImageUrl);
  } catch (err) {
    console.warn("[API] error fetching drugs", err);
    return [];
  }
}

export async function getDrug(id: number): Promise<Drug | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/drugs/${id}/`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const drug: Drug = await res.json();
    // Преобразуем URL изображения для работы через прокси
    return proxyDrugImageUrl(drug);
  } catch (err) {
    console.warn("[API] error fetching drug", err);
    return null;
  }
}

export interface CartInfo {
  estimation_request_id: number;
  count: number;
}

export async function getCartInfo(): Promise<CartInfo> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/estimation_requests/cart/`, { 
      headers: getHeaders(),
      credentials: 'include'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("[API] error fetching cart info", err);
    return { estimation_request_id: 0, count: 0 };
  }
}
