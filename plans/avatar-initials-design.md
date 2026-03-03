# Avatar with Initials - Design Plan

## Overview

When no profile picture is set for a student or teacher, the app should automatically generate an avatar displaying the initials of their name, similar to how WhatsApp and many other apps handle default profile pictures.

## Design Specifications

### Visual Design

#### Initials Extraction Logic
- Extract the first letter of each word in the name
- Maximum 2 initials displayed
- Examples:
  - "John Doe" → "JD"
  - "Muhammad Ali" → "MA"
  - "Sarah" → "S"
  - "Abdul Rahman Khan" → "AR"

#### Color Scheme
Generate a consistent background color based on the name string. This ensures the same person always gets the same color.

**Color Palette (WhatsApp-inspired):**
```javascript
const COLORS = [
  '#E53935', // Red
  '#D81B60', // Pink
  '#8E24AA', // Purple
  '#5E35B1', // Deep Purple
  '#3949AB', // Indigo
  '#1E88E5', // Blue
  '#039BE5', // Light Blue
  '#00ACC1', // Cyan
  '#00897B', // Teal
  '#43A047', // Green
  '#7CB342', // Light Green
  '#C0CA33', // Lime
  '#FDD835', // Yellow
  '#FFB300', // Amber
  '#FB8C00', // Orange
  '#F4511E', // Deep Orange
  '#6D4C41', // Brown
  '#757575', // Gray
]
```

#### Color Selection Algorithm
```javascript
function getColorFromName(name: string): string {
  // Simple hash function to get consistent index
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}
```

### Component Structure

#### Avatar Component Props
```typescript
interface AvatarProps {
  name: string           // Full name to extract initials from
  photo?: string | null  // Optional photo URL or base64
  size?: 'sm' | 'md' | 'lg' | 'xl'  // Size variants
  className?: string     // Additional CSS classes
}
```

#### Size Variants
| Size | Dimensions | Font Size | Usage |
|------|------------|-----------|-------|
| `sm` | 24px | 10px | Small inline avatars |
| `md` | 40px | 16px | List items, cards |
| `lg` | 64px | 24px | Profile headers |
| `xl` | 96px | 36px | Edit form preview |

### Component Behavior

```
┌─────────────────────────────────────────────────────────────┐
│                      Avatar Component                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────────┐                                       │
│   │  photo exists?  │                                       │
│   └────────┬────────┘                                       │
│            │                                                 │
│      ┌─────┴─────┐                                          │
│      │           │                                          │
│     YES         NO                                          │
│      │           │                                          │
│      ▼           ▼                                          │
│  ┌────────┐  ┌──────────────────────────────┐              │
│  │ Render │  │ Generate Initials Avatar     │              │
│  │ Photo  │  │ ┌────────────┐               │              │
│  │        │  │ │    JD      │               │              │
│  │        │  │ │  (colored  │               │              │
│  │        │  │ │   bg)      │               │              │
│  │        │  │ └────────────┘               │              │
│  └────────┘  └──────────────────────────────┘              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### CSS Styling

```css
.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
  flex-shrink: 0;
}

.avatar-sm { width: 24px; height: 24px; font-size: 10px; }
.avatar-md { width: 40px; height: 40px; font-size: 16px; }
.avatar-lg { width: 64px; height: 64px; font-size: 24px; }
.avatar-xl { width: 96px; height: 96px; font-size: 36px; }

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

### Files to Create/Modify

#### New File: `src/components/ui/Avatar.tsx`
- Reusable Avatar component
- Handles photo display and initials fallback
- Exports size variants and color utilities

#### Files to Update:
1. `src/components/routine/StudentDirectory.tsx` - Replace User icon with Avatar
2. `src/components/routine/TeacherDatabase.tsx` - Replace User icon with Avatar
3. `src/components/routine/ClassRoutine.tsx` - Replace User icon with Avatar

### Implementation Steps

1. **Create Avatar Component**
   - Create `src/components/ui/Avatar.tsx`
   - Implement initials extraction logic
   - Implement color selection algorithm
   - Add size variants

2. **Integrate in StudentDirectory**
   - Replace User icon in student cards
   - Replace camera icon in add/edit form

3. **Integrate in TeacherDatabase**
   - Replace User icon in teacher cards
   - Replace camera icon in add/edit form

4. **Integrate in ClassRoutine**
   - Replace User icon in running class banner
   - Replace User icon in schedule items

### Example Usage

```tsx
// In student card
<Avatar 
  name={student.fullName} 
  photo={student.photo} 
  size="lg" 
/>

// In teacher card
<Avatar 
  name={teacher.name} 
  photo={teacher.photo} 
  size="lg" 
/>

// In schedule item (small)
<Avatar 
  name={teacher?.name || ''} 
  photo={teacher?.photo} 
  size="sm" 
/>

// In add/edit form (large)
<Avatar 
  name={formData.fullName} 
  photo={formData.photo} 
  size="xl" 
/>
```

### Dark Mode Support

The avatar component should work seamlessly in both light and dark modes:
- White text color works on all background colors
- No additional dark mode styling needed for the initials
- Photo avatars work the same in both modes

### Accessibility

- Add `aria-label` with the person's name
- Ensure sufficient color contrast (white text on colored backgrounds meets WCAG AA)
- Consider adding `role="img"` for the avatar container
