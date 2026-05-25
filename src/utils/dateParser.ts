import { parse, isValid } from 'date-fns';

export const parseClinicalDate = (dateStrRaw: any): number | null => {
  if (!dateStrRaw) return null;
  
  // Limpiar caracteres invisibles y comillas
  let dateStr = String(dateStrRaw).replace(/[\u200B-\u200D\uFEFF'"]/g, '').trim();
  if (!dateStr) return null;

  // Normalizar delimitadores: convertir puntos y barras invertidas a barras normales
  if (!/^\d+(\.\d+)?$/.test(dateStr)) {
      dateStr = dateStr.replace(/[.\\]/g, '/');
  }

  const now = new Date();

  // Si es un número puro, determinamos su origen por la longitud
  if (/^\d+(\.\d+)?$/.test(dateStr)) {
     const numStr = dateStr.split('.')[0];
     const num = parseFloat(dateStr);
     
     if (numStr.length <= 6) {
         // Excel Serial (ej: 46146)
         const time = (num - 25569) * 86400 * 1000;
         return isNaN(time) ? null : time;
     } else if (numStr.length === 8) {
         // YYYYMMDD (ej: 20260504)
         const yyyy = numStr.substring(0, 4);
         const mm = numStr.substring(4, 6);
         const dd = numStr.substring(6, 8);
         const parsed = parse(`${yyyy}-${mm}-${dd}`, 'yyyy-MM-dd', now);
         if (isValid(parsed)) return parsed.getTime();
     } else if (numStr.length === 10) {
         // Unix Timestamp en segundos
         return num * 1000;
     } else if (numStr.length >= 13) {
         // Unix Timestamp en milisegundos
         return num;
     }
  }

  // Lista de formatos clínicos posibles en España e internacional
  const formatsToTry = [
    // Formatos con meses en texto (ej: 04-May-2026)
    'dd-MMM-yyyy HH:mm:ss',
    'dd-MMM-yyyy',
    'dd MMM yyyy HH:mm:ss',
    'dd MMM yyyy',
    // 4 dígitos
    'dd/MM/yyyy HH:mm:ss',
    'dd/MM/yyyy HH:mm',
    'dd/MM/yyyy',
    'dd-MM-yyyy HH:mm:ss',
    'dd-MM-yyyy HH:mm',
    'dd-MM-yyyy',
    'yyyy-MM-dd HH:mm:ss.SSS',
    'yyyy-MM-dd HH:mm:ss',
    'yyyy-MM-dd HH:mm',
    'yyyy-MM-dd',
    'yyyy/MM/dd HH:mm:ss',
    'yyyy/MM/dd HH:mm',
    'yyyy/MM/dd',
    'MM/dd/yyyy hh:mm:ss a',
    'MM/dd/yyyy HH:mm:ss',
    'MM/dd/yyyy HH:mm',
    'MM/dd/yyyy',
    // 2 dígitos
    'dd/MM/yy HH:mm:ss',
    'dd/MM/yy HH:mm',
    'dd/MM/yy',
    'dd-MM-yy HH:mm:ss',
    'dd-MM-yy HH:mm',
    'dd-MM-yy',
    'yy-MM-dd HH:mm:ss',
    'yy-MM-dd HH:mm',
    'yy-MM-dd',
    'MM/dd/yy hh:mm:ss a',
    'MM/dd/yy HH:mm:ss',
    'MM/dd/yy HH:mm',
    'MM/dd/yy'
  ];



  // Intentamos con notación ISO nativa primero
  const nativeDate = new Date(dateStr);
  if (!isNaN(nativeDate.getTime()) && dateStr.includes('T')) {
      return nativeDate.getTime();
  }

  // Intentamos iterar sobre los formatos soportados
  for (const fmt of formatsToTry) {
    const parsed = parse(dateStr, fmt, now);
    if (isValid(parsed)) {
      // Evitar que un patrón 'yyyy' acepte un año de 2 dígitos y lo convierta en 0026
      if (fmt.includes('yyyy') && parsed.getFullYear() < 100) {
        continue;
      }
      return parsed.getTime();
    }
  }

  // Si falla todo pero el nativo JS logró parsear algo lógico
  if (!isNaN(nativeDate.getTime())) {
    const yr = nativeDate.getFullYear();
    // Prevenir el mismo bug en el parseador nativo
    if (yr >= 100) return nativeDate.getTime();
  }

  return null;
};

export function extractFecha(data: Record<string, string | string[]>): string {
  const rawValue = data['EC_Fecha_Toma'] || data['FECHA_TOMA'] || data['FECHA'] || '';
  const raw = String(rawValue);
  if (!raw) return '--';
  const ts = parseClinicalDate(raw);
  if (!ts) return raw.includes(' ') ? raw.split(' ')[0] : raw;
  
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function extractHora(data: Record<string, string | string[]>): string {
  const rawValue = data['EC_Fecha_Toma'] || data['FECHA_TOMA'] || data['FECHA'] || '';
  const raw = String(rawValue);
  const hStrValue = data['HORA_TOMA'] || data['EC_Hora_Toma'] || data['HORA'] || '';
  const hStr = String(hStrValue);
  
  if (hStr && hStr.includes(':')) return hStr.slice(0, 5);
  if (raw.includes(' ')) return raw.split(' ')[1]?.slice(0, 5) || '--:--';
  return '--:--';
}

