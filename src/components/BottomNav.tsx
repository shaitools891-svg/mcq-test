import { Home, HelpCircle } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

interface BottomNavProps {
  hapticNavigation?: () => void
}

export default function BottomNav({ hapticNavigation = () => {} }: BottomNavProps) {
  const navigate = useNavigate()
  const location = useLocation()
  
  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-100 dark:border-zinc-800 flex items-end justify-between px-6 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 z-[100] shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      <button 
        onClick={() => { hapticNavigation(); navigate('/dashboard'); }}
        className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${isActive('/dashboard') ? 'text-rose-500' : 'text-gray-400 dark:text-zinc-600'}`}
      >
        <Home size={24} strokeWidth={isActive('/dashboard') ? 2.5 : 2} />
        <span className="text-[10px] font-bold">Home</span>
      </button>

      <button
        onClick={() => { hapticNavigation(); navigate('/mcq-test'); }}
        className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${isActive('/mcq-test') ? 'text-rose-500' : 'text-gray-400 dark:text-zinc-600'}`}
      >
        <HelpCircle size={24} strokeWidth={isActive('/mcq-test') ? 2.5 : 2} />
        <span className="text-[10px] font-bold">MCQ Test</span>
      </button>
    </nav>
  )
}
