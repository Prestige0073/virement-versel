# 🏦 SITE 2 — Simulateur de Virement Bancaire

> **Cahier des charges** — Projet scolaire / pédagogique
> **Date** : 28 avril 2026

---

## 🎯 1. Présentation du projet

### Concept

Plateforme web permettant à un utilisateur de **créer un compte bancaire fictif complet**, de **définir un scénario de virement à étapes**, puis de générer un **lien sécurisé vers un "espace client privé"** où une autre personne (le client/visiteur) pourra simuler un virement bancaire réaliste, avec validation par codes successifs orchestrée en **temps réel** par le propriétaire du compte.

### Objectif

- Projet **scolaire / pédagogique uniquement**
- Démonstration d'un système bancaire complet : compte, virements, validation multi-étapes, reçus, notifications temps réel
- Simulation **réaliste** sans aucune transaction bancaire réelle

### Public cible

- Étudiants, formateurs, démonstrateurs souhaitant simuler un parcours bancaire
- Utilisation pédagogique pour expliquer le fonctionnement d'un virement à étapes (OTP, SWIFT, AML, etc.)

---

## 🛠️ 2. Stack technique

| Couche | Technologie |
|---|---|
| **Frontend** | React.js |
| **Hébergement** | Vercel (gratuit) |
| **Base de données** | Supabase (PostgreSQL + Auth + Storage) |
| **Authentification** | Supabase Auth (email + mot de passe) |
| **Temps réel** | Supabase Realtime (WebSockets) |
| **Paiement** | FedaPay / Kkiapay / CinetPay (Mobile Money) |
| **Génération PDF** | jsPDF ou `@react-pdf/renderer` |
| **Stockage logos** | Supabase Storage |
| **Styling** | Tailwind CSS (recommandé) |

---

## 👤 3. Parcours utilisateur (PROPRIÉTAIRE du compte)

```
1. Arrivée sur le site
        ↓
2. Création d'un compte (email + mot de passe)
        ↓
3. Choix du niveau (Basique / Premium / VIP)
        ↓
4. Paiement via Mobile Money
        ↓
5. Configuration du compte bancaire fictif
   (titulaire, IBAN, BIC, banque, logo, devise, solde, etc.)
        ↓
6. Configuration du scénario de virement
   (nombre d'étapes, codes, motifs)
        ↓
7. Choix de la langue + durée du lien
        ↓
8. Génération du lien + mot de passe (auto ou manuel)
        ↓
9. Suivi en temps réel des actions du client
   (tableau de bord avec notifications)
        ↓
10. Validation manuelle des demandes de codes
```

---

## 👥 4. Parcours visiteur (CLIENT) dans l'espace privé

```
1. Réception du lien + mot de passe (par l'utilisateur)
        ↓
2. Accès au lien → page de connexion
        ↓
3. Saisie du mot de passe
        ↓
4. Découverte du tableau de bord client
   (solde, infos compte, historique)
        ↓
5. Lancement d'un nouveau virement
        ↓
6. Saisie des infos du destinataire
   (nom, IBAN, BIC, banque, montant, motif)
        ↓
7. Étape 1 : "Validation OTP"
   → Bouton "Demander le code"
   → Saisie du code reçu
   → Déblocage
        ↓
8. Étape 2 : "Code SWIFT" (même processus)
        ↓
9. Étape N : (autant que défini par l'utilisateur)
        ↓
10. ✅ Virement validé
        - Message de succès
        - Référence de transaction
        - Date / heure
        - Reçu PDF téléchargeable
        ↓
11. Le solde diminue dans l'espace client
        ↓
12. Possibilité de faire un autre virement
```

---

## ✨ 5. Fonctionnalités principales

### 5.1 Authentification

- Inscription par **email + mot de passe**
- Connexion / Déconnexion
- Récupération de mot de passe par email
- Pas d'authentification sociale

### 5.2 Tarification (paiement par compte)

| Niveau | Prix |
|---|---|
| **Basique** | 5 200 FCFA |
| **Premium** | 6 200 FCFA |
| **VIP** | 7 200 FCFA |

