# VoiceScribe Web Accessibility Documentation

## Overview

This document outlines VoiceScribe's accessibility strategy and implementation guidelines to ensure WCAG 2.1 AA compliance and provide an inclusive experience for all users.

## Touch Targets

### Standard (WCAG 2.5.5 - Level AAA)
- **Minimum size**: 44×44 CSS pixels
- **Rationale**: Ensures users with motor difficulties can easily interact with controls

### Implementation
All interactive elements must meet the 44px minimum:
- Buttons: Use `min-h-[44px]` utility class
- Links: Ensure padding creates adequate touch target size
- Icon buttons: Add explicit sizing or padding

#### Examples
```tsx
// ✅ GOOD - Meets 44px minimum
<button className="px-4 py-2.5 min-h-[44px]">Click me</button>

// ❌ BAD - Too small
<button className="px-3 py-1.5">Click me</button>
```

## Focus Indicators

### Standard (WCAG 2.4.7 - Focus Visible)
- **Requirement**: All interactive elements must have visible focus states
- **Implementation**: Use consistent focus ring styles

### Focus State Pattern
```tsx
focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/50
```

### Component-Specific Guidelines

#### Cards with Links
When an entire card is clickable:
```tsx
// Add focus-within to container
<article className="focus-within:ring-4 focus-within:ring-primary-500/50">

  // Add focus styles to internal links
  <Link className="focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/50">
```

#### Standalone Links
```tsx
<Link className="focus:outline-none focus-visible:rounded-lg focus-visible:ring-4 focus-visible:ring-primary-500/50">
```

## Skip Navigation

### Standard (WCAG 2.4.1 - Bypass Blocks)
- **Requirement**: Provide a mechanism to skip repetitive navigation
- **Implementation**: Skip link at top of page

### Current Implementation
Located in `app/layout.tsx`:
```tsx
<a
  href="#main"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-4 focus:ring-primary-500/50 transition-all"
>
  Skip to main content
</a>
```

### Behavior
- Hidden by default (`sr-only`)
- Visible on keyboard focus (`focus:not-sr-only`)
- Links to `<main id="main">` element

## Image Alt Text Strategy

### Core Principles
1. **Informative images**: Describe the content and function
2. **Decorative images**: Use `alt=""` to hide from screen readers
3. **Redundant content**: Use `alt=""` when text duplicates adjacent content

### Avatar Images

#### When Avatar is a Link
When an avatar serves as a clickable link:
```tsx
<Link href="/blog">
  <Image
    src={avatar_url}
    alt={`${display_name} profile picture`}
    // or
    alt="" // if name is already in adjacent text
  />
</Link>
```

#### Decision Tree
1. **Is the avatar the only label for the link?**
   - Yes: Use descriptive alt, e.g., "John Doe profile picture"
   - No: Use empty alt

2. **Is the name visible adjacent to the avatar?**
   - Yes: Use `alt=""` to avoid redundancy
   - No: Use descriptive alt

### Current Implementation Examples

#### BlogHeader.tsx
Avatar is decorative since name is prominent in adjacent heading:
```tsx
// ✅ CURRENT - Redundant but acceptable
<Image src={avatar_url} alt={full_name || display_name} />

// ✅ BETTER - Avoids redundancy
<Image src={avatar_url} alt="" />
```

#### BlogDiscoveryCard.tsx
Avatar is decorative since blog name is adjacent:
```tsx
// ✅ CURRENT - Acceptable
<Image src={avatar_url} alt={authorName} />

// ✅ BETTER - Avoids redundancy
<Image src={avatar_url} alt="" />
```

### Alt Text Decision Framework
```
Is the image informative?
├── Yes
│   ├── Is the info already in text?
│   │   ├── Yes → Use alt=""
│   │   └── No → Describe the image content
│
└── No (decorative) → Use alt=""
```

## Color Contrast

### Standard (WCAG 2.1 - Contrast)
- **Normal text (< 18px)**: 4.5:1 minimum
- **Large text (≥ 18px)**: 3:1 minimum
- **UI components**: 3:1 minimum

### Implementation
- Use design tokens with semantic names
- Test in both light and dark modes
- Ensure focus indicators meet contrast requirements

## Keyboard Navigation

### Tab Order
- Follow logical DOM order
- Use `tabIndex` only when necessary
- Ensure focus moves predictably

### Keyboard Shortcuts
- None currently implemented
- Future: Consider adding shortcuts for common actions

## Testing Checklist

### Automated Testing
- [ ] Run axe-core or Lighthouse accessibility audit
- [ ] Check for missing alt text
- [ ] Verify color contrast ratios
- [ ] Test touch target sizes

### Manual Testing
- [ ] Navigate entire site using keyboard only
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Verify skip link works
- [ ] Check all focus states are visible
- [ ] Test touch targets on mobile devices

### Browser Testing
- [ ] Chrome (with Accessibility Insights)
- [ ] Firefox (with Accessibility Inspector)
- [ ] Safari (with VoiceOver on macOS)
- [ ] Mobile browsers (iOS, Android)

## Resources

### WCAG Standards
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WAVE](https://wave.webaim.org/)
- [Color Contrast Analyzer](https://developer.paciellogroup.com/resources/contrastanalyser/)

### Screen Readers
- Windows: NVDA (free), JAWS (paid)
- macOS: VoiceOver (built-in)
- iOS: VoiceOver (built-in)
- Android: TalkBack (built-in)

## Maintenance

### Review Schedule
- Quarterly: Full accessibility audit
- Per PR: Check for new accessibility issues
- After design changes: Verify contrast and focus states

### Documentation Updates
- Update this document when adding new patterns
- Document any exceptions or special cases
- Keep examples synchronized with actual implementation

---

**Last Updated**: 2026-03-31
**Maintained By**: Product Designer (Product Designer agent)
**Version**: 1.0
