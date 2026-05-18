import { ClinicalFormSchema } from '../domain/types';

export const mockHceMirSchema: ClinicalFormSchema = {
  id: "HCE-MIR-V1",
  name: "Historia Clínica Medicina Interna",
  version: "1.0",
  status: "draft",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  header: [
    {
      id: "hdr-1",
      layout: "grid",
      fields: [
        { id: "hf-1", sourceField: "N.H.C", label: "NHC", type: "text", searchable: true, highlightable: true, visible: true },
        { id: "hf-2", sourceField: "Cipa", label: "CIPA", type: "text", searchable: false, highlightable: true, visible: true }
      ]
    }
  ],
  sidebar: [],
  sections: [
    {
      id: "sec-antecedentes",
      title: "ANTECEDENTES",
      order: 1,
      collapsible: false,
      groups: [
        {
          id: "grp-ant-personales",
          title: "Antecedentes Personales",
          layout: "stack",
          fields: [
            { id: "f-1", sourceField: "Alergias Conocidas", label: "Alergias Conocidas", type: "text", searchable: true, highlightable: true, visible: true },
            { id: "f-2", sourceField: "Hábitos Tóxicos", label: "Hábitos Tóxicos", type: "textarea", searchable: true, highlightable: true, visible: true }
          ]
        }
      ]
    },
    {
      id: "sec-constantes",
      title: "CONSTANTES Y BIOMETRÍA",
      order: 2,
      collapsible: false,
      groups: [
        {
          id: "grp-constantes",
          title: "Constantes",
          layout: "grid",
          columns: 4,
          fields: [
            { id: "f-3", sourceField: "FC", label: "FC", type: "text", searchable: true, highlightable: true, visible: true },
            { id: "f-4", sourceField: "TA Sistólica", label: "TA Sistólica", type: "text", searchable: true, highlightable: true, visible: true },
            { id: "f-5", sourceField: "Tª", label: "Tª", type: "text", searchable: true, highlightable: true, visible: true }
          ]
        }
      ]
    }
  ]
};
