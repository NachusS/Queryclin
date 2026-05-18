import { RUNTIME_FORMS } from '../generated/mappings.runtime';

export interface FormMapping {
  id: string;
  name: string;
  keys: {
    nhc: string;
    idToma: string;
    ordenToma: string;
    fechaToma: string;
  };
  demographics: Record<string, string>;
  visualCategories: Record<string, string[]>; // Category name -> array of exact column names
  headerAliases?: Record<string, string[]>; // Canonical Header -> [Source Aliases]
}

const STATIC_FORMS: FormMapping[] = [
  {
    id: 'hce_alg',
    name: 'HCE-ALG',
    keys: {
      nhc: 'N.H.C',
      idToma: 'Id_Toma',
      ordenToma: 'Orden_Toma',
      fechaToma: 'EC_Fecha_Toma',
    },
    headerAliases: {
      'N.H.C': ['N.H.C', 'NHC', 'N.H.C.'],
      'Cipa': ['Cipa', 'CIPA'],
      'Fecha de Nacimiento': ['Fecha de Nacimiento', 'F_Nacimiento'],
      'EC_Sexo': ['EC_Sexo', 'Sexo'],
      'DEMOG-Código postal': ['DEMOG-Código postal', 'CP', 'C.P.'],
      'EC_Fecha_Toma': ['EC_Fecha_Toma', 'Fecha Toma'],
      'EC_Proceso': ['EC_Proceso', 'Proceso'],
      'EC_Proceso2': ['EC_Proceso2', 'Proceso 2'],
      'Ámbito': ['Ámbito', 'Ambito']
    },
    demographics: {
      nhc: 'N.H.C',
      cipa: 'Cipa',
      sexo: 'EC_Sexo',
      fechaNacimiento: 'Fecha de Nacimiento',
      cp: 'DEMOG-Código postal',
      edad: 'Edad',
      ambito: 'Ámbito',
      ciudad: 'EC_Ciudad_Paciente',
      estadoCivil: 'EC_Estado_Civil',
      unidadEnfermeria: 'Unidad de Enfermería',
      reacciones: 'Antecedentes de alergia:'
    },
    visualCategories: {
      '01-ANTECEDENTES': [
        'Antecedentes Familiares Generales', 
        'Antecedentes Personales Generales', 
        'Antecedentes Quirúrgicos Generales', 
        'Motivo de la consulta', 
        'Tratamiento previo'
      ],

      '02-ANAMNESIS Y EXPLORACIÓN': [
        'Enfermedad actual', 'Exploración física'
      ],
      '02-ANAMNESIS Y EXPLORACIÓN > CONSTANTES': [
        'Peso:', 'Talla:', 'IMC:', 'Valoración IMC', 'Superficie Corporal', 'T', 
        'Grupo sanguineo y RH', 'Transfusiones'
      ],
      '02-ANAMNESIS Y EXPLORACIÓN > NOTAS': [
        'Observaciones'
      ],

      '03-DIAGNÓSTICO Y TRATAMIENTO': [
        'Diagnóstico', 'Tratamiento', 'Recomendaciones', 'Proxima revisión', 'Recetas prescritas'
      ],
      '04-RESULTADOS PRUEBAS': [
        'Resultado analítica', 'Resultado anatomía patológica', 'Resultado radiodiagnóstico', 
        'Otras pruebas realizadas', 'Pruebas solicitadas'
      ],
      '05-PROCESO HOSP/CEX': [
        'Juicio Diagnóstico Activo', 'Juicio Diagnóstico Secundario', 'Motivo de Alta', 
        'Motivo de ingreso', 'Resumen de evolución', 'Revisiones posteriores', 
        'Tipo de Ingreso:', 'Tratamiento recomendado', 'Evolución (CEX)'
      ]
    }

  },
  {
    id: 'hce_mir',
    name: 'HCE-MIR',
    keys: {
      nhc: 'N.H.C',
      idToma: 'Id_Toma',
      ordenToma: 'Orden_Toma',
      fechaToma: 'EC_Fecha_Toma',
    },
    headerAliases: {
      'N.H.C': ['NHC', 'N.H.C.', 'N.H.C'],
      'Años desde que dejo de fumar': ['Años desde que dejo de fumar', 'Años desde que dejó de fumar'],
      'Años fumando': ['Años fumando', 'Años Fumando'],
      'Cigarrillos al dia': ['Cigarrillos al dia', 'Cigarrillos al día'],
      'HTA (Hipertensión Arterial)': ['HTA (Hipertensión Arterial)', 'HTA', 'Hipertensión Arterial', 'HTA:', 'Hipertensión Arterial:', 'Hipertension Arterial'],
      'IMC:': ['IMC:', 'IMC'],
      'Peso:': ['Peso:', 'Peso'],
      'Talla:': ['Talla:', 'Talla'],
      'Enfermedad Actual': ['Enfermedad Actual', 'Enfermedad actual', 'Enfermedad Actual:', 'Enfermedad actual:'],
      'Exploración Física': ['Exploración Física', 'Exploracion Fisica', 'Exploración física', 'Exploración Física:', 'Exploración física:'],
      'Motivo de Consulta': ['Motivo de Consulta', 'Motivo de la consulta'],
      'Otras Pruebas Realizadas': ['Otras Pruebas Realizadas', 'Otras pruebas realizadas'],
      'Próxima revisión': ['Próxima revisión', 'Proxima revisión', 'Proxima revision'],
      'Pruebas solicitadas': ['Pruebas solicitadas', 'Pruebas solicitadas:', 'PRUEBAS SOLICITADAS'],
      'Id_Toma': ['Id_Toma', 'Identificador Toma', 'ID_TOMA'],
      'Orden_Toma': ['Orden_Toma', 'Version Registro', 'ORDEN_TOMA'],
      'Cipa': ['Cipa', 'cipa', 'CIPA'],
      'EC_Sexo': ['EC_Sexo', 'sexo', 'Sexo'],
      'Fecha de Nacimiento': ['Fecha de Nacimiento', 'fechaNacimiento', 'F_Nacimiento'],
      'DEMOG-Código postal': ['DEMOG-Código postal', 'cp', 'CP', 'C.P.'],
      'Edad': ['Edad', 'edad', 'EDAD'],
      'Ámbito': ['Ámbito', 'ambito', 'Ambito'],
      'EC_Ciudad_Paciente': ['EC_Ciudad_Paciente', 'ciudad', 'CIUDAD'],
      'Tratamiento Previo': ['Tratamiento Previo', 'Tratamiento previo', 'Tratamiento Previo:', 'Tratamiento previo:'],
      'Resultado Analítica': ['Resultado Analítica', 'Resultado analítica', 'Resultado Analítica:', 'Resultado analítica:'],
      'O2 Hb': ['O2 Hb', 'Oxihemoglobina (O2 Hb)', 'O2 Hb:', 'Oxihemoglobina', 'Saturación O2', 'Saturación O2:'],
      'Diabetes Mellitus': ['Diabetes Mellitus', 'Diabetes mellitus', 'Diabetes Mellitus:', 'Diabetes mellitus:'],
      'Detalles DM': ['Detalles DM', 'Detalles Diabetes Mellitus', 'Detalles Diabetes mellitus', 'Detalles DM:', 'Detalles Diabetes Mellitus:'],
      'Detalles Hipertensión Arterial': ['Detalles Hipertensión Arterial', 'Detalles HTA', 'Detalles Hipertensión Arterial:', 'Detalles HTA:'],
      'Dislipemia': ['Dislipemia', 'Dislipemia:', 'Dislipidemia', 'Dislipidemia:'],
      'Detalles Dislipemia': ['Detalles Dislipemia', 'Detalles Dislipidemia', 'Detalles Dislipemia:', 'Detalles Dislipidemia:'],
      'Situación Basal (Otros)': ['Situación Basal (Otros)', 'Situación Basal', 'Situación basal', 'Situación Basal:', 'Situación basal (otros)']
    },
    demographics: {
      cipa: 'Cipa',
      cp: 'DEMOG-Código postal',
      sexo: 'EC_Sexo',
      fechaNacimiento: 'Fecha de Nacimiento',
      nhc: 'N.H.C',
      proceso2: 'EC_Proceso2',
      reacciones: 'Reacciones Adversas a fármacos',
      unidadEnfermeria: 'Unidad de Enfermería'
    },
    visualCategories: {
      '01-ANTECEDENTES': [
        'Antecedentes Familiares Generales', 'Antecedentes MIR:', 'Antecedentes Personales Generales', 
        'Antecedentes Quirúrgicos Generales', 'Tratamiento Previo'
      ],

      '02-ANAMNESIS Y EXPLORACION': [
        'Enfermedad Actual', 'Exploración Física'
      ],
      '02-ANAMNESIS Y EXPLORACION > CONSTANTES': [
        'IMC:', 'Valoración IMC', 'Diabetes Mellitus', 'Detalles DM', 'O2 Hb', 'Hábito Enólico', 'Hábitos Tóxicos',
        'Peso:', 'Superficie Corporal', 'FC', 'HTA (Hipertensión Arterial)', 'Detalles Hipertensión Arterial', 'Años desde que dejo de fumar', 'Cigarrillos al dia', 'Hábito Tabáquico',
        'Grupo Sanguíneo', 'Transfusiones', 'Perímetro abdominal', 'Dislipemia', 'Detalles Dislipemia', 'Paquetes año',
        'Talla:', 'Tmp', 'PAD', 'PAS', 'Grado NYHA'
      ],
      '02-ANAMNESIS Y EXPLORACION > OBSERVACIONES': [
        'Observaciones', 'Situación Basal (Otros)', 'Situación Basal', 'Otras Exploraciones'
      ],

      '03-DIAGNOSTICO Y TTO': [
        'Diagnóstico', 'Evolución (CEX)', 'Próxima revisión', 'Recomendaciones', 'Tratamiento'
      ],
      '04-RESULTADOS PRUEBAS': [
        'Otras Pruebas Realizadas', 'Pruebas solicitadas', 'Recetas Prescritas', 'Resultado Analítica', 'Resultado Anatomía Patológica', 'Resultado Radiodiagnóstico'
      ],
      '05-PROCESO HOSP/CEX': [
        'Juicio Diagnóstico Activo', 'Juicio Diagnóstico Secundario', 'Motivo de Alta', 'Motivo de Consulta', 
        'Motivo de Ingreso', 'Resumen de evolución', 'Revisiones posteriores', 'Tipo de Ingreso:', 
        'Tratamiento crónico', 'Tratamiento recomendado'
      ]
    }


  },
  {
    id: 'hce_obs',
    name: 'HCE-OBS',
    keys: {
      nhc: 'N.H.C',
      idToma: 'Id_Toma',
      ordenToma: 'Orden_Toma',
      fechaToma: 'EC_Fecha_Toma',
    },
    headerAliases: {
      'N.H.C': ['NHC', 'N.H.C.', 'N.H.C'],
      'Cipa': ['CIPA', 'cipa'],
      'DEMOG-Código postal': ['CP', 'C.P.', 'DEMOG-Código postal'],
      'EC_Sexo': ['Sexo', 'sexo'],
      'Fecha de Nacimiento': ['Fecha de Nacimiento', 'F_Nacimiento'],
      'EC_Proceso2': ['EC_Proceso2', 'Proceso 2'],
      'Unidad de Enfermería': ['Unidad de Enfermería', 'UNIDAD'],
      'Id_Toma': ['Id_Toma', 'Identificador Toma', 'ID_TOMA'],
      'Orden_Toma': ['Orden_Toma', 'Version Registro', 'ORDEN_TOMA'],
      'Dias de gestación': ['Dias de gestación', 'Días de gestación'],
      'Semanas de gestación': ['Semanas de gestación', 'Semanas de gestacion'],
      'Exploración general:': ['Exploración general:', 'Exploracion general:'],
      'Peso 1ª Visita': ['Peso 1ª Visita', 'Peso 1a Visita', 'Peso 1 Visitia'],
      'Htº': ['Htº', 'Ht°', 'Ht', 'Ht.', 'Hematocrito'],
      'SCREENING ANEUPLODIAS': ['SCREENING ANEUPLODIAS', 'SCREENINIG ANEUPLODIAS'],
      'Vitalidad (F.C.F.)': ['Vitalidad (F.C.F.)', 'Vitalidad (F.C. F.)', 'FCF', 'F.C.F.'],
      'Juicio Diagnóstico Activo': ['Juicio Diagnóstico Activo', 'Jucio Diagnóstico Activo'],
      'Juicio Diagnóstico Secundario': ['Juicio Diagnóstico Secundario', 'Jucio Diagnóstico Secundario']
    },
    demographics: {
      cipa: 'Cipa',
      cp: 'DEMOG-Código postal',
      sexo: 'EC_Sexo',
      fechaNacimiento: 'Fecha de Nacimiento',
      nhc: 'N.H.C',
      proceso2: 'EC_Proceso2',
      unidadEnfermeria: 'Unidad de Enfermería',
      reacciones: 'Reacciones Adversas a fármacos'
    },
    visualCategories: {
      '01-ANTECEDENTES': [
        'Ámbito', 'Edad', 'Edad Toma', 'Finalidad de la toma:', 'Reacciones Adversas a fármacos', 'Observaciones'
      ],
      '01-ANTECEDENTES > ANTECEDENTES PERSONALES': [
        'Alcohol durante el embarazo?', 'Antecedentes Familiares Generales', 'Antecedentes Personales Generales',
        'Antecedentes Quirúrgicos Generales', 'Detalles Dislipemia', 'Diabetes Gestacional', 'Diabetes Mellitus',
        'Dislipemia', 'Fumadora durante el embarazo?', 'Grado NYHA', 'Grupo Sanguíneo:', 'Grupo y RH', 'Grupo y RH:',
        'Hábito Enólico', 'Hábito Tabáquico', 'Hábitos tóxicos', 'Hábitos tóxicos gestación', 'HTA (Hipertensión Arterial)',
        'Motivos Transfusiones', 'Procesos Ginecológicos Anteriores:', 'Situación basal', 'Situación Basal (Otros)',
        'Tipo de HTA', 'Transfusiones', 'Tratamiento crónico',
        'Años desde que dejo de fumar', 'Años desde que dejó de fumar', 'Años fumando', 'Cigarrillos al dia', 'Cigarrillos al día', 'Paquetes año'
      ],

      '01-ANTECEDENTES > ANTECEDENTES OBS': [
        'Abortos:', 'Cesáreas:', 'Ectópicos:', 'Fórmula Menstrual', 'Fórmula Obstétrica', 'Gemelares:', 'Gestaciones:',
        'Menarquia', 'Partos:', 'Prematuros:'
      ],

      '02-ANAMNESIS Y EXPLORACION': [
        'Anamnesis', 'Motivo de consulta:'
      ],
      '02-ANAMNESIS Y EXPLORACION > DATACION DE LA GESTACIÓN': [
        'Dias de gestación', 'FPP', 'FPP (corregida por Eco)', 'FUR',
        'Menograma Tipo Actual$Amenorrea primaria', 'Menograma Tipo Actual$Amenorrea secundaria',
        'Menograma Tipo Actual$Ataxia menstrual / Baches amenorreicos', 'Menograma Tipo Actual$Braquimenorrea',
        'Menograma Tipo Actual$Dolicomenorrea Postmenstrual', 'Menograma Tipo Actual$Dolicomenorrea Premenstrual',
        'Menograma Tipo Actual$Eumenorrea', 'Menograma Tipo Actual$Hiperdolicomenorrea',
        'Menograma Tipo Actual$Hipermenorrea', 'Menograma Tipo Actual$Hipomenorrea',
        'Menograma Tipo Actual$Metrorragia', 'Menograma Tipo Actual$Opsomenorrea',
        'Menograma Tipo Actual$Polimenorrea', 'Semanas de gestación'
      ],
      '02-ANAMNESIS Y EXPLORACION > VISITA CONTROL DE GESTACIÓN': [
        'Aumento de peso desde el comienzo del embarazo', 'Peso 1ª Visita', 'Peso:'
      ],
      '02-ANAMNESIS Y EXPLORACION > CONSTANTES': [
        'FC', 'IMC:', 'PAS', 'PAD', 'T', 'Talla:'
      ],
      '02-ANAMNESIS Y EXPLORACION > EXPLORACION': [
        'Exploración general:', 'Mutilación de genitales'
      ],
      '02-ANAMNESIS Y EXPLORACION > EXPLORACION OBSTÉTRICA': [
        'Altura Uterina', 'Edemas', 'Hemorroides', 'Movimientos Fetales', 'S. Circulatorio Periférico', 'Vitalidad (F.C.F.)'
      ],
      '02-ANAMNESIS Y EXPLORACION > CONDICIONES OBSTÉTRICAS TACTO VAGINAL': [
        'Anexos:', 'Cuello', 'Douglas:', 'Utero:'
      ],
      '02-ANAMNESIS Y EXPLORACION > CARACTERISTICAS CERVIX': [
        'Bishop:', 'Borramiento:', 'Consistencia:', 'Dilatación:', 'Plano presentación:', 'Posición:'
      ],
      '02-ANAMNESIS Y EXPLORACION > AMNORREXIS': [
        'Estado de la bolsa al ingreso', 'Fecha - Hora bolsa rota', 'Tipo de Rotura de bolsa'
      ],
      '02-ANAMNESIS Y EXPLORACION > ESTETICA FETAL': [
        'Actitud', 'Posición', 'Presentación', 'Situación'
      ],
      '02-ANAMNESIS Y EXPLORACION > FACTORES DE RIESGO': [
        'Gestación Actual', 'Observaciones', 'Valoración del Riesgo'
      ],
      '03-ANALITICAS': [
        'H', 'Hb', 'Htº', 'Leucocitos', 'Plaquetas', 'Test de Coombs Indirecto', 'Título Test de Coombs', 'VCM'
      ],
      '03-ANALITICAS > HEMATOLOGIA': [
        'H', 'Hb', 'Htº', 'Leucocitos', 'Plaquetas', 'Test de Coombs Indirecto', 'Título Test de Coombs', 'VCM'
      ],
      '03-ANALITICAS > AGA': [
        'AGA Vaginal'
      ],
      '03-ANALITICAS > BIOQUIMICA': [
        'Á.Úrico', 'Bilirrubina Ind.', 'Bilirrubina Total', 'Curva de Glucemia', 'Fe', 'Ferritina',
        'Fosfatasa alcalina', 'Gamma GT', 'Glucemia Basal', 'GOT', 'GTP', 'HB Glicosilada', 'Á. Úrico', 'Á.Úrico',
        'Perfil glucémico$Hiperglucemias leves', 'Perfil glucémico$Hiperglucemias moderada', 'Perfil glucémico$Hiperglucemias moderadas',
        'Perfil glucémico$Hiperglucemias severa', 'Perfil glucémico$Hipoglucemias',
        'Perfil glucémico$Normal', 'Perfil glucémico$Patológico', 'Saturación de transferrina',
        'Test de O,Sullivan', 'Transferrina'

      ],
      '03-ANALITICAS > COAGULACION': [
        '%INR', 'Actividad', 'Fibrinógeno', 'PTTA', 'T. Protrombinas'
      ],

      '03-ANALITICAS > ORINA': [
        'Anormales', 'Cociente albumina creatinina en muestra de orina aislada', 'Germen',
        'Microalbuminuria', 'Nº de colonias, 10 elevado a', 'Sedimento', 'Sensibilidad Antibióticos', 'Urocultivo'
      ],

      '03-ANALITICAS > SEROLOGIAS': [
        'Hbs Ag', 'Hbs  Ag', 'Otras', 'RPR', 'Rubeola', 'Toxoplasmosis', 'TPHA', 'VHC', 'VIH'
      ],

      '03-ANALITICAS > SCREENING ANEUPLODIAS': [
        'Observaciones:', 'Riesgo por Screening 2º Trimestre:', 'Riesgo por Screening Combinado:', 'SCREENING ANEUPLODIAS'
      ],
      '03-ANALITICAS > OTRAS ANALITICAS': [
        'Otras Analíticas', 'Resumen Analítica'
      ],
      '04-PRUEBAS Y RESULTADOS': [
        'FCF$(Variables)', 'FCF$Bradicardia basal grave', 'FCF$Bradicardia basal leve', 'FCF$Bradicardia basal moderada',
        'FCF$Deceleración prolongada (calderon)', 'FCF$Deceleraciones tipo I', 'FCF$Deceleraciones tipo II',
        'FCF$Deceleraciones tipo III (Variables)', 'FCF$I (Variables)', 'FCF$Patrón no reactivo', 'FCF$Patrón reactivo',
        'FCF$Ritmo Comprimido', 'FCF$Ritmo Saltatorio', 'FCF$Ritmo Silente', 'FCF$Taquicardia grave', 'FCF$Taquicardia leve',
        'FCF$Taquicardia moderada', 'Frecuencia de contracciones', 'Intensidad Dinámica', 'Tipo de Dinámica'
      ],

      '04-PRUEBAS Y RESULTADOS > PRUEBA DE OXICTOCINA': [
        'Prueba Oxitocina'
      ],
      '04-PRUEBAS Y RESULTADOS > PRUEBAS BIOFÍSICO': [
        'Perfil Biofísico'
      ],
      '04-PRUEBAS Y RESULTADOS > OTRAS PRUEBAS': [
        'Observaciones:', 'Otras Pruebas realizadas'
      ],
      '04-PRUEBAS Y RESULTADOS > PRUEBAS SOLICITADAS': [
        'Pruebas solicitadas'
      ],
      '05-DIAGNOSTICO Y TTO': [
        'Datos prenatales a valorar por pediatra', 'Diagnóstico:', 'Especificar', 'Motivo de Alta (CEX):', 'Recomendaciones:', 'Tratamiento:'
      ],
      '06-PROCESO HOSP/CEX': [
        'Juicio Diagnóstico Activo', 'Juicio Diagnóstico Secundario', 'Motivo de Alta', 'Motivo de ingreso:', 'Procedimientos:', 'Recomendaciones:', 'Resumen de evolución Paciente', 'Tipo de Ingreso:'
      ]
    }
  }
];

export const FORMS: FormMapping[] = (() => {
  const runtimeMap = new Map((RUNTIME_FORMS || []).map(f => [f.id, f]));
  const staticMap = new Map(STATIC_FORMS.map(f => [f.id, f]));
  
  const merged = new Map([...staticMap, ...runtimeMap]);
  return Array.from(merged.values());
})();
