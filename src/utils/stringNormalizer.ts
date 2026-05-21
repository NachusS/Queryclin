/**
 * Utilidades de normalización de cadenas de texto para el procesamiento del lenguaje natural clínico.
 */

/**
 * Convierte un string a minúsculas y elimina tildes/diacríticos.
 * Ideal para indexación y comparación de términos.
 */
const normalizerCache = new Map<string, string>();
const compactCache = new Map<string, string>();
const MAX_CACHE_SIZE = 5000;

export const normalizeString = (str: any): string => {
  if (typeof str !== 'string') return '';
  if (!str) return '';
  
  const cached = normalizerCache.get(str);
  if (cached !== undefined) return cached;
  
  const normalized = str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (normalizerCache.size >= MAX_CACHE_SIZE) {
    let count = 0;
    for (const key of normalizerCache.keys()) {
      normalizerCache.delete(key);
      count++;
      if (count >= MAX_CACHE_SIZE / 2) break;
    }
  }
  normalizerCache.set(str, normalized);
  return normalized;
};

/**
 * Limpia un término a su forma más compacta (solo letras y números),
 * eliminando espacios y caracteres especiales.
 */
export const compactString = (str: string): string => {
  const cached = compactCache.get(str);
  if (cached !== undefined) return cached;
  
  const compacted = normalizeString(str).replace(/[^a-z0-9]/g, '');
  if (compactCache.size >= MAX_CACHE_SIZE) {
    let count = 0;
    for (const key of compactCache.keys()) {
      compactCache.delete(key);
      count++;
      if (count >= MAX_CACHE_SIZE / 2) break;
    }
  }
  compactCache.set(str, compacted);
  return compacted;
};
