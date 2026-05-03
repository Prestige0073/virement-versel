# 🏦 Simulateur de Virement Bancaire

> **Plateforme pédagogique** pour la simulation de virements bancaires avec validation multi-étapes

![Status](https://img.shields.io/badge/status-Phase%201-blue)
![License](https://img.shields.io/badge/license-Educational%20Only-brightgreen)
![Version](https://img.shields.io/badge/version-0.0.1-orange)

---

## 📋 Vue d'ensemble

Une plateforme web permettant aux utilisateurs de:

✅ **Créer** un compte bancaire fictif complet  
✅ **Configurer** des scénarios de virement multi-étapes avec codes de validation  
✅ **Générer** des liens sécurisés pour partager l'espace client  
✅ **Simuler** des virements bancaires réalistes avec validation en temps réel  
✅ **Suivre** toutes les actions du client via un tableau de bord en direct  
✅ **Générer** des reçus PDF authentiques  

**Utilisation**: Pédagogique et démonstration uniquement. Aucune transaction bancaire réelle.

---

## 🚀 Quick Start

### Prérequis
- Node.js v18+
- npm v9+ ou yarn
- Compte Supabase (https://supabase.co)

### Installation

```bash
# 1. Cloner le repo
git clone <repo>
cd Simulateur-virement-bancaire

# 2. Setup frontend
cd frontend
npm install
cp .env.example .env.local
# --> Remplir les variables Supabase dans .env.local

# 3. Setup Supabase
# --> Créer un projet Supabase
# --> Importer migrations.sql dans SQL Editor
# --> Configurer variables d'env

# 4. Démarrer le dev server
npm run dev
```

### Accès
- 🏠 Home: http://localhost:5173
- 📝 Signup: http://localhost:5173/signup
- 🔓 Login: http://localhost:5173/login
- 📊 Dashboard: http://localhost:5173/dashboard (protégé)

---

## 📁 Structure du Projet

```
├── frontend/                    React app (Vite)
│   ├── src/
│   │   ├── components/         Composants réutilisables
│   │   ├── pages/             Pages (routing)
│   │   ├── hooks/             Custom hooks
│   │   ├── utils/             Utilitaires
│   │   ├── context/           State management
│   │   ├── config/            Configuration
│   │   ├── styles/            CSS Tailwind
│   │   └── types/             TypeScript types
│   ├── package.json
│   └── .env.example
│
├── supabase/                   Backend
│   ├── migrations.sql          Schéma BD complète
│   └── seed.sql               Données test
│
├── tests/                       Tests
│   ├── unit/
│   ├── integration/
│   └── audit/
│
├── docs/                        Documentation
│   └── README.md               Docs complètes
│
└── AUDIT_PHASE_*.md            Audits par phase
```

---

## 🛠️ Stack Technique

### Frontend
- **React** 19 - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **TypeScript** - Type safety

### Backend & Data
- **Supabase** - BaaS (Auth, DB, Storage, Realtime)
- **PostgreSQL** - Database
- **Row-Level Security** - Permissions

### Security & Utils
- **bcryptjs** - Password hashing
- **TweetNaCl.js** - Encryption
- **jsPDF** - PDF generation
- **react-hot-toast** - Notifications
- **i18next** - Internationalization

### Deployment
- **Vercel** - Frontend hosting
- **Supabase Cloud** - Backend hosting

---

## 🔐 Sécurité

### ✅ Implémenté
- [x] Variables d'env externalisées
- [x] Row-Level Security (RLS) Supabase
- [x] Codes stockés chiffrés
- [x] Mots de passe hachés
- [x] Logs d'audit complets

### ⏳ À implémenter
- [ ] Rate limiting
- [ ] CORS configuration
- [ ] HTTPS (Vercel)
- [ ] 2FA optionnel
- [ ] Tests de pénétration

---

## 📈 Roadmap

### Phase 1: ✅ Setup (En cours)
Structure de base, configurations, composants

### Phase 2: Authentification
User signup/login, JWT, récupération mot de passe

### Phase 3: Paiement
Intégration FedaPay/Kkiapay Mobile Money

### Phase 4: CRUD Comptes
Création/édition comptes bancaires, upload logos

### Phase 5: Configuration Étapes
Setup processus multi-étapes, gestion codes

### Phase 6-12: Voir AUDIT_PHASE_1.md pour détail complet

---

## 🧪 Tests & Audit

### Lancer les tests
```bash
npm run test              # Tous les tests
npm run test:unit        # Tests unitaires
npm run test:e2e         # Tests end-to-end
npm audit                # Audit de sécurité
npm audit --fix          # Auto-fix vulnérabilités
```

### Documentation d'Audit
Chaque phase a un fichier `AUDIT_PHASE_*.md` avec:
- Checklist implémentation
- Tests effectués
- Résultats audit
- Problèmes identifiés

---

## 📝 Convention de Code

### Commits
```
feat:   Nouvelle fonctionnalité
fix:    Bug fix
test:   Tests ajoutés
audit:  Audit/Sécurité
docs:   Documentation
chore:  Configuration/Dependencies
```

### Branches
```
main              Production-ready
develop           Development
feature/name      Nouvelle fonctionnalité
fix/name          Bug fix
audit/name        Audit/Sécurité
```

### Naming
- Fichiers: `kebab-case` (my-component.jsx)
- Variables: `camelCase` (myVariable)
- Constants: `UPPER_SNAKE_CASE` (MY_CONSTANT)
- Components: `PascalCase` (MyComponent)

---

## 📚 Documentation

- [📖 Docs Complètes](./docs/README.md)
- [🔍 Audit Phase 1](./AUDIT_PHASE_1.md)
- [🏗️ Architecture](./docs/ARCHITECTURE.md)
- [🛡️ Sécurité](./docs/SECURITY.md)
- [📊 Modèle de Données](./supabase/migrations.sql)

---

## 🤝 Contribution

1. Fork le projet
2. Créer branche `feature/ma-feature`
3. Commit `git commit -m "feat: description"`
4. Push `git push origin feature/ma-feature`
5. PR avec description détaillée

---

## ⚠️ Avertissements

- **PÉDAGOGIQUE UNIQUEMENT** - Pas d'usage commercial
- **AUCUNE TRANSACTION RÉELLE** - Simulation pédagogique
- **DONNÉES TEST SEULEMENT** - Jamais d'infos réelles
- **À RESPECTER**: GDPR, données personnelles

---

## 📞 Support & Questions

- 📧 Email: support@example.com
- 💬 Issues: GitHub Issues
- 📚 Docs: Voir documentation
- 🛠️ Debug: Vérifier AUDIT_PHASE_*.md

---

## 📄 License

Educational Project - Pédagogique uniquement

---

**Maintenu par**: GitHub Copilot  
**Dernière mise à jour**: 3 mai 2026  
**Version Actuelle**: 0.0.1 (Phase 1)

---

<div align="center">

### 🎓 Un projet pour apprendre. Pas pour l'usage réel. 

**MODE SIMULATION** ⚠️

</div>
