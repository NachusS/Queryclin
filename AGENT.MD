# Agent Context: Queryclin (V7.2.2-STABLE) 🚀

## 🎯 Project Goal
Build a professional, private, Local-First clinical search engine capable of handling 100,000+ records (HCE) with millisecond response times. Now featuring a specialized **Admin Studio** for declarative clinical form design and high-precision taxonomy control.

## 🚀 Current Status: Fase 42 (UI/UX Hardening & Dark Mode Refactor)
The project has successfully reached its stable production-ready release:
- **Queryclin Admin Studio**: Declarative UI engine for custom clinical form creation.
- **Clinical Resource Library**: Canonical header support (OBS, MIR, ALG) as immutable design bases.
- **Structural CRUD**: Real-time management of clinical sections and groups.
- **Semantic Processor**: Unified source of truth for clinical tokenization and synonym expansion.
- **Structural Search Index**: Context-aware postings ('c') for O(1) filtering.
- **Advanced Search Features**: Búsqueda por Frase Exacta (quoted literal phrases) and N-gram Negation Shielding.

## 🛠️ Technical Stack
- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS 4 + Lucide.
- **Storage**: IndexedDB (Sharded for >100k records) + SchemaStore for Admin UI.
- **Engine**: BM25 Scoring + Contextual Indexing + Clinical Semantic Layer + Quoted Phrase Search.
- **UX/UI**: Premium Glassmorphism, Drag-and-Drop (dnd-kit), and Micro-animations.
- **Security**: Security Protocol v7.2.2, Local-First, SHA-256 Passcode Protected Admin.

## ⚔️ Battle Log (Latest Challenges)
- **Field Loss Prevention**: Engineering the `TemplateGenerator` to handle "orphan" fields during schema generation.
- **Structural Fluidity**: Implementing real-time section/group management without state desync.
- **Exact Phrase Matching**: Implementing post-BM25 verification via batch retrieval for literal queries.

## 📋 Immediate Tasks
- [x] Implement Admin Studio Core and Template Engine (V6.0-V6.5).
- [x] Integrate Canonical Resources (OBS, MIR, ALG).
- [x] Reengineer FormDesigner for structural CRUD and premium UX.
- [x] Stability Freeze, QA Checklist, and Release V7.0.0-STABLE.
- [x] Context-Aware Tokenizer and Negation Shielding (V7.1.0-STABLE).
- [x] Quoted Phrase Search and Dark Mode/PWA Refactor (V7.2.2-STABLE).
- [ ] Semantic Search with Transformers.js (Next Step / Roadmap).

## 📜 Governance
- Follow **RULES.md** and **/.ag/** policies strictly.
- Update **CHANGELOG.md** and **TASKS.md** after every change.
- Maintain **BATTLE_LOG.md** for critical technical decisions.
- **NEVER** include real patient data (PHI) in the repository. Use Mocks only.
