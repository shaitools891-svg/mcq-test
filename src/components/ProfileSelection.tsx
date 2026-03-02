import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Profile {
  id: string
  name: string
  role: 'student' | 'admin'
  avatar: string
}

const profiles: Profile[] = [
  {
    id: 'aliza',
    name: 'Aliza',
    role: 'student',
    avatar: '/aliza.jpg'
  },
  {
    id: 'eshita',
    name: 'Eshita',
    role: 'student',
    avatar: '/eshita.jpg'
  },
  {
    id: 'shapla',
    name: 'Shapla',
    role: 'student',
    avatar: '' // Placeholder - file not found
  },
  {
    id: 'shakib',
    name: 'Shakib',
    role: 'admin',
    avatar: '/shakib.jpg'
  }
]

export default function ProfileSelection() {
  const navigate = useNavigate()
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)

  const handleProfileSelect = (profileId: string) => {
    setSelectedProfile(profileId)
    // Save selected profile to localStorage
    localStorage.setItem('selectedProfile', profileId)
    
    // Navigate to Dashboard after selection
    setTimeout(() => {
      navigate('/dashboard')
    }, 300)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-rose-100 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-24 h-24 rounded-full bg-white dark:bg-zinc-800 shadow-xl shadow-rose-500/20 flex items-center justify-center overflow-hidden border-4 border-white dark:border-zinc-700">
          <img 
            src="/matherror.jpg" 
            alt="Logo" 
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              target.parentElement!.innerHTML = '<span class="text-3xl">📚</span>'
            }}
          />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Welcome to MCQ Test
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8 text-center max-w-md">
        Select your profile to continue
      </p>

      {/* Profile Grid */}
      <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-md w-full">
        {profiles.map((profile) => (
          <button
            key={profile.id}
            onClick={() => handleProfileSelect(profile.id)}
            className={`
              group relative flex flex-col items-center p-6 rounded-2xl transition-all duration-300
              ${selectedProfile === profile.id 
                ? 'bg-rose-500 text-white scale-95' 
                : 'bg-white dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-zinc-700 hover:scale-105'
              }
              shadow-lg hover:shadow-xl
            `}
          >
            {/* Avatar */}
            <div className={`
              w-20 h-20 rounded-full mb-3 overflow-hidden border-4 transition-all
              ${selectedProfile === profile.id 
                ? 'border-white' 
                : 'border-rose-100 dark:border-zinc-700 group-hover:border-rose-300'
              }
            `}>
              {profile.avatar ? (
                <img 
                  src={profile.avatar} 
                  alt={profile.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-rose-200 dark:bg-rose-800 text-rose-600 dark:text-rose-300 text-2xl">${profile.name[0]}</div>`
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-rose-200 dark:bg-rose-800 text-rose-600 dark:text-rose-300 text-2xl font-bold">
                  {profile.name[0]}
                </div>
              )}
            </div>

            {/* Name */}
            <span className={`
              font-semibold text-sm md:text-base
              ${selectedProfile === profile.id 
                ? 'text-white' 
                : 'text-gray-700 dark:text-gray-200'
              }
            `}>
              {profile.name}
            </span>

            {/* Role Badge */}
            <span className={`
              text-xs px-2 py-0.5 rounded-full mt-1
              ${selectedProfile === profile.id 
                ? 'bg-white/20 text-white' 
                : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
              }
            `}>
              {profile.role === 'admin' ? 'Admin' : 'Student'}
            </span>

            {/* Selection Indicator */}
            {selectedProfile === profile.id && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-gray-400 dark:text-zinc-500">
        Select a profile to start your MCQ test
      </p>
    </div>
  )
}
