import { describe, it, expect } from 'vitest';
import { SemanticProcessor } from '../engine/SemanticProcessor';

describe('SemanticProcessor - Clinical Fidelity Hardening', () => {

  describe('Unidirectional Hierarchical Synonyms', () => {
    it('Should expand BROAD term to include NARROW types', () => {
      const broadExpansions = SemanticProcessor.expand('dm');
      expect(broadExpansions).toContain('dm1');
      expect(broadExpansions).toContain('dm2');
      expect(broadExpansions).toContain('diabetes');
    });

    it('Should NOT expand NARROW term to include sibling types or BROAD root', () => {
      const narrowExpansions = SemanticProcessor.expand('dm1');
      // dm1 should NOT search for generic "dm" or "dm2"
      expect(narrowExpansions).not.toContain('dm');
      expect(narrowExpansions).not.toContain('dm2');
      // but should include exact synonyms of dm1 if any
      expect(narrowExpansions).toContain('dm1');
    });

    it('Should expand EXACT terms bidirectionally', () => {
      const expansions1 = SemanticProcessor.expand('hta');
      expect(expansions1).toContain('hipertension');
      
      const expansions2 = SemanticProcessor.expand('hipertension');
      expect(expansions2).toContain('hta');
    });
  });

  describe('Context-Aware Negation Tokenizer (N-grams)', () => {
    it('Should shield clinical terms immediately following a negation trigger', () => {
      const tokens = SemanticProcessor.tokenize('Paciente sin alergias conocidas');
      expect(tokens).toContain('neg_alergia'); // alergias stems to alergia
      expect(tokens).not.toContain('alergia');
    });

    it('Should apply negation window across multiple terms', () => {
      const tokens = SemanticProcessor.tokenize('No presenta fiebre ni dolor toracico');
      // 'no' triggers window of 3. 'fiebre', 'dolor', 'toracico' should be negated.
      expect(tokens).toContain('neg_fiebre');
      expect(tokens).toContain('neg_dolor');
      expect(tokens).toContain('neg_toracico');
      
      expect(tokens).not.toContain('fiebre');
      expect(tokens).not.toContain('dolor');
    });

    it('Should NOT shield terms outside the negation window', () => {
      const tokens = SemanticProcessor.tokenize('Sin fiebre. El paciente refiere tos persistente');
      // 'sin' negates 'fiebre', but 'tos' is outside the window (3 tokens)
      expect(tokens).toContain('neg_fiebre');
      expect(tokens).toContain('tos');
      expect(tokens).not.toContain('neg_tos');
    });
  });

  describe('Clinical Context Preservation', () => {
    it('Should NOT treat critical hospital terms as stopwords', () => {
      const tokens = SemanticProcessor.tokenize('Motivo de ingreso y alta medica');
      expect(tokens).toContain('motivo');
      expect(tokens).toContain('ingreso');
      expect(tokens).toContain('alta');
      expect(tokens).toContain('medica');
    });
  });

});
