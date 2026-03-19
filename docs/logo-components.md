# Logo Components Documentation

## Overview

VoiceScribe logo components for web and mobile apps.

## Components

### Web (`web/src/components/logo/`)

#### LogoIcon
Animated SVG logo icon with gradient colors.

```tsx
import { LogoIcon } from '@/components/logo';

<LogoIcon size={128} className="custom-class" animate={true} />
```

**Props:**
- `size?: number` - Width/height in pixels (default: 128)
- `className?: string` - Additional CSS classes
- `animate?: boolean` - Enable pulse glow animation (default: false)

#### LogoWordmark
Text component showing "Voice" + "Draft" with optional tagline.

```tsx
import { LogoWordmark } from '@/components/logo';

<LogoWordmark size="lg" showTagline={true} />
```

**Props:**
- `size?: 'sm' | 'md' | 'lg' | 'xl'` - Text size (default: 'md')
- `showTagline?: boolean` - Show tagline below (default: false)

### Mobile (`mobile-app/components/logo/`)

#### LogoIcon
Static SVG logo icon using react-native-svg.

```tsx
import { LogoIcon } from '@/components/logo';

<LogoIcon size={128} />
```

**Props:**
- `size?: number` - Width/height in points (default: 128)

#### LogoWordmark
Text component using React Native Text.

```tsx
import { LogoWordmark } from '@/components/logo';

<LogoWordmark size="lg" showTagline={true} />
```

**Props:**
- `size?: 'sm' | 'md' | 'lg' | 'xl'` - Font size (default: 'md')
- `showTagline?: boolean` - Show tagline below (default: false)

#### AnimatedLogoIcon
Animated version with entrance and pulse effects.

```tsx
import { AnimatedLogoIcon } from '@/components/logo';

<AnimatedLogoIcon size={128} />
```

**Props:**
- `size?: number` - Width/height in points (default: 128)

## Animation Classes (Web)

Add these classes for additional effects:

- `animate-pulse-glow` - Pulse with glow effect
- `animate-float` - Gentle floating motion
- `animate-fade-in-up` - Fade in with upward movement
- `animate-delay-{100|200|300|400}` - Staggered delays

## Color Palette

- Purple accent: `#AFA9EC` → `#7F77DD`
- Teal accent: `#9FE1CB` → `#5DCAA5`
- Background (midnight): `#121210`
- Text light: `#F0EDE6`
- Text dark: `#121210`

## Usage Examples

### Web Navigation

```tsx
import { LogoIcon, LogoWordmark } from '@/components/logo';
import Link from 'next/link';

<Link href="/" className="flex items-center gap-2 group">
  <LogoIcon size={32} className="transition-transform duration-300 group-hover:scale-110" />
  <LogoWordmark size="md" className="hidden sm:block" />
</Link>
```

### Web Hero Section

```tsx
<div className="text-center">
  <div className="animate-fade-in-up mb-8">
    <LogoIcon size={192} className="animate-float" animate={true} />
  </div>
  <div className="animate-fade-in-up animate-delay-200">
    <LogoWordmark size="xl" showTagline={true} />
  </div>
</div>
```

### Mobile Splash Screen

```tsx
import { View } from 'react-native';
import { AnimatedLogoIcon } from '@/components/logo/AnimatedLogoIcon';
import { LogoWordmark } from '@/components/logo/LogoWordmark';

<View style={styles.container}>
  <AnimatedLogoIcon size={128} />
  <LogoWordmark size="lg" showTagline={true} />
</View>
```