- **Un paiement = un compte fictif créé**
- Paiement via FedaPay / Kkiapay / CinetPay (Mobile Money)
- Différenciation des niveaux par : limite de virements actifs simultanés, fonctionnalités premium (PDF personnalisable, plus d'étapes, etc.)

### 5.3 Configuration du compte bancaire fictif

L'utilisateur saisit toutes ces informations :

- **Titulaire** (nom + prénom)
- **IBAN / RIB**
- **BIC / SWIFT**
- **Adresse postale**
- **Téléphone**
- **Email du titulaire**
- **Devise** : XOF, EUR, USD, GBP, CHF, JPY, etc. (sélection libre)
- **Type de compte** : courant / épargne / professionnel / business
- **Nom de la banque** (saisi par l'utilisateur)
- **Logo de la banque** (upload par l'utilisateur → Supabase Storage)
- **Agence**
- **Date d'ouverture du compte**
- **Solde initial**

### 5.4 Configuration du scénario de virement

L'utilisateur définit **librement** :

- **Le nombre d'étapes d'interruption** (2, 3, 5, 10... au choix)
- **Le motif de chaque étape** (sélection dans une liste prédéfinie) :
  - Validation OTP (code SMS)
  - Code SWIFT international
  - Vérification anti-fraude
  - Compliance AML (anti-blanchiment)
  - Frais bancaires à régler
  - Validation manager
  - Code de confirmation final
  - Validation 3D Secure
  - Autorisation cellule conformité
  - Code IBAN de sécurité
  - (Liste extensible)
- **Le code à fournir pour chaque étape** (saisi par l'utilisateur)
- L'**ordre** d'apparition des étapes

⚠️ **Les codes sont visibles UNIQUEMENT dans l'espace utilisateur** (propriétaire), jamais dans l'espace client.

### 5.5 Génération du lien client

- **Slug unique** (ex: `/client/x9k2m4n8p7`)
- **Mot de passe** :
  - Option A : généré automatiquement par le système
  - Option B : choisi par l'utilisateur
- **Durée de validité** : choisie librement par l'utilisateur (7j, 30j, 90j, 1 an, illimité…)
- **Langue** : choisie par l'utilisateur, l'espace client s'affiche dans cette langue (FR / EN minimum, extensible)

### 5.6 Tableau de bord PROPRIÉTAIRE (temps réel)

- Vue d'ensemble du compte (solde, devise, infos)
- **Liste des étapes** configurées avec leurs codes
- **Notifications temps réel** quand le client :
  - Se connecte à l'espace
  - Démarre un virement
  - Saisit les infos destinataire
  - Demande un code (alerte importante)
  - Bloque/échoue à une étape
  - Termine un virement
- **Bouton "Valider la demande"** → débloque le code pour le client
- Historique de toutes les actions (audit log)
- Possibilité de **recharger le solde** manuellement
- Possibilité de **modifier/regénérer** le mot de passe
- Possibilité de **désactiver le lien** à tout moment

### 5.7 Espace CLIENT privé

- Page de connexion avec mot de passe
- Dashboard client avec :
  - Solde du compte (mis à jour en temps réel)
  - Informations du compte (lecture seule)
  - Historique des virements effectués
  - Bouton **"Effectuer un virement"**
- **Formulaire de virement** (rempli par le client) :
  - Nom du bénéficiaire
  - IBAN du bénéficiaire
  - BIC du bénéficiaire
  - Banque du bénéficiaire
  - **Montant**
  - **Motif** du virement
  - Devise (par défaut celle du compte)
- **Processus à étapes** (selon configuration de l'utilisateur) :
  - À chaque étape : message d'interruption + bouton "Demander le code"
  - Saisie du code reçu → déblocage
  - Passage à l'étape suivante
- **Virements multiples** possibles dans la même session

### 5.8 Confirmation de virement réussi

- ✅ **Message de confirmation** stylé
- 🆔 **Référence de transaction** unique (ex: `TRX-20260428-A7B3K9`)
- 🕐 **Date et heure** précises
- 💰 Montant + devise
- 👤 Infos titulaire + bénéficiaire
- 📄 **Reçu PDF téléchargeable** :
  - Logo de la banque (en haut)
  - Nom de la banque
  - Référence de transaction
  - Date/heure
  - Infos émetteur (titulaire, IBAN, BIC)
  - Infos destinataire
  - Montant + devise
  - Motif
  - Frais (si applicable)
  - Cachet/signature stylisée
- 📉 **Le solde diminue automatiquement** après le virement

---

## 🗄️ 6. Modèle de données (Supabase)

### Table `users` (Supabase Auth)
- `id` (UUID), `email`, `created_at`

### Table `bank_accounts`
- `id` (UUID)
- `user_id` (FK → users)
- `tier` (basique / premium / vip)
- `holder_name`, `iban`, `bic`
- `address`, `phone`, `holder_email`
- `currency` (XOF / EUR / USD / etc.)
- `account_type` (courant / épargne / pro / business)
- `bank_name`
- `bank_logo_url` (Supabase Storage)
- `branch`
- `opening_date`
- `current_balance` (decimal)
- `language` (fr / en / etc.)
- `created_at`

### Table `payments`
- `id`, `user_id`, `bank_account_id`
- `amount`, `tier`, `provider`, `transaction_id`, `status`, `created_at`

### Table `transfer_steps_config`
- `id`
- `bank_account_id` (FK)
- `order` (1, 2, 3...)
- `step_type` (otp / swift / aml / fraud / fees / manager / etc.)
- `step_label_custom` (optionnel)
- `unlock_code` (chiffré)

### Table `share_links`
- `id`
- `bank_account_id` (FK)
- `slug` (unique)
- `password_hash`
- `expires_at` (date choisie par l'utilisateur)
- `is_active` (boolean)
- `created_at`

### Table `transfers` (virements effectués par le client)
- `id`
- `bank_account_id` (FK)
- `share_link_id` (FK)
- `recipient_name`, `recipient_iban`, `recipient_bic`, `recipient_bank`
- `amount`, `currency`, `motif`
- `status` (in_progress / completed / cancelled)
- `current_step` (étape actuelle)
- `transaction_reference` (ex: TRX-20260428-A7B3K9)
- `pdf_url` (lien du reçu généré)
- `started_at`, `completed_at`

### Table `transfer_step_attempts`
- `id`
- `transfer_id` (FK)
- `step_order`
- `code_requested_at`
- `code_validated_by_owner_at`
- `code_entered_by_client_at`
- `success` (boolean)

### Table `realtime_events` (notifications temps réel)
- `id`
- `bank_account_id` (FK)
- `event_type` (client_connected / transfer_started / code_requested / step_unlocked / transfer_completed)
- `payload` (JSON)
- `read` (boolean)
- `created_at`

---

## 🎨 7. Pages du site

### Côté propriétaire (utilisateur)
| Page | URL | Description |
|---|---|---|
| Accueil | `/` | Présentation + CTA |
| Inscription | `/signup` | Création de compte |
| Connexion | `/login` | Connexion |
| Tarifs | `/pricing` | Affichage des 3 niveaux |
| Paiement | `/payment/:tier` | Mobile Money |
| Création compte | `/create-account` | Formulaire compte bancaire fictif |
| Configuration scénario | `/configure-steps/:id` | Définition des étapes |
| Dashboard | `/dashboard` | Vue d'ensemble + temps réel |
| Détails compte | `/account/:id` | Détails + historique |
| Notifications | `/notifications` | Centre de notifications |

### Côté client (visiteur)
| Page | URL | Description |
|---|---|---|
| Login client | `/client/:slug` | Saisie du mot de passe |
| Dashboard client | `/client/:slug/home` | Solde + infos + historique |
| Nouveau virement | `/client/:slug/transfer` | Formulaire de virement |
| Étapes | `/client/:slug/transfer/:id/step/:n` | Pages d'interruption |
| Succès | `/client/:slug/transfer/:id/success` | Confirmation + PDF |

---

## 🔒 8. Sécurité

- Hashage des mots de passe utilisateurs (Supabase Auth)
- Hashage des mots de passe d'accès aux espaces clients (bcrypt)
- Chiffrement des **codes de déblocage** en base
- Protection CSRF / XSS
- Rate limiting sur :
  - Tentatives de connexion espace client (max 5 par 15 min)
  - Demandes de code par étape
- HTTPS obligatoire (Vercel)
- Logs d'audit complets (qui a fait quoi et quand)

---

## 🚀 9. Roadmap de développement

1. **Phase 1** : Setup projet (React + Vercel + Supabase + Tailwind)
2. **Phase 2** : Authentification utilisateur
3. **Phase 3** : Système de paiement Mobile Money
4. **Phase 4** : CRUD compte bancaire fictif + upload logo
5. **Phase 5** : Configuration des étapes de virement
6. **Phase 6** : Génération du lien + mot de passe
7. **Phase 7** : Espace client avec connexion par mot de passe
8. **Phase 8** : Formulaire de virement + processus à étapes
9. **Phase 9** : Système temps réel (Supabase Realtime + notifications)
10. **Phase 10** : Génération PDF du reçu
11. **Phase 11** : Internationalisation (FR/EN)
12. **Phase 12** : Tests + déploiement final

---

## 📝 10. Notes complémentaires

- ⚠️ **Mention obligatoire** sur le site et dans les espaces clients : *"Ce service est un simulateur à but pédagogique uniquement. Aucune transaction bancaire réelle n'est effectuée. Aucun fonds réel n'est manipulé."*
- Design **responsive** (mobile + desktop)
- Interface principale en **français**
- Espace client dans la **langue choisie par l'utilisateur**
- Prévoir une **bannière de simulation** discrète mais visible dans l'espace client (ex: "MODE SIMULATION") pour éviter toute confusion

---

## 🔄 11. Liens entre Site 1 et Site 2

Comme les deux sites partagent :
- La même stack technique
- Le même système de paiement et tarification
- La même base d'authentification

→ Il sera intéressant à terme de **mutualiser le compte utilisateur** entre les deux plateformes (un seul login pour les deux services), mais ce n'est pas obligatoire pour le projet scolaire.

---

*Fin du cahier des charges — Site 2*
