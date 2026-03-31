# Contributing to VoiceScribe

This document describes the development workflow for all VoiceScribe engineers.

## Pull Request Workflow

**All code changes must go through pull requests.** No direct commits to `main` are allowed.

### Branch Strategy

VoiceScribe uses a **three-tier branch strategy**:

| Branch | Purpose | Protection |
|--------|---------|------------|
| `main` | Production releases only. Only merged from `development` for releases. | No direct pushes, PR approval required |
| `development` | Integration branch for all features. Default base for all feature PRs. | No direct pushes, PR approval required |
| `feature/*` | Feature branches. Created from `development`, merged back to `development`. | No protection rules |

**Rule:** All feature branches must merge into `development`. Only `development` merges into `main` for releases.

### 1. Branch Naming

Create a feature branch from the latest `development`:

```
feature/<TICKET-ID>-short-description
```

Examples:
- `feature/VIGA-32-recording-ui`
- `feature/VIGA-31-api-scaffolding`
- `feature/VIGA-12-redesign-hero`

### 2. Commit Messages

Each commit must reference the associated ticket:

```
<type>(<scope>): <description> [<TICKET-ID>]
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

Examples:
- `feat(recording): add audio waveform display [VIGA-32]`
- `fix(api): resolve transcription timeout [VIGA-25]`
- `docs: update API README [VIGA-20]`

### 3. Pull Request Checklist

Before creating a PR, ensure:

- [ ] Branch created from latest `development`
- [ ] PR targets `development` (not `main`)
- [ ] All commits reference the ticket ID
- [ ] PR description includes ticket link
- [ ] PR body includes `Resolves #TICKET-NUMBER` or `Closes #TICKET-NUMBER`
- [ ] Tests passing (if applicable)
- [ ] Code follows project conventions (see CLAUDE.md)

### 4. PR Template

```markdown
## Description
Brief description of changes.

## Ticket
Resolves #TICKET-NUMBER

## Changes
- Bullet point list of changes

## Testing
How this was tested.
```

### 5. Review and Merge

- Do not merge your own PRs
- Wait for code review approval
- Address review comments
- After merge, delete the feature branch

### 6. Protected Branch Rules

Both `main` and `development` branches are protected:
- **No direct pushes** allowed
- **PR approval required** before merge
- **Status checks must pass** before merge

**Release Flow:** When `development` is ready for a release, create a PR from `development` → `main`. This requires explicit approval and represents a version release.

## Getting Started

See [README.md](./README.md) for project setup instructions.

## Questions?

Contact the CTO for workflow clarification.
