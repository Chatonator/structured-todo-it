/**
 * Utilitaires centralisés de persistance localStorage
 */

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Charge une valeur depuis localStorage (sans expiration)
 */
export function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Persiste une valeur dans localStorage (sans expiration)
 */
export function saveStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

/**
 * Charge une valeur quotidienne — retourne le fallback si la date stockée ≠ aujourd'hui
 */
export function loadDailyStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed.date !== getTodayKey()) return fallback;
    return parsed.data ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Persiste une valeur avec la date du jour
 */
export function saveDailyStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ date: getTodayKey(), data }));
  } catch {}
}
