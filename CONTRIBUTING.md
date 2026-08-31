# Contributing to Q-Learn Nexus

Thank you for your interest in contributing to **Q-Learn Nexus**! We welcome contributions from physicists, software engineers, educators, and quantum computing researchers.

---

## 🧭 Code of Conduct

All contributors are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please maintain a welcoming, respectful, and scientifically rigorous community.

---

## 🛠️ Development Workflow

### 1. Fork & Clone
```bash
git clone https://github.com/Tanishk756/qlearn.git
cd qlearn
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Ensure PostgreSQL is running locally or provide a valid connection string.

### 4. Branching Model
- `main`: Production-ready release branch.
- Feature branches: `feat/your-feature-name`
- Fix branches: `fix/issue-description`
- Docs branches: `docs/improvement`

---

## 📐 Engineering Guidelines

### 1. Persistence & Database
- **PostgreSQL is Authoritative**: Never introduce local filesystem caches or in-memory state fallbacks for persistent entities (users, circuits, projects, simulations).
- **Parameterized SQL**: All database operations must use Drizzle ORM query builders to prevent SQL injection.
- **Fail-Closed Design**: Endpoints modifying or reading persistent data must fail closed if the database is unreachable.

### 2. Quantum Engine Standards
- **Qubit Ordering**: Adhere strictly to canonical **little-endian** bit ordering ($q_0$ is the least significant bit).
- **Gate Matrix Rigor**: Unitary operators must be normalized and verified against standard definitions.
- **No Pseudo-Hardware**: Clearly distinguish classical simulations from real quantum hardware providers.

### 3. Testing Requirements
Before submitting a PR, ensure all test suites pass:
```bash
npm test
npm run lint
npm run build
```

---

## 📝 Submitting a Pull Request

1. Ensure code is formatted and adheres to TypeScript strict mode.
2. Add or update unit and integration tests covering your changes.
3. Write clear, semantic commit messages (e.g. `feat: add Grover oracle circuit generator`, `fix: enforce project member authorization check`).
4. Submit your PR against the `main` branch with a clear description of the problem solved.

**Author & Maintainer:** Tanishk Singhal ([@Tanishk756](https://github.com/Tanishk756))
