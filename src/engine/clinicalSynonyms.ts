// ============================================================
// CLINICAL SYNONYMS & STEMMING WHITELIST
// ============================================================

/**
 * Whitelist de Stemming Clínico.
 * Un mapeo estricto y seguro de variaciones de género y número a su raíz canónica.
 * Solo se deben incluir variantes que sean semánticamente idénticas en contexto clínico.
 */
export const STEM_WHITELIST: Record<string, string> = Object.assign(Object.create(null), {
  // Género y Número
  'fumadora': 'fumador',
  'fumadores': 'fumador',
  'fumadoras': 'fumador',
  'diabetico': 'diabetes',
  'diabetica': 'diabetes',
  'diabeticos': 'diabetes',
  'diabeticas': 'diabetes',
  'pacientes': 'paciente',
  'hipertenso': 'hipertension',
  'hipertensa': 'hipertension',
  'hipertensos': 'hipertension',
  'hipertensas': 'hipertension',
  'asmatica': 'asma',
  'asmatico': 'asma',
  'asmaticos': 'asma',
  'asmaticas': 'asma',
  'isquemico': 'isquemia',
  'isquemica': 'isquemia',
  // Plurales comunes
  'infartos': 'infarto',
  'tumores': 'tumor',
  'neoplasias': 'neoplasia',
  'infecciones': 'infeccion',
  'crisis': 'crisis', // invariante
  'fracturas': 'fractura',
  'lesiones': 'lesion',
  'arritmias': 'arritmia',
  'trombos': 'trombo',
  'sintomas': 'sintoma',
  'signos': 'signo',
  'metastasis': 'metastasis',
  'alergias': 'alergia'
});

/**
 * Sinónimos Bidireccionales Exactos.
 * Términos que significan estrictamente lo mismo y pueden intercambiarse sin pérdida de contexto.
 */
export const EXACT_SYNONYMS: Record<string, string[]> = Object.assign(Object.create(null), {
  'hta': ['hipertension', 'hipertension arterial', 'presion alta', 'tension alta', 'pa alta'],
  'dm': ['diabetes', 'diabetes mellitus', 'dbt'],
  'dm1': ['diabetes tipo 1', 'diabetes mellitus tipo 1'],
  'dm2': ['diabetes tipo 2', 'diabetes mellitus tipo 2'],
  'ic': ['icc', 'insuficiencia cardiaca', 'fallo cardiaco', 'insuf cardiaca', 'insuficiencia cardiaca congestiva'],
  'epoc': ['enfermedad pulmonar obstructiva cronica', 'bronquitis cronica'],
  'asma': ['broncoespasmo', 'crisis asmatica', 'reagudizacion asma'],
  'ira': ['insuficiencia renal aguda', 'fallo renal agudo', 'fracaso renal', 'aki'],
  'irc': ['insuficiencia renal cronica', 'enfermedad renal cronica', 'erc', 'ckd'],
  'iam': ['infarto', 'infarto agudo miocardio', 'infarto de miocardio', 'sindrome coronario'],
  'scacest': ['infarto con elevacion del st', 'stemi'],
  'scasest': ['infarto sin elevacion del st', 'nstemi'],
  'angor': ['angina', 'angina de pecho', 'dolor toracico isquemico'],
  'ictus': ['avc', 'accidente cerebrovascular', 'ataque cerebral', 'stroke'],
  'ait': ['accidente isquemico transitorio'],
  'epilepsia': ['crisis epileptica', 'convulsiones', 'crisis comicial', 'comicio'],
  'neoplasia': ['tumor', 'cancer', 'ca', 'carcinoma', 'adenocarcinoma'],
  'sepsis': ['septicemia', 'bacteriemia', 'shock septico', 'sindrome septico'],
  'neumonia': ['pac', 'neumonia adquirida comunidad', 'bronconeumonia'],
  'itu': ['uti', 'infeccion urinaria', 'infeccion tracto urinario'],
  'tep': ['tromboembolismo pulmonar', 'embolia pulmonar', 'pe'],
  'tvp': ['trombosis venosa profunda', 'dvt', 'trombosis'],
  'anemia': ['hemoglobina baja', 'hb baja', 'hgb baja', 'ferropenia'],
  'apendicitis': ['apendicectomia', 'apendice'],
  'colecistitis': ['colecistectomia', 'colelitiasis', 'calculo biliar', 'vesicula'],
  'depresion': ['sindrome depresivo', 'episodio depresivo mayor', 'tdm', 'trastorno depresivo'],
  'ansiedad': ['trastorno ansiedad', 'crisis ansiedad', 'crisis panico', 'trastorno panico'],
  'covid': ['covid19', 'covid-19', 'sars-cov-2', 'coronavirus']
});

/**
 * Jerarquía Semántica (Unidireccional: De general a específico).
 * Un término paraguas expande a sus subtipos para búsquedas generales,
 * pero los subtipos NO deben apuntar a la raíz para no causar falsos positivos.
 * Ejemplo: buscar "DM" debe encontrar "DM1", pero buscar "DM1" NO debe buscar "DM" en abstracto.
 */
export const BROAD_TO_NARROW_SYNONYMS: Record<string, string[]> = Object.assign(Object.create(null), {
  'dm': ['dm1', 'dm2'],
  'iam': ['scacest', 'scasest'],
  'itu': ['cistitis', 'pielonefritis'],
  'neoplasia': ['metastasis'],
  'epoc': ['enfisema']
});
