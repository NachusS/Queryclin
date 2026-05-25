import { EXACT_SYNONYMS, BROAD_TO_NARROW_SYNONYMS, STEM_WHITELIST } from './clinicalSynonyms';
import { normalizeString } from '../utils/stringNormalizer';

const VARIANT_TO_CANONICAL = new Map<string, string>();
const EXPANSION_MAP = new Map<string, string[]>(); // Canonical -> all valid query expansions

const REVERSE_STEM_MAP = new Map<string, string[]>();
for (const [variant, stem] of Object.entries(STEM_WHITELIST)) {
  const list = REVERSE_STEM_MAP.get(stem) || [];
  list.push(variant);
  REVERSE_STEM_MAP.set(stem, list);
}

// 1. Populate EXACT_SYNONYMS (Bidirectional mapping)
for (const [canonical, variants] of Object.entries(EXACT_SYNONYMS)) {
  const canonicalClean = normalizeString(canonical).replace(/[^a-z0-9]/g, '');
  VARIANT_TO_CANONICAL.set(canonical, canonical);
  if (canonicalClean !== canonical) {
    VARIANT_TO_CANONICAL.set(canonicalClean, canonical);
  }
  
  const expansions = new Set<string>([canonical]);

  for (const variant of variants) {
    // PRESERVAR ESPACIOS para detección de frases multi-palabra
    const normalized = normalizeString(variant);
    VARIANT_TO_CANONICAL.set(normalized, canonical);
    
    // Guardar versión compacta
    const compacted = normalized.replace(/[^a-z0-9]/g, '');
    if (compacted !== normalized && compacted.length > 0) {
      VARIANT_TO_CANONICAL.set(compacted, canonical);
    }
    expansions.add(variant);
  }
  EXPANSION_MAP.set(canonical, Array.from(expansions));
}

// 2. Populate BROAD_TO_NARROW_SYNONYMS (Unidirectional mapping)
for (const [broad, narrowTypes] of Object.entries(BROAD_TO_NARROW_SYNONYMS)) {
   const currentExpansions = EXPANSION_MAP.get(broad) || [broad];
   for (const narrow of narrowTypes) {
      currentExpansions.push(narrow);
      const narrowVariants = EXACT_SYNONYMS[narrow] || [];
      currentExpansions.push(...narrowVariants);
   }
   EXPANSION_MAP.set(broad, Array.from(new Set(currentExpansions)));
}

// Pre-calculo de frases multi-palabra
const MULTI_WORD_PHRASES_REGEXES = Array.from(VARIANT_TO_CANONICAL.keys())
  .filter(k => k.includes(' '))
  .sort((a, b) => b.length - a.length)
  .map(phrase => ({
    phrase,
    regex: new RegExp(`\\b${phrase}\\b`, 'gi'),
    canonical: VARIANT_TO_CANONICAL.get(phrase) || ''
  }));

// Stopwords lingüísticas y filler clínico (se eliminaron 'ingreso', 'alta', 'cuadro', 'inicio' por fidelidad contextual)
const STOPWORDS = new Set([
  'de','el','la','y','en','del','los','las','un','una','con','por','para','su','al','lo',
  'como','mas','pero','sus','este','esta','se','ha','si','o','entre','cuando','muy', // 'sin' quitado para Negation
  'sobre','tambien','me','hasta','hay','donde','quien','desde','todo','nos','durante',
  'todos','uno','les','ni','contra','otros','ese','eso','ante','ellos','e','esto','mi',
  'antes','algunos','que','unos','yo','otro','otras','otra','el','tanto','esa','estos',
  'mucho','quienes','nada','muchos','cual','poco','ella','estar','estas','algunas','algo',
  'nosotros','mis','tu','te','ti','tus',
  // Clínicas filler
  'paciente','refiere','presenta','muestra','hace',
  'horas','dias','meses','anos','relevantes'
].map(normalizeString));

// Triggers para Negation Shielding (N-grams)
const NEGATION_TRIGGERS = new Set(['no', 'sin', 'descarta', 'ausencia']);

export class SemanticProcessor {
  
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

