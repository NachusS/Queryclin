/**
 * Domain Types para Queryclin Admin Studio (Form Schema Engine)
 * Define la estructura de los formularios clínicos de forma declarativa.
 */

export type ClinicalFieldType = 
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "date"
  | "multivalue"
  | "table";

export interface ClinicalField {
  id: string;
  sourceField: string;
  label: string;
  type: ClinicalFieldType;
  searchable: boolean;
  highlightable: boolean;
  visible: boolean;
  multiline?: boolean;
  multivalue?: boolean;
  children?: ClinicalField[]; // Para soporte anidado (ej. multivalores $)
}

export interface ClinicalGroup {
  id: string;
  title: string;
  layout: "stack" | "table" | "grid" | "columns";
  columns?: number;
  fields: ClinicalField[];
}

export interface ClinicalSection {
  id: string;
  title: string;
  order: number;
  collapsible: boolean;
  groups: ClinicalGroup[];
}

export interface HeaderGroup {
  id: string;
  layout: "row" | "grid";
  fields: ClinicalField[];
}

export interface SidebarGroup {
  id: string;
  title: string;
  fields: ClinicalField[];
}

export interface ClinicalFormSchema {
  id: string;
  name: string;
  version: string;
  status: "draft" | "published" | "archived";
  header: HeaderGroup[];
  sidebar: SidebarGroup[];
  sections: ClinicalSection[];
  unassignedFields?: ClinicalField[];
  createdAt: number;
  updatedAt: number;
}
