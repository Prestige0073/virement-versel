# 📚 Documentation du Projet - Simulateur de Virement Bancaire

## 📖 Fichiers de Documentation

### Phase 1: Setup du Projet
- [AUDIT_PHASE_1.md](../AUDIT_PHASE_1.md) - Audit détaillé de la Phase 1

### Structure du Projet
```
Simulateur-virement-bancaire/
├── frontend/                 # Application React (Vite + Tailwind)
│   ├── src/
│   │   ├── components/      # Composants réutilisables
│   │   ├── pages/          # Pages du site
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Utilitaires
│   │   ├── context/        # Context API
│   │   ├── config/         # Configuration
│   │   ├── styles/         # CSS global + Tailwind
│   │   └── types/          # TypeScript types
│   └── package.json
├── supabase/                # Backend Supabase
│   ├── migrations.sql      # Schéma BD complète
│   └── seed.sql           # Données de test
├── tests/                   # Tests unitaires et intégration
├── docs/                    # Documentation complète
└── AUDIT_PHASE_*.md        # Audits par phase
```

## 🔐 Sécurité

### Variables d'Environnement Requises

```bash
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx

# API Configuration
VITE_API_URL=http://localhost:3000

# Mobile Money
VITE_FEDAPAY_API_KEY=xxx
VITE_FEDAPAY_SANDBOX=true

# App
VITE_APP_NAME=Simulateur de Virement Bancaire
VITE_APP_ENV=development
```

### Checklist de Sécurité
- [x] Variables d'env externalisées
- [x] Pas de credentials en hardcoding
- [ ] HTTPS en production (Vercel)
- [ ] Rate limiting implémenté
- [ ] CORS configuré
- [ ] SQLi protection (Parameterized queries)
- [ ] XSS protection (Tailwind CSP)

## 🚀 Road map

### Phase 1: ✅ Setup (En cours)
- [x] Vite + React 19
- [x] Tailwind CSS configuré
- [x] Structure des dossiers
- [x] Configuration Supabase
- [ ] npm install finalize

### Phase 2: Authentification
- [ ] Supabase Auth intégré
- [ ] SignUp/Login pages
- [ ] JWT tokens
- [ ] Récupération mot de passe
- [ ] Tests auth complets

### Phase 3: Système de Paiement
- [ ] Intégration FedaPay/Kkiapay
- [ ] Page de paiement
- [ ] Webhook de confirmation
- [ ] Audit des transactions

### Phase 4: CRUD Comptes Bancaires
- [ ] Formulaire création compte
- [ ] Upload logo (Supabase Storage)
- [ ] CRUD opérations
- [ ] Tests complets

### Phase 5-12: Voir AUDIT_PHASE_1.md

## 🧪 Tests

### Structure des Tests
```
tests/
├── unit/               # Tests unitaires
├── integration/        # Tests d'intégration
└── audit/             # Tests de sécurité
```

### Commandes Tests
```bash
npm run test           # Lancer tous les tests
npm run test:unit     # Tests unitaires only
npm run test:e2e      # Tests end-to-end (Playwright)
npm run audit         # Audit de sécurité
```

## 📋 Modèle de Données

### Tables Principales
1. **bank_accounts** - Comptes bancaires fictifs
2. **transfer_steps_config** - Configuration étapes
3. **share_links** - Liens sécurisés
4. **transfers** - Virements effectués
5. **transfer_step_attempts** - Suivi étapes
6. **realtime_events** - Notifications temps réel
7. **audit_logs** - Logs d'audit

Voir [supabase/migrations.sql](../supabase/migrations.sql)

## 🔄 Workflow Développement

1. Brancher depuis `develop`
2. Nommer la branche: `feature/nom` ou `fix/nom`
3. Commit messages: `feat:`, `fix:`, `test:`, `audit:`, `docs:`
4. Créer Pull Request avec description
5. Code Review + Tests
6. Merge vers `develop`
7. Release vers `main` (après audit)

## 📞 Support

- **Problèmes NPM**: Vérifier node version (v18+), npm v9+
- **Supabase**: Console.supabase.co pour debugging
- **Tailwind**: Docs: tailwindcss.com
- **React Router**: Docs: reactrouter.com

## ⚠️ Notes Importantes

- ⚠️ **MODE PÉDAGOGIQUE UNIQUEMENT** - Aucune transaction réelle
- ⚠️ Codes de déblocage doivent être chiffrés
- ⚠️ Mots de passe des clients doivent être hachés
- ⚠️ Logs complets requis pour audit
- ⚠️ Respect GDPR pour données personnelles

---

**Last Updated**: 3 mai 2026  
**Version**: 0.0.1 (Phase 1)
