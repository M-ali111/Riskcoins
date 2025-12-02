# Quick Reference: Responsive Breakpoints & Classes

## Breakpoints Overview

```
320px          400px          600px          900px         1200px        1400px
  |              |              |              |              |              |
  |---Mobile-----|---Tablet-----|--Desktop-----|--Large Desktop----------------|
  Extra Small    Small Mobile   Small Tablet   Medium        Large          XL
```

## CSS Breakpoint Reference

### Extra Large (1400px+)
```css
@media (min-width: 1400px)
```
- Max content width: 1200px
- Card padding: 24px
- Full feature set

### Large Desktop (1200px - 1399px)
```css
@media (min-width: 1200px) and (max-width: 1399px)
```
- Max content width: 1140px
- Standard desktop layout

### Medium Desktop/Tablet Landscape (900px - 1199px)
```css
@media (min-width: 900px) and (max-width: 1199px)
```
- Full width with 20px padding
- Shop grid: ~3-4 items per row
- Header font: 20px

### Tablet Portrait (600px - 899px)
```css
@media (min-width: 600px) and (max-width: 899px)
```
- Mobile menu enabled
- 2-column grid layout
- Shop grid: 2 items per row
- Card padding: 16px
- Header font: 18px

### Mobile (320px - 599px)
```css
@media (max-width: 599px)
```
- Single column layout
- Full-width buttons
- Mobile menu enabled
- Card padding: 14px
- Header font: 16px
- Input font: 16px (prevents iOS zoom)

### Extra Small Mobile (320px - 400px)
```css
@media (max-width: 400px)
```
- Minimal padding: 10-12px
- Shop grid: 1 item per row
- Compact spacing

## Common Utility Classes

### Display Control
```html
<div class="hide-mobile">Hidden on mobile</div>
<div class="show-mobile">Only shown on mobile</div>
```

### Layout
```html
<div class="flex items-center justify-between gap-2">
  <span>Left content</span>
  <span>Right content</span>
</div>
```

### Spacing
```html
<div class="p-2 m-1">Padding 16px, Margin 8px</div>
<div class="mt-auto">Margin top auto</div>
```

### Width
```html
<div class="w-full">Full width</div>
<div class="max-w-md">Max width 600px (responsive)</div>
```

### Text
```html
<h1 class="text-xl text-center">Large centered text</h1>
<p class="text-sm text-muted">Small muted text</p>
```

## Component Examples

### Responsive Grid
```html
<div class="grid">
  <div class="col-12">Full width</div>
  <div class="col-8">8 columns (desktop) → Full (mobile)</div>
  <div class="col-4">4 columns (desktop) → Full (mobile)</div>
</div>
```

### Shop Grid
```html
<div class="shop-grid">
  <div class="item-card">
    <img src="item.jpg" alt="Item">
    <h4>Item Name</h4>
    <p class="meta">Description</p>
    <button class="buy-btn">Buy Now</button>
  </div>
</div>
```
- Desktop: 4-5 items per row
- Tablet: 2-3 items per row  
- Mobile: 2 items per row
- Small mobile: 1 item per row

### Responsive Table
```html
<div class="table-wrap">
  <table class="table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Points</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <!-- rows here -->
    </tbody>
  </table>
</div>
```
- Horizontal scroll on mobile
- Sticky headers
- Reduced padding on small screens

### House Leaderboard
```html
<div class="house-row">
  <img src="logo.jpg" class="house-logo" alt="House">
  <div class="house-info">
    <div class="house-name">House Name</div>
    <div class="house-points">1234 points</div>
  </div>
  <div class="bar-wrap">
    <div class="bar" style="width: 75%">75%</div>
  </div>
</div>
```

### Button Groups
```html
<div class="btn-group">
  <button class="btn">Action 1</button>
  <button class="btn btn-secondary">Action 2</button>
  <button class="btn btn-danger">Delete</button>
</div>
```
- Horizontal on desktop
- Vertical stack on mobile

### Form with Controls
```html
<div class="control-row">
  <input type="text" placeholder="Name">
  <input type="number" placeholder="Amount">
  <button class="btn">Submit</button>
</div>
```
- Horizontal on desktop
- Vertical stack on mobile

### Modal
```html
<div class="modal-backdrop">
  <div class="modal">
    <h3>Modal Title</h3>
    <div class="row">
      <input type="text" placeholder="Field 1">
      <input type="text" placeholder="Field 2">
    </div>
    <button class="btn w-full">Submit</button>
  </div>
</div>
```

## CSS Variables Reference

```css
:root {
  --brand-1: #0b2a66;        /* Deep navy */
  --brand-2: #1f6feb;        /* Bright blue */
  --brand-accent: #f59e0b;   /* Golden accent */
  
  --primary: var(--brand-2);
  --primary-600: var(--brand-1);
  
  --bg: #F5F7FF;
  --card: #ffffff;
  --muted: #6B7280;
  --border: #E6E9F8;
  
  --danger: #E53E3E;
  --success: #38A169;
  
  --radius: 12px;
  --shadow: 0 6px 20px rgba(20,25,60,0.06);
}
```

## Testing Quick Checks

### Chrome DevTools
1. Press F12
2. Click device toolbar icon (Ctrl+Shift+M)
3. Test these preset sizes:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1920px)

### Firefox Responsive Design Mode
1. Press Ctrl+Shift+M
2. Test custom sizes:
   - 320px (smallest)
   - 375px (iPhone)
   - 768px (iPad)
   - 1366px (laptop)
   - 1920px (desktop)

### Quick Mobile Test
```
320px  - Extra small phone
375px  - iPhone SE
390px  - iPhone 12/13/14
414px  - iPhone Plus
600px  - Small tablet
768px  - iPad
1024px - iPad Pro
1366px - Small laptop
1920px - Desktop
```

## Common Patterns

### Center Content
```html
<div class="flex items-center justify-center" style="min-height: 100vh;">
  <div class="card max-w-md">
    Centered content
  </div>
</div>
```

### Split Layout
```html
<div class="grid">
  <div class="col-8">Main content</div>
  <div class="col-4">Sidebar</div>
</div>
<!-- Mobile: Both full width, stacked -->
```

### Full-Width Button on Mobile
```html
<button class="btn">
  Submit
</button>
<!-- Automatically full width < 600px -->
```

## Performance Tips

1. **Use CSS transforms for animations** (not margin/padding)
2. **Avoid layout thrashing** - batch DOM reads/writes
3. **Use will-change sparingly** for animations
4. **Optimize images** for different screen sizes
5. **Lazy load images** below the fold
6. **Test on real devices** when possible

## Accessibility Notes

- ✅ Minimum touch target: 44x44px on mobile
- ✅ Focus indicators on all interactive elements
- ✅ Proper heading hierarchy
- ✅ ARIA labels on navigation toggles
- ✅ Color contrast meets WCAG AA standards
- ✅ Text remains readable without zoom
- ✅ Skip links for keyboard navigation (can be added)

---

**Remember**: Test on real devices when possible. Simulators are good but don't replace actual hardware testing!
