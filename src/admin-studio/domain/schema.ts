/**
 * Domain Types para Queryclin Admin Studio (Form Schema Engine)
 * Define la estructura de los formularios clínicos de forma declarativa.
 */

export type FieldType = 
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "date"
  | "multivalue"
  | "table";

export interface Field {
  id: string;
  sourceField: string;
  label: string;
  type: FieldType;
  searchable: boolean;
  highlightable: boolean;
  visible: boolean;
  multiline?: boolean;
  multivalue?: boolean;
  children?: Field[]; // Para soporte anidado (ej. multivalores $)
}

export interface Group {
  id: string;
  title: string;
  layout: "stack" | "table" | "grid" | "columns";
  columns?: number;
  fields: Field[];
}

export interface Section {
  id: string;
  title: string;
  order: number;
  collapsible: boolean;
  groups: Group[];
}

export interface HeaderGroup {
  id: string;
  layout: "row" | "grid";
  fields: Field[];
}

export interface SidebarGroup {
  id: string;
  title: string;
  fields: Field[];
}

export interface FormSchema {
  id: string; // ID base del formulario (ej. "hce_obs")
  name: string;
  version: string; // Versión incremental (ej. "1", "2")
  status: "draft" | "published" | "archived";
  header: HeaderGroup[];
  sidebar: SidebarGroup[];
  sections: Section[];
  unassignedFields?: Field[];
  headerAliases?: Record<string, string[]>; // Aliases para cabeceras
  demographics?: Record<string, string>; // Mapeo de datos demográficos
  createdAt: number;
  updatedAt: number;
}
