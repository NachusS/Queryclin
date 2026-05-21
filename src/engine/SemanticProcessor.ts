import { CLINICAL_SYNONYMS, STEM_WHITELIST } from './clinicalSynonyms';
import { normalizeString } from '../utils/stringNormalizer';

// Invertir el diccionario de sinónimos para acceso rápido O(1)
// Variante -> Token Canónico
const VARIANT_TO_CANONICAL = new Map<string, string>();

for (const [canonical, variants] of Object.entries(CLINICAL_SYNONYMS)) {
  const canonicalClean = normalizeString(canonical).replace(/[^a-z0-9]/g, '');
  VARIANT_TO_CANONICAL.set(canonical, canonical); // El canónico se mapea a sí mismo
  if (canonicalClean !== canonical) {
    VARIANT_TO_CANONICAL.set(canonicalClean, canonical);
  }
  for (const variant of variants) {
    // PRESERVAR ESPACIOS para detección de frases multi-palabra
    const normalized = normalizeString(variant);
    VARIANT_TO_CANONICAL.set(normalized, canonical);
    
    // Guardar versión compacta (alfanumérica pura) para getCanonical
    const compacted = normalized.replace(/[^a-z0-9]/g, '');
    if (compacted !== normalized && compacted.length > 0) {
      VARIANT_TO_CANONICAL.set(compacted, canonical);
    }
  }
}

// Pre-calculo de frases multi-palabra ordenadas por longitud descendente para emparejar la más larga primero.
// Esto evita la re-creación y ordenación en cada llamada a normalize().
const MULTI_WORD_PHRASES_REGEXES = Array.from(VARIANT_TO_CANONICAL.keys())
  .filter(k => k.includes(' '))
  .sort((a, b) => b.length - a.length)
  .map(phrase => ({
    phrase,
    regex: new RegExp(`\\b${phrase}\\b`, 'gi'),
    canonical: VARIANT_TO_CANONICAL.get(phrase) || ''
  }));

// Stopwords lingüísticas y clínicas (solo para limpieza, no alteran semántica estructural)
const STOPWORDS = new Set([
  'de','el','la','y','en','del','los','las','un','una','con','por','para','su','al','lo',
  'como','mas','pero','sus','este','esta','se','ha','si','o','entre','cuando','muy','sin',
  'sobre','tambien','me','hasta','hay','donde','quien','desde','todo','nos','durante',
  'todos','uno','les','ni','contra','otros','ese','eso','ante','ellos','e','esto','mi',
  'antes','algunos','que','unos','yo','otro','otras','otra','el','tanto','esa','estos',
  'mucho','quienes','nada','muchos','cual','poco','ella','estar','estas','algunas','algo',
  'nosotros','mis','tu','te','ti','tus',
  // Clínicas filler
  'paciente','refiere','presenta','muestra','signos','cuadro','clinico','inicio','hace',
  'horas','dias','meses','anos','ingreso','alta','relevantes'
].map(normalizeString));

export class SemanticProcessor {
  
  /**
   * Normalización básica (NFD + minúsculas).
   */
  public static normalize(text: string): string {
    let normalized = normalizeString(text);
    
    // Pre-reemplazo de frases multi-palabra conocidas usando la lista estática optimizada
    for (let i = 0; i < MULTI_WORD_PHRASES_REGEXES.length; i++) {
      const entry = MULTI_WORD_PHRASES_REGEXES[i];
      if (normalized.includes(entry.phrase)) {
        normalized = normalized.replace(entry.regex, ` ${entry.canonical} `);
      }
    }
    
    return normalized;
  }

  /**
   * Obtiene la raíz clínica estricta basada en whitelist.
   */
  public static getStem(token: any): string {
    if (typeof token !== 'string') return '';
    return STEM_WHITELIST[token] || token;
  }

  /**
   * Obtiene el token canónico (sinónimo principal) de una variante.
   */
  public static getCanonical(token: any): string | undefined {
    if (typeof token !== 'string') return undefined;
    const cleanToken = normalizeString(token).replace(/[^a-z0-9]/g, '');
    return VARIANT_TO_CANONICAL.get(cleanToken);
  }

  /**
   * Expande un token a todas sus variantes semánticas conocidas.
   * Útil para resaltado o match semántico (no necesario en QueryEngine si ya indexamos canónicos).
   */
  public static expand(token: string): string[] {
    const canonical = this.getCanonical(token);
    if (!canonical) return [token];

    const variants = CLINICAL_SYNONYMS[canonical] || [];
    return [canonical, ...variants];
  }

  /**
   * Tokenizador Clínico Real.
   * Conserva símbolos vitales y decimales. Expande sinónimos canónicos implícitamente.
   */
  public static tokenize(text: any): string[] {
    if (typeof text !== 'string' || !text) return [];
    
    const normalized = this.normalize(text);
    
    // Regex que captura letras, números, símbolos de unidades y decimales.
    // Ignora separadores puros como espacios o comas aisladas.
    const rawTokens = normalized.match(/[A-Za-z0-9µ°+\/._-]+/g) || [];
    
    const tokens: string[] = [];
    
    for (const raw of rawTokens) {
      // Limpiar bordes de signos de puntuación, pero preservando signos interiores (1.5, Na+)
      let clean = raw.replace(/^[.,_/\-]+|[.,_/\-]+$/g, '');
      if (clean.length < 1) continue;

      if (STOPWORDS.has(clean)) continue;
      
      // Aplicar stemming whitelist
      clean = this.getStem(clean);
      tokens.push(clean);

      // Si tiene un canónico, lo agregamos también para máxima indexación/recuperabilidad
      const canonical = this.getCanonical(clean);
      if (canonical && canonical !== clean) {
        tokens.push(canonical);
      }
    }

    return [...new Set(tokens)];
  }

  /**
   * Match estructural puro. 
   * Comprueba si ALGÚN token de fieldTokens coincide EXACTAMENTE con el queryToken buscado (o sus expansiones).
   * No interpreta lógica booleana AND. Sirve para validar si un campo específico contiene una palabra.
   */
  public static match(fieldValue: string, queryToken: string): boolean {
    const fieldTokens = this.tokenize(fieldValue);
    const queryVariants = this.expand(this.getStem(this.normalize(queryToken)));
    
    return queryVariants.some(variant => fieldTokens.includes(variant));
  }

  /**
   * Construye una Expresión Regular para Highlight que cubre todas las variantes semánticas.
   */
  public static buildHighlightRegex(query: string): RegExp | null {
    if (!query.trim()) return null;

    const normalizedQuery = this.normalize(query);
    const rawTerms = [...query.split(/\s+/), ...normalizedQuery.split(/\s+/)].filter(t => t.length > 1 && !['AND', 'OR', 'NOT'].includes(t.toUpperCase()));
    
    const allVariants = new Set<string>();
    
    for (let term of rawTerms) {
      if (term.startsWith('-')) term = term.substring(1);
      
      const normalized = this.normalize(term);
      const stemmed = this.getStem(normalized);
      
      // Añadir la literal original (sin normalizar)
      allVariants.add(term);
      // Añadir la raíz
      allVariants.add(stemmed);
      
      // Añadir variantes canónicas
      const expansions = this.expand(stemmed);
      expansions.forEach(exp => allVariants.add(exp));
    }

    if (allVariants.size === 0) return null;

    // Escapar para regex y unir con OR
    const escaped = Array.from(allVariants).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    // Ordenar por longitud descendente para que la regex capture la coincidencia más larga primero
    escaped.sort((a, b) => b.length - a.length);

    return new RegExp(`(${escaped.join('|')})`, 'gi');
  }

}