  public static getStem(token: any): string {
    if (typeof token !== 'string') return '';
    return STEM_WHITELIST[token] || token;
  }

  public static getCanonical(token: any): string | undefined {
    if (typeof token !== 'string') return undefined;
    const cleanToken = normalizeString(token).replace(/[^a-z0-9]/g, '');
    return VARIANT_TO_CANONICAL.get(cleanToken);
  }

  public static expand(token: string): string[] {
    const canonical = this.getCanonical(token);
    if (canonical && EXPANSION_MAP.has(canonical)) {
       return EXPANSION_MAP.get(canonical)!;
    }
    return [token];
  }

  public static tokenize(text: any): string[] {
    if (typeof text !== 'string' || !text) return [];
    
    const normalized = this.normalize(text);
    const rawTokens = normalized.match(/[A-Za-z0-9µ°+\/._-]+/g) || [];
    
    const tokens: string[] = [];
    let negationWindow = 0;
    
    for (const raw of rawTokens) {
      const hasSentenceBoundary = /[.;:!]$/.test(raw);
      let clean = raw.replace(/^[.,_/\-]+|[.,_/\-]+$/g, '');
      if (clean.length < 1) continue;

      if (NEGATION_TRIGGERS.has(clean)) {
        negationWindow = 3; // El escudo de negación cubre los siguientes 3 tokens clínicos
        continue;
      }

      if (STOPWORDS.has(clean)) {
        continue; // Las stopwords no consumen ventana de negación
      }
      
      clean = this.getStem(clean);
      const canonical = this.getCanonical(clean) || clean;
      
      if (negationWindow > 0) {
         tokens.push(`neg_${canonical}`);
         if (canonical !== clean) tokens.push(`neg_${clean}`);
         negationWindow--;
      } else {
         tokens.push(clean);
         if (canonical !== clean) tokens.push(canonical);
      }
      
      // Reset negation window if we hit a sentence boundary (like a period or semicolon)
      if (hasSentenceBoundary) {
         negationWindow = 0;
      }
    }

    return [...new Set(tokens)];
  }

  public static match(fieldValue: string, queryToken: string): boolean {
    const fieldTokens = this.tokenize(fieldValue);
    const queryVariants = this.expand(this.getStem(this.normalize(queryToken)));
    
    return queryVariants.some(variant => fieldTokens.includes(variant));
  }

  public static buildHighlightRegex(query: string): RegExp | null {
    if (!query.trim()) return null;

    const cleanQuery = query.replace(/"/g, ' ');
    const normalizedQuery = this.normalize(cleanQuery);
    const rawTerms = [...cleanQuery.split(/\s+/), ...normalizedQuery.split(/\s+/)].filter(t => t.length > 1 && !['AND', 'OR', 'NOT'].includes(t.toUpperCase()));
    
    const allVariants = new Set<string>();
    
    for (let term of rawTerms) {
      if (term.startsWith('-')) term = term.substring(1);
      
      const normalized = this.normalize(term);
      const stemmed = this.getStem(normalized);
      
      allVariants.add(term);
      allVariants.add(stemmed);
      
      // Add reverse stems for direct term and stemmed term
      const directRevStems = REVERSE_STEM_MAP.get(term) || [];
      directRevStems.forEach(rv => allVariants.add(rv));
      
      const stemmedRevStems = REVERSE_STEM_MAP.get(stemmed) || [];
      stemmedRevStems.forEach(rv => allVariants.add(rv));
      
      const expansions = this.expand(stemmed);
      expansions.forEach(exp => {
        allVariants.add(exp);
        // Add reverse stems for expansion variants too
        const expRevStems = REVERSE_STEM_MAP.get(exp) || [];
        expRevStems.forEach(rv => allVariants.add(rv));
      });
    }

    if (allVariants.size === 0) return null;

    const escaped = Array.from(allVariants).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    escaped.sort((a, b) => b.length - a.length);

    // Usamos lookbehinds y lookaheads para soportar letras con tildes y eñes como límites de palabra, 
    // reemplazando el \b estándar que falla con "caída".
    return new RegExp(`(?<=^|[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ])(${escaped.join('|')})(?=[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]|$)`, 'gi');
  }

}
