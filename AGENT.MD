# Agent Context: Queryclin (V6.5.1) 🚀

## 🎯 Project Goal
Build a professional, private, Local-First clinical search engine capable of handling 100,000+ records (HCE) with millisecond response times. Now featuring a specialized **Admin Studio** for declarative clinical form design and high-precision taxonomy control.

## 🚀 Current Status: Fase 30 (Admin Studio Precision & Resource Integration)
The project has evolved from a static viewer to a dynamic design platform:
- **Queryclin Admin Studio**: Declarative UI engine for custom clinical form creation.
- **Clinical Resource Library**: Canonical header support (OBS, MIR, ALG) as immutable design bases.
- **Structural CRUD**: Real-time management of clinical sections and groups.
- **Semantic Processor**: Unified source of truth for clinical tokenization and synonym expansion.
- **Structural Search Index**: Context-aware postings ('c') for O(1) filtering.

## 🛠️ Technical Stack
- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS 4 + Lucide.
- **Storage**: IndexedDB (Sharded for >100k records) + SchemaStore for Admin UI.
- **Engine**: BM25 Scoring + Contextual Indexing + Clinical Semantic Layer.
- **UX/UI**: Premium Glassmorphism, Drag-and-Drop (dnd-kit), and Micro-animations.
- **Security**: Security Protocol v6.5.1, Local-First, Passcode Protected Admin.

## ⚔️ Battle Log (Latest Challenges)
- **Field Loss Prevention**: Engineering the `TemplateGenerator` to handle "orphan" fields during schema generation.
- **Structural Fluidity**: Implementing real-time section/group management without state desync.
- **Resource Integration**: Bridging canonical header lists into the design engine for "From Scratch" creation.

## 📋 Immediate Tasks
- [x] Implement Admin Studio Core and Template Engine (V6.0-V6.5).
- [x] Integrate Canonical Resources (OBS, MIR, ALG).
- [x] Reengineer FormDesigner for structural CRUD and premium UX.
- [ ] Atomic Persistence Validation for massive schema changes.
- [ ] Semantic Search with Transformers.js (Next Step).

## 📜 Governance
- Follow **RULES.md** and **/.ag/** policies strictly.
- Update **CHANGELOG.md** and **TASKS.md** after every change.
- Maintain **BATTLE_LOG.md** for critical technical decisions.
- **NEVER** include real patient data (PHI) in the repository. Use Mocks only.
