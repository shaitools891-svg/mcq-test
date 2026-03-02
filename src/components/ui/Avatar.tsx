import { useMemo } from 'react'

// WhatsApp-inspired color palette
const AVATAR_COLORS = [
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

interface AvatarProps {
  name: string
  photo?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

// Extract initials from name (max 2 characters)
function getInitials(name: string): string {
  if (!name) return '?'
  
  const words = name.trim().split(/\s+/)
  
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase()
  }
  
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
}

// Generate consistent color from name
function getColorFromName(name: string): string {
  if (!name) return AVATAR_COLORS[0]
  
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const sizeClasses = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-10 h-10 text-base',
  lg: 'w-16 h-16 text-2xl',
  xl: 'w-24 h-24 text-[36px]',
}

export default function Avatar({ name, photo, size = 'md', className = '' }: AvatarProps) {
  const initials = useMemo(() => getInitials(name), [name])
  const backgroundColor = useMemo(() => getColorFromName(name), [name])
  
  if (photo) {
    return (
      <div 
        className={`rounded-full overflow-hidden flex-shrink-0 ${sizeClasses[size]} ${className}`}
        role="img"
        aria-label={name}
      >
        <img 
          src={photo} 
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }
  
  return (
    <div 
      className={`rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white uppercase ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor }}
      role="img"
      aria-label={name}
    >
      {initials}
    </div>
  )
}
