# Contributing to VoiceScribe

This document describes the development workflow for all VoiceScribe engineers.

## Pull Request Workflow

**All code changes must go through pull requests.** No direct commits to `main` are allowed.

### 1. Branch Naming

Create a feature branch from the latest `main`:

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

- [ ] Branch created from latest `main`
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

The `main` branch is protected:
- **No direct pushes** allowed
- **PR approval required** before merge
- **Status checks must pass** before merge

## Getting Started

See [README.md](./README.md) for project setup instructions.

## Questions?

Contact the CTO for workflow clarification.
