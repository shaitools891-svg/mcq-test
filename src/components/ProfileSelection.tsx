import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveProfilePictureToCloud } from '../utils/supabaseClient'

// Base path for deployed assets
const ASSET_BASE = '';

interface Profile {
  id: string
  name: string
  role: 'student' | 'admin'
  avatar: string
}

// Profile data - update avatar paths here
const profiles: Profile[] = [
  {
    id: 'aliza',
    name: 'Aliza',
    role: 'student',
    avatar: './assets/aliza.jpg'
  },
  {
    id: 'eshita',
    name: 'Eshita',
    role: 'student',
    avatar: './assets/eshita.jpg'
  },
  {
    id: 'shapla',
    name: 'Shapla',
    role: 'student',
    avatar: ''
  },
  {
    id: 'shakib',
    name: 'Shakib',
    role: 'admin',
    avatar: './assets/shakib.jpg'
  }
]

// Avatar color mapping for initials
const avatarColors: Record<string, string> = {
  aliza: 'bg-pink-200 dark:bg-pink-800 text-pink-600 dark:text-pink-300',
  eshita: 'bg-violet-200 dark:bg-violet-800 text-violet-600 dark:text-violet-300',
  shapla: 'bg-emerald-200 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-300',
  shakib: 'bg-rose-200 dark:bg-rose-800 text-rose-600 dark:text-rose-300'
}

export default function ProfileSelection() {
  const navigate = useNavigate()
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [customAvatars, setCustomAvatars] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null)

  // Load custom avatars from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('customAvatars')
    if (saved) {
      setCustomAvatars(JSON.parse(saved))
    }
  }, [])

  const handleProfileSelect = (profileId: string) => {
    if (editMode) {
      setEditingProfileId(profileId)
      fileInputRef.current?.click()
    } else {
      setSelectedProfile(profileId)
      localStorage.setItem('selectedProfile', profileId)
      setTimeout(() => {
        navigate('/dashboard')
      }, 300)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && editingProfileId) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        const updatedAvatars = { ...customAvatars, [editingProfileId]: result }
        setCustomAvatars(updatedAvatars)
        
        // Save to localStorage
        const stored = localStorage.getItem('customAvatars')
        const parsed = stored ? JSON.parse(stored) : {}
        parsed[editingProfileId] = result
        localStorage.setItem('customAvatars', JSON.stringify(parsed))
        
        // Sync to Supabase cloud (non-blocking)
        saveProfilePictureToCloud(editingProfileId, result).then(success => {
          if (success) {
            console.log('Profile picture synced to cloud')
          }
        }).catch(err => {
          console.log('Cloud sync failed (offline mode):', err)
        })
      }
      reader.readAsDataURL(file)
    }
    setEditingProfileId(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const clearAvatar = (profileId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = { ...customAvatars }
    delete updated[profileId]
    setCustomAvatars(updated)
    const stored = localStorage.getItem('customAvatars')
    const parsed = stored ? JSON.parse(stored) : {}
    delete parsed[profileId]
    localStorage.setItem('customAvatars', JSON.stringify(parsed))
  }

  const getAvatar = (profile: Profile) => {
    // Check for custom uploaded avatar first
    if (customAvatars[profile.id]) {
      return customAvatars[profile.id]
    }
    // Fall back to configured avatar
    return profile.avatar
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-rose-100 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 flex flex-col items-center justify-center p-4">
      {/* Header with Edit Toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setEditMode(!editMode)}
          className={`
            px-4 py-2 rounded-full text-sm font-medium transition-all
            ${editMode 
              ? 'bg-rose-500 text-white shadow-lg' 
              : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 shadow-md hover:bg-rose-50 dark:hover:bg-zinc-700'
            }
          `}
        >
          {editMode ? '✓ Done' : '✏️ Edit Profiles'}
        </button>
      </div>

      {/* Logo */}
      <div className="mb-8">
        <div className="w-24 h-24 rounded-full bg-white dark:bg-zinc-800 shadow-xl shadow-rose-500/20 flex items-center justify-center overflow-hidden border-4 border-white dark:border-zinc-700">
          <span className="text-4xl">📚</span>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {editMode ? 'Manage Profile Pictures' : 'Welcome to MCQ Test'}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8 text-center max-w-md">
        {editMode ? 'Click a profile to change its picture' : 'Select your profile to continue'}
      </p>

      {/* Profile Grid */}
      <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-md w-full">
        {profiles.map((profile) => {
          const avatarSrc = getAvatar(profile)
          const hasCustomAvatar = !!avatarSrc
          
          return (
            <button
              key={profile.id}
              onClick={() => handleProfileSelect(profile.id)}
              className={`
                group relative flex flex-col items-center p-6 rounded-2xl transition-all duration-300
                ${selectedProfile === profile.id && !editMode
                  ? 'bg-rose-500 text-white scale-95' 
                  : 'bg-white dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-zinc-700 hover:scale-105'
                }
                shadow-lg hover:shadow-xl
              `}
            >
              {/* Avatar */}
              <div className={`
                relative w-20 h-20 rounded-full mb-3 overflow-hidden border-4 transition-all
                ${selectedProfile === profile.id && !editMode
                  ? 'border-white' 
                  : 'border-rose-100 dark:border-zinc-700 group-hover:border-rose-300'
                }
              `}>
                {avatarSrc ? (
                  <img 
                    src={avatarSrc} 
                    alt={profile.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        parent.innerHTML = `<div class="w-full h-full flex items-center justify-center ${avatarColors[profile.id] || 'bg-rose-200 dark:bg-rose-800 text-rose-600 dark:text-rose-300'} text-2xl font-bold">${profile.name[0]}</div>`
                      }
                    }}
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${avatarColors[profile.id] || 'bg-rose-200 dark:bg-rose-800 text-rose-600 dark:text-rose-300'} text-2xl font-bold`}>
                    {profile.name[0]}
                  </div>
                )}
                
                {/* Edit overlay */}
                {editMode && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-2xl">📷</span>
                  </div>
                )}
                
                {/* Clear button in edit mode */}
                {editMode && hasCustomAvatar && (
                  <button
                    onClick={(e) => clearAvatar(profile.id, e)}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-md hover:bg-red-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Name */}
              <span className={`
                font-semibold text-sm md:text-base
                ${selectedProfile === profile.id && !editMode
                  ? 'text-white' 
                  : 'text-gray-700 dark:text-gray-200'
                }
              `}>
                {profile.name}
              </span>

              {/* Role Badge */}
              <span className={`
                text-xs px-2 py-0.5 rounded-full mt-1
                ${selectedProfile === profile.id && !editMode
                  ? 'bg-white/20 text-white' 
                  : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                }
              `}>
                {profile.role === 'admin' ? 'Admin' : 'Student'}
              </span>

              {/* Selection Indicator */}
              {selectedProfile === profile.id && !editMode && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Hidden file input for avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Footer */}
      <p className="mt-8 text-xs text-gray-400 dark:text-zinc-500">
        {editMode 
          ? 'Tap a profile to upload a new picture • Tap ✕ to remove' 
          : 'Select a profile to start your MCQ test'
        }
      </p>
    </div>
  )
}
