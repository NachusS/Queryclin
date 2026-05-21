import { describe, it, expect } from 'vitest';
import { SchemaValidator } from '../admin-studio/validation/SchemaValidator';
import { FormSchema } from '../admin-studio/domain/schema';

describe('SchemaValidator', () => {
  const getValidSchema = (): FormSchema => ({
    id: 'test-form',
    name: 'Test Form',
    version: '1.0.0',
    status: 'draft',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    header: [
      {
        id: 'hdr-group-1',
        layout: 'grid',
        fields: [
          { id: 'field-nhc', sourceField: 'NHC_COL', label: 'NHC', type: 'text', searchable: true, highlightable: false, visible: true }
        ]
      }
    ],
    sidebar: [
      {
        id: 'side-group-1',
        title: 'Sidebar Details',
        fields: [
          { id: 'field-age', sourceField: 'AGE_COL', label: 'Age', type: 'number', searchable: true, highlightable: false, visible: true }
        ]
      }
    ],
    sections: [
      {
        id: 'sec-main',
        title: 'Main Section',
        order: 1,
        collapsible: true,
        groups: [
          {
            id: 'grp-details',
            title: 'Details Group',
            layout: 'stack',
            fields: [
              {
                id: 'field-diagnosis',
                sourceField: 'DIAG_COL',
                label: 'Diagnosis',
                type: 'text',
                searchable: true,
                highlightable: true,
                visible: true,
                children: [
                  { id: 'field-sub-diag', sourceField: 'SUB_DIAG_COL', label: 'Sub Diagnosis', type: 'text', searchable: false, highlightable: false, visible: true }
                ]
              }
            ]
          }
        ]
      }
    ],
    unassignedFields: [
      { id: 'field-unassigned', sourceField: 'UNASSIGNED_COL', label: 'Unassigned', type: 'text', searchable: false, highlightable: false, visible: false }
    ],
    headerAliases: {
      'NHC_COL': ['NHC_ALIAS_1', 'NHC_ALIAS_2'],
      'AGE_COL': ['AGE_ALIAS_1']
    }
  });

  it('should validate a correct schema successfully', () => {
    const schema = getValidSchema();
    const result = SchemaValidator.validate(schema);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('should flag missing basic structure properties', () => {
    const schema = getValidSchema();
    schema.id = '';
    schema.name = '';
    schema.version = '';
    
    const result = SchemaValidator.validate(schema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('El esquema debe tener un ID base.');
    expect(result.errors).toContain('El esquema debe tener un nombre.');
    expect(result.errors).toContain('El esquema debe tener una versión.');
  });

  it('should flag missing sourceField in any field, including headers, sidebars, and nested children', () => {
    // Test section field missing sourceField
    let schema = getValidSchema();
    schema.sections[0].groups[0].fields[0].sourceField = '';
    let result = SchemaValidator.validate(schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('no tiene un sourceField asignado'))).toBe(true);

    // Test nested child field missing sourceField
    schema = getValidSchema();
    schema.sections[0].groups[0].fields[0].children![0].sourceField = '';
    result = SchemaValidator.validate(schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('no tiene un sourceField asignado'))).toBe(true);

    // Test header field missing sourceField
    schema = getValidSchema();
    schema.header[0].fields[0].sourceField = '';
    result = SchemaValidator.validate(schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('no tiene un sourceField asignado'))).toBe(true);

    // Test sidebar field missing sourceField
    schema = getValidSchema();
    schema.sidebar[0].fields[0].sourceField = '';
    result = SchemaValidator.validate(schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('no tiene un sourceField asignado'))).toBe(true);

    // Test unassigned field missing sourceField
    schema = getValidSchema();
    schema.unassignedFields![0].sourceField = '';
    result = SchemaValidator.validate(schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('no tiene un sourceField asignado'))).toBe(true);
  });

  it('should flag duplicate IDs across layout groups and fields', () => {
    // Duplicate between sections
    let schema = getValidSchema();
    schema.sections.push({
      id: 'sec-main', // Duplicate
      title: 'Another Main',
      order: 2,
      collapsible: false,
      groups: []
    });
    let result = SchemaValidator.validate(schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('ID de sección duplicado'))).toBe(true);

    // Duplicate between section groups
    schema = getValidSchema();
    schema.sections[0].groups.push({
      id: 'grp-details', // Duplicate
      title: 'Another Group',
      layout: 'grid',
      fields: []
    });
    result = SchemaValidator.validate(schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('ID de grupo duplicado'))).toBe(true);

    // Duplicate between header groups
    schema = getValidSchema();
    schema.header.push({
      id: 'hdr-group-1', // Duplicate
      layout: 'row',
      fields: []
    });
    result = SchemaValidator.validate(schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('ID de grupo de cabecera duplicado'))).toBe(true);

    // Duplicate between sidebar groups
    schema = getValidSchema();
    schema.sidebar.push({
      id: 'side-group-1', // Duplicate
      title: 'Another Sidebar Group',
      fields: []
    });
    result = SchemaValidator.validate(schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('ID de grupo de barra lateral duplicado'))).toBe(true);

    // Duplicate between header field and section field
    schema = getValidSchema();
    schema.sections[0].groups[0].fields[0].id = 'field-nhc'; // Duplicate from header field
    result = SchemaValidator.validate(schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('ID de campo duplicado'))).toBe(true);

    // Duplicate between section field and nested child field
    schema = getValidSchema();
    schema.sections[0].groups[0].fields[0].children![0].id = 'field-diagnosis'; // Duplicate from parent
    result = SchemaValidator.validate(schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('ID de campo duplicado'))).toBe(true);
  });

  it('should flag duplicate aliases in headerAliases', () => {
    const schema = getValidSchema();
    schema.headerAliases = {
      'NHC_COL': ['DUPLICATE_ALIAS'],
      'AGE_COL': ['DUPLICATE_ALIAS']
    };
    const result = SchemaValidator.validate(schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('está duplicado y asignado a múltiples cabeceras'))).toBe(true);
  });

  it('should generate warnings for empty sections or groups', () => {
    // Empty sections
    let schema = getValidSchema();
    schema.sections = [];
    let result = SchemaValidator.validate(schema);
    expect(result.warnings.some(w => w.includes('no tiene secciones'))).toBe(true);

    // Empty groups
    schema = getValidSchema();
    schema.sections[0].groups[0].fields = [];
    result = SchemaValidator.validate(schema);
    expect(result.warnings.some(w => w.includes('Hay grupos sin campos asignados'))).toBe(true);
  });
});
