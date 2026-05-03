# 📖 GIT WORKFLOW - Guide de Travail Git

**Date**: 3 mai 2026  
**Status**: ✅ Repository Initialized  
**Main Branches**: main, develop

---

## 🌳 Branch Strategy

### Main Branches

```
main ──────────────────────────────
      (Production-ready, stable)
      
develop ───────────────────────────
        (Development, for Phase 2+)
```

### Branch Workflow

```
develop
  ├── feature/auth-system ─────┐
  ├── feature/payment ─────────┤
  ├── fix/ui-bug ──────────────┤
  └── audit/security ──────────┘
        (merge back to develop after PR)
         
    ──→ develop (tested) ──→ main (production)
```

---

## 📋 Branching Rules

### Branch Naming Convention

```
main                    # Production-ready
develop                 # Development branch
feature/name            # New features
fix/name               # Bug fixes
audit/name             # Security/audit work
docs/name              # Documentation
refactor/name          # Code refactoring
```

### Example Branch Names
```
feature/phase-2-auth
feature/payment-integration
fix/login-validation-bug
audit/security-review
docs/api-documentation
refactor/component-structure
```

---

## 💻 Git Workflow Commands

### Initial Setup (DONE ✅)
```bash
git init                                    # ✅ Done
git config user.name "Simulateur Dev"      # ✅ Done
git config user.email "dev@simulateur.local" # ✅ Done
git add .                                   # ✅ Done
git commit -m "feat: Phase 1 - Setup..."   # ✅ Done
git branch develop                          # ✅ Done
```

### For Phase 2 Development

#### 1. Create Feature Branch
```bash
git checkout develop
git pull origin develop              # Always sync first
git checkout -b feature/phase-2-auth
```

#### 2. Make Changes
```bash
# Edit files, test, etc.
git add src/context/AuthContext.jsx
git add src/hooks/useAuth.js
```

#### 3. Commit Changes
```bash
git commit -m "feat: Implement Supabase Auth integration

- Create AuthContext with useAuth hook
- Implement signup handler
- Implement login handler
- Add JWT token management
- Add error handling"
```

#### 4. Push to Remote
```bash
git push origin feature/phase-2-auth
```

#### 5. Create Pull Request (GitHub)
- Go to GitHub repo
- Click "New Pull Request"
- Set base: develop
- Set compare: feature/phase-2-auth
- Add description
- Request review
- Merge after approval

#### 6. Cleanup
```bash
git checkout develop
git pull origin develop
git branch -d feature/phase-2-auth
```

---

## 📝 Commit Message Convention

### Format
```
type: subject

body (optional)

footer (optional)
```

### Types
```
feat:   New feature
fix:    Bug fix
test:   Test addition
audit:  Security/audit work
docs:   Documentation
chore:  Configuration/dependencies
refactor: Code refactoring
style:  Code style (no functional change)
perf:   Performance improvement
```

### Examples
```
feat: Add Supabase Auth integration
fix: Correct form validation bug
test: Add unit tests for auth
audit: Implement rate limiting
docs: Update API documentation
chore: Update dependencies
```

### Good Commit Messages
✅ `feat: Implement user authentication with JWT tokens`  
✅ `fix: Resolve password validation regex issue`  
✅ `docs: Add setup instructions for Supabase`  
✅ `test: Add comprehensive auth flow tests`

### Bad Commit Messages
❌ `updated code`  
❌ `fixes things`  
❌ `WIP`  
❌ `asdf`

---

## 🔍 Common Git Commands

### View Status
```bash
git status                  # Current changes
git log --oneline -10      # Recent commits
git branch -a              # All branches
git diff                   # Unstaged changes
git diff --staged          # Staged changes
```

### Undo Changes
```bash
git checkout -- filename    # Discard changes in file
git reset HEAD filename     # Unstage file
git revert commit-hash     # Undo specific commit
git reset --hard HEAD~1    # Undo last commit (CAREFUL!)
```

### Merge/Rebase
```bash
git merge feature/branch    # Merge branch into current
git rebase develop         # Rebase current onto develop
git cherry-pick commit     # Apply specific commit
```

### Stash Changes
```bash
git stash                  # Save changes temporarily
git stash list             # View stashed changes
git stash pop              # Apply stashed changes
```

---

## 📊 Current Repository Status

```
┌─ main (production-ready)
│   └── Commit: b8bf78c "feat: Phase 1 - Setup projet complet"
│       Files: 40 changed, 4744 insertions
│
└─ develop (for Phase 2+)
    └── Same as main (starting point)

Tag: phase-1-complete ✅
```

---

## 🚀 Phase-by-Phase Git Plan

