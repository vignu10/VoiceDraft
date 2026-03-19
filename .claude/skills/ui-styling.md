# VoiceScribe UI Styling Skill

This skill provides consistent SaaS-level styling with an **Arc Browser-inspired** soft pastel theme for the VoiceScribe React Native application.

## Color Theme Philosophy

**Light Mode**: Warm creamy white backgrounds, soft periwinkle/lavender primary, coral pink accent - airy and playful
**Dark Mode**: Cozy warm darks (not cold blue-grays), brighter periwinkle glow, warm coral accent

Think Arc Browser - soft pastels, playful personality, warm and refined. Not generic tech.

## Design System Files

Always import from these files:

```typescript
// Theme colors and design tokens
import { ThemeColors, Palette, Typography, Spacing, BorderRadius, Shadows } from '@/constants/design-system';

// Animation constants
import { Duration, Easings, Springs, Stagger } from '@/constants/animations';

// Theme hook - ALWAYS use this for colors
import { useThemeColors } from '@/hooks/use-theme-color';

// Animated components
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedInput,
  AnimatedListItem,
  Skeleton,
  AnimatedBadge,
  PressableScale,
  FadeIn,
  SlideIn,
  ScaleIn
} from '@/components/ui/animated';
```

## Color Usage Rules

### NEVER use hardcoded colors - Always use `useThemeColors()` hook

```typescript
const colors = useThemeColors();
```

### Primary Colors (Periwinkle/Lavender)
- `colors.primary` - Main actions, primary buttons (soft purple)
- `colors.primaryLight` - Subtle lavender backgrounds
- `colors.accent` - Warm coral/pink for highlights and warmth

### Text Colors
- `colors.text` - Primary text (near black / bright white)
- `colors.textSecondary` - Secondary information
- `colors.textMuted` - Hints, placeholders, disabled text
- `colors.textInverse` - Text on primary-colored backgrounds

### Background Colors
- `colors.background` - Main screen background
- `colors.backgroundSecondary` - Slightly tinted secondary
- `colors.surface` - Card backgrounds, elevated surfaces
- `colors.card` - Card specific background

### Border Colors
- `colors.border` - Standard borders
- `colors.borderLight` - Subtle dividers
- `colors.borderFocus` - Focus rings (orange)
- `colors.cardBorder` - Card borders

### Semantic Colors
- `colors.success` / `colors.successLight` - Positive actions
- `colors.error` / `colors.errorLight` - Errors, destructive
- `colors.warning` / `colors.warningLight` - Caution
- `colors.recording` - Recording state (red)
- `colors.paused` - Paused state (amber)

## Animation Rules

### Button Interactions
```typescript
// Use Springs.press for button feedback
scale: 0.97
spring: Springs.press
```

### Screen Transitions
```typescript
<FadeIn delay={0}>
  <Header />
</FadeIn>

<SlideIn direction="up" delay={100}>
  <Content />
</SlideIn>
```

### List Animations
```typescript
{items.map((item, index) => (
  <AnimatedListItem key={item.id} delay={index * 50}>
    {item.content}
  </AnimatedListItem>
))}
```

### Timing Constants
- `Duration.fast` (150ms) - Quick feedback, exits
- `Duration.normal` (200ms) - Standard transitions
- `Duration.moderate` (300ms) - Modal enters
- `Duration.slow` (400ms) - Complex animations

## Spacing Scale

```typescript
Spacing[2]  // 8px  - Tight spacing, icon gaps
Spacing[3]  // 12px - Compact padding
Spacing[4]  // 16px - Standard padding
Spacing[6]  // 24px - Section spacing
Spacing[8]  // 32px - Large gaps
Spacing[12] // 48px - Extra large gaps
```

## Typography Scale

```typescript
// Headings
fontSize: Typography.fontSize['3xl'], // 30px - Page titles
fontSize: Typography.fontSize['2xl'], // 24px - Section titles
fontSize: Typography.fontSize.xl,     // 20px - Card titles

// Body
fontSize: Typography.fontSize.base,   // 15px - Body text
fontSize: Typography.fontSize.sm,     // 13px - Secondary text
fontSize: Typography.fontSize.xs,     // 11px - Captions, labels

// Weights
fontWeight: Typography.fontWeight.bold,     // 700 - Headings
fontWeight: Typography.fontWeight.semibold, // 600 - Subheadings
fontWeight: Typography.fontWeight.medium,   // 500 - Emphasis
fontWeight: Typography.fontWeight.normal,   // 400 - Body
```

## Border Radius Scale

```typescript
BorderRadius.sm   // 4px  - Small elements
BorderRadius.md   // 8px  - Badges, small buttons
BorderRadius.lg   // 12px - Inputs, medium buttons
BorderRadius.xl   // 16px - Cards, large buttons
BorderRadius['2xl'] // 20px - Large cards
BorderRadius.full // 9999px - Pills, avatars
```

## Shadow Scale

```typescript
Shadows.sm   // Subtle elevation
Shadows.md   // Cards at rest
Shadows.lg   // Elevated cards, floating elements
Shadows.xl   // Modals, popovers
Shadows.glow // Periwinkle glow for primary action highlights
```

## Component Patterns

### Primary Button (Periwinkle)
```tsx
<AnimatedButton variant="primary" size="lg" onPress={handlePress}>
  Get Started
</AnimatedButton>
```

### Secondary Button (Outlined)
```tsx
<AnimatedButton variant="secondary" size="md" onPress={handlePress}>
  Learn More
</AnimatedButton>
```

### Card
```tsx
<AnimatedCard variant="elevated" delay={index * 50}>
  <View style={{ padding: Spacing[4] }}>
    <ThemedText style={{ color: colors.text }}>Content</ThemedText>
  </View>
</AnimatedCard>
```

## Checklist Before Committing

- [ ] All colors use `useThemeColors()` hook
- [ ] Primary = periwinkle/lavender, Accent = coral/pink
- [ ] Animations use constants from `@/constants/animations`
- [ ] Spacing uses `Spacing` scale constants
- [ ] Border radius uses `BorderRadius` scale
- [ ] Interactive elements have press feedback (PressableScale)
- [ ] List items have staggered entry animations
- [ ] Shadows use `Shadows` scale
- [ ] Typography uses `Typography` scale
- [ ] Works correctly in both light and dark modes
