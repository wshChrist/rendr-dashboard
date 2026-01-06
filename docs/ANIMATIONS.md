# Guide des Animations

Ce document décrit le système d'animations complet du dashboard RendR.

## Composants d'Animation

### 1. PageTransition
Animation de transition entre les pages.

```tsx
import { PageTransition } from '@/components/animations';

<PageTransition>
  {children}
</PageTransition>
```

### 2. FadeIn
Animation d'apparition avec direction personnalisable.

```tsx
import { FadeIn } from '@/components/animations';

<FadeIn direction="up" delay={0.2} duration={0.5}>
  {content}
</FadeIn>
```

**Props:**
- `direction`: 'up' | 'down' | 'left' | 'right' | 'none' (défaut: 'up')
- `delay`: nombre (défaut: 0)
- `duration`: nombre (défaut: 0.5)
- `className`: string

### 3. StaggerContainer & StaggerItem
Animation en cascade pour les listes d'éléments.

```tsx
import { StaggerContainer, StaggerItem } from '@/components/animations';

<StaggerContainer staggerDelay={0.1}>
  <StaggerItem>Item 1</StaggerItem>
  <StaggerItem>Item 2</StaggerItem>
  <StaggerItem>Item 3</StaggerItem>
</StaggerContainer>
```

### 4. HoverLift
Effet de levée au survol.

```tsx
import { HoverLift } from '@/components/animations';

<HoverLift liftAmount={-4} scale={1.02}>
  {card}
</HoverLift>
```

### 5. SmoothAppear
Apparition au scroll (Intersection Observer).

```tsx
import { SmoothAppear } from '@/components/animations';

<SmoothAppear direction="up" delay={0.2}>
  {content}
</SmoothAppear>
```

## Classes CSS d'Animation

### Animations d'entrée
- `.animate-fade-in-up` - Apparition depuis le bas
- `.animate-fade-in` - Simple fade in
- `.animate-scale-in` - Apparition avec zoom
- `.animate-slide-in-left` - Glissement depuis la gauche
- `.animate-slide-in-right` - Glissement depuis la droite
- `.animate-bounce-in` - Apparition avec rebond
- `.animate-rotate-in` - Apparition avec rotation
- `.animate-zoom-in` - Zoom in
- `.animate-fade-in-scale` - Fade in avec scale

### Animations continues
- `.animate-pulse-subtle` - Pulse subtil
- `.animate-float` - Flottement
- `.animate-glow-pulse` - Pulse de lueur
- `.animate-spin-slow` - Rotation lente
- `.animate-gradient` - Animation de gradient
- `.animate-skeleton-pulse` - Pulse pour skeleton

### Délais d'animation
- `.animation-delay-100` à `.animation-delay-800` - Délais de 100ms à 800ms

### Effets de survol
- `.card-hover` - Effet hover pour les cartes
- `.hover-scale` - Scale au survol
- `.hover-rotate` - Rotation au survol
- `.icon-hover` - Effet hover pour les icônes
- `.btn-ripple` - Effet ripple pour les boutons

## Transitions Globales

Tous les éléments interactifs ont des transitions automatiques :
- **Boutons**: transition de 200ms avec effet de levée
- **Liens**: transition d'opacité
- **Inputs**: scale au focus
- **Cartes**: transition de 300ms
- **Modals/Dialogs**: animation scaleIn
- **Tooltips**: fadeIn
- **Dropdowns**: fadeIn + slideInLeft

## Bonnes Pratiques

1. **Performance**: Utilisez `will-change` pour les animations complexes
2. **Accessibilité**: Respectez `prefers-reduced-motion`
3. **Timing**: Gardez les animations entre 200ms et 600ms
4. **Easing**: Utilisez `cubic-bezier(0.4, 0, 0.2, 1)` pour des transitions fluides

## Exemples d'Utilisation

### Page avec animations en cascade
```tsx
import { StaggerContainer, StaggerItem } from '@/components/animations';

<StaggerContainer>
  {items.map((item, index) => (
    <StaggerItem key={index}>
      <Card>{item.content}</Card>
    </StaggerItem>
  ))}
</StaggerContainer>
```

### Carte avec effet hover
```tsx
import { HoverLift } from '@/components/animations';

<HoverLift>
  <div className="rendr-card">
    Contenu de la carte
  </div>
</HoverLift>
```

### Apparition au scroll
```tsx
import { SmoothAppear } from '@/components/animations';

<SmoothAppear direction="up" delay={0.3}>
  <SectionContent />
</SmoothAppear>
```