### Phase 1: ✅ DONE
```
main    ──┐─────────────────────────
          └─ Initial commit (b8bf78c)
develop ──┘
```

### Phase 2: Coming (Feature Branch)
```
main    ──────────────────────────────
         
develop ──┬─ feature/phase-2-auth ─┬─
          └─────────────────────────┘
```

### Phase 3-12: Similar Pattern
```
develop ──┬─ feature/phase-3-payment ─┬─
          ├─ fix/bugs ────────────────┤─
          └─ audit/security ──────────┘─
```

---

## 🔐 Important Git Rules

### ✅ DO
- [x] Commit frequently (small, logical chunks)
- [x] Write meaningful commit messages
- [x] Create feature branches for all work
- [x] Test before committing
- [x] Review changes before commit (git diff)
- [x] Pull before pushing to avoid conflicts
- [x] Use .gitignore to protect secrets

### ❌ DON'T
- [ ] Commit directly to main
- [ ] Commit .env.local or credentials
- [ ] Make huge commits (many unrelated changes)
- [ ] Use vague commit messages ("fix typo")
- [ ] Force push to shared branches
- [ ] Commit node_modules/ or build artifacts

---

## 🔗 GitHub Integration (When Ready)

### Connect Remote
```bash
# Option 1: HTTPS
git remote add origin https://github.com/yourusername/repo.git

# Option 2: SSH
git remote add origin git@github.com:yourusername/repo.git

# Verify
git remote -v
```

### Push to GitHub
```bash
# Push main branch
git push -u origin main

# Push develop branch
git push -u origin develop

# Push all branches
git push --all
```

### Pull from GitHub
```bash
git pull origin main
git pull origin develop
```

---

## 📋 Pre-Phase 2 Checklist

- [x] Git initialized
- [x] User configured
- [x] Initial commit done
- [x] Branches created (main, develop)
- [x] .gitignore configured
- [ ] Remote added (when ready for GitHub)
- [ ] Push to GitHub (when ready)

---

## 🎯 Next Steps

### Before Phase 2:
1. ✅ Local git repo ready
2. [ ] (Optional) Create GitHub repo
3. [ ] (Optional) Push to GitHub
4. [ ] Start Phase 2 on develop branch

### During Phase 2:
1. Create `feature/phase-2-auth` branch
2. Implement authentication
3. Commit frequently
4. Create Pull Request on develop
5. Merge after review

### After Each Phase:
1. Merge feature branch to develop
2. Create release branch
3. Merge develop to main
4. Tag release (optional)

---

## 📞 Git Help

### View Help
```bash
git --help
git commit --help
git branch --help
git merge --help
```

### Common Issues

#### Merge Conflict
```bash
# Edit conflicted files
git add conflicted-file.js
git commit -m "chore: Resolve merge conflict"
```

#### Wrong Branch
```bash
git checkout correct-branch
# Or reset if just committed
git reset --soft HEAD~1
git checkout correct-branch
git commit -m "message"
```

#### Undo Last Commit
```bash
git reset --soft HEAD~1  # Keep changes
git reset --hard HEAD~1  # Discard changes
```

---

## 📊 Git Statistics Command

```bash
# View commits by author
git shortlog -sn

# View file change history
git log --oneline -- filename

# View branch info
git branch -vv

# View remote status
git status -sb

# View graph of commits
git log --all --oneline --graph --decorate
```

---

## 🎓 Learning Resources

- **Git Basics**: https://git-scm.com/book/en/v2
- **Git Workflow**: https://www.atlassian.com/git/tutorials/comparing-workflows
- **GitHub Flow**: https://guides.github.com/introduction/flow/
- **Commit Messages**: https://chris.beams.io/posts/git-commit/

---

## 📝 Template Files

### Commit Template (optional)
Create `.gitmessage`:
```
# Subject (imperative, 50 chars max)
# 

# Body (wrap at 72 chars, explain WHAT & WHY)
# 

# Footer (reference issues, breaking changes)
# Fixes #123
# BREAKING CHANGE: ...
```

Then:
```bash
git config commit.template .gitmessage
```

---

**Document Created**: 3 mai 2026  
**Git Status**: ✅ READY  
**Repository State**: Main branch with Phase 1 commit  
**Next Branch**: feature/phase-2-auth (when Phase 2 starts)

---

## 🎊 Summary

✅ **Git Initialized**  
✅ **Branches Created** (main, develop)  
✅ **Initial Commit Done** (40 files, Phase 1)  
✅ **Workflow Documented**  
✅ **Ready for Phase 2**

Your repository is now git-tracked and ready for collaborative development!
