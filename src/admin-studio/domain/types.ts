/**
 * Consolidated Domain Types for Queryclin Admin Studio (Form Schema Engine)
 * Merges and redirects types to prevent code duplication.
 */

import { 
  FormSchema, 
  Section, 
  Group, 
  Field, 
  FieldType,
  HeaderGroup,
  SidebarGroup
} from './schema';

export type ClinicalFieldType = FieldType;
export type ClinicalField = Field;
export type ClinicalGroup = Group;
export type ClinicalSection = Section;
export type ClinicalFormSchema = FormSchema;
export type { HeaderGroup, SidebarGroup };
