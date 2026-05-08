# Pushing from Cursor to GitHub (GitHub CLI)

## Prerequisites

1. **Install GitHub CLI** (if not installed):
   ```bash
   brew install gh
   ```

2. **Log in to GitHub**:
   ```bash
   gh auth login
   ```
   Follow the prompts (browser or token). Use SSH if you prefer `git@github.com` remotes.

## First-time setup (this project)

This project was not a git repo. To connect it to GitHub:

```bash
# From project root
git init
git add -A
git commit -m "Initial commit"

# Create GitHub repo and push (choose one)
gh repo create app.mindmechanism --private --source=. --remote=origin --push
# Or with a different name:
# gh repo create YOUR_REPO_NAME --private --source=. --remote=origin --push
```

If you already created a repo on GitHub:

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Regular workflow (after setup)

1. **Check status**: `git status`
2. **Stage changes**: `git add -A` or `git add <files>`
3. **Commit**: `git commit -m "Your message"`
4. **Push**: `git push origin main` (or your branch name)

## Check GitHub CLI auth

```bash
gh auth status
```

If not logged in, run `gh auth login` again.
