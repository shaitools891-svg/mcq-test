/**
 * MCQ Test App
 * Privacy-focused MCQ testing application
 */

import { useState, useEffect, Suspense } from 'react'
import { 
  Smartphone as SmartphoneIcon, Monitor as MonitorIcon
} from 'lucide-react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Theme, ViewMode, Tool } from './types'
import Layout from './components/Layout'
import { ViewModeProvider } from './utils/viewModeContext'
import { Capacitor } from '@capacitor/core'

import ProfileSelection from './components/ProfileSelection'
import Dashboard, { DashboardWrapper } from './components/Dashboard'
import MCQTest from './components/MCQTest'
import ScrollToTop from './components/ScrollToTop'

const tools: Tool[] = []

export const activeTools = tools

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return Capacitor.isNativePlatform() ? 'android' : 'web'
  })
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme
      if (savedTheme) return savedTheme
    }
    return 'system'
  })

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  useEffect(() => {
    const root = window.document.documentElement
    
    const applyTheme = (t: Theme) => {
      let resolvedTheme = t
      if (t === 'system') {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      
      if (resolvedTheme === 'dark') {
        root.classList.add('dark')
        root.style.colorScheme = 'dark'
      } else {
        root.classList.remove('dark')
        root.style.colorScheme = 'light'
      }
    }

    applyTheme(theme)
    localStorage.setItem('theme', theme)

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = () => applyTheme('system')
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    }
  }, [theme])

  const LoadingSpinner = () => (
    <div className="h-full w-full flex items-center justify-center bg-[#FAFAFA] dark:bg-black min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  const handleGlobalDrop = (_files: FileList) => {
    // File drop handling - not needed for MCQ test only app
  }

  return (
    <HashRouter>
      <ScrollToTop />
      <ViewModeProvider viewMode={viewMode} setViewMode={setViewMode}>
          <Layout theme={theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme} toggleTheme={toggleTheme} tools={activeTools} onFileDrop={handleGlobalDrop} viewMode={viewMode}>
            <Toaster 
              position="top-center" 
              expand={true} 
              richColors 
              duration={2000}
              toastOptions={{
                className: 'dark:bg-zinc-900 dark:text-white dark:border-white/10 mt-12',
                style: { zIndex: 1000 }
              }}
            />
            
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<ProfileSelection />} />
                <Route path="/mcq-test" element={<MCQTest />} />
                <Route path="/dashboard" element={<DashboardWrapper />} />
              </Routes>
            </Suspense>

            {/* Chameleon Toggle (Dev Only) */}
            {import.meta.env.DEV && (
              <div className="fixed bottom-24 right-6 z-[100] flex flex-col gap-2">
                <button
                  onClick={() => setViewMode(prev => prev === 'web' ? 'android' : 'web')}
                  className="bg-gray-900 dark:bg-zinc-800 text-white p-4 rounded-3xl shadow-2xl hover:bg-rose-500 transition-all duration-300 flex items-center gap-3 border border-white/10 group active:scale-95"
                  title="Toggle Chameleon Mode"
                >
                  {viewMode === 'web' ? <SmartphoneIcon size={20} /> : <MonitorIcon size={20} />}
                  <span className="text-xs font-black uppercase tracking-tighter">{viewMode}</span>
                </button>
              </div>
            )}
          </Layout>
      </ViewModeProvider>
    </HashRouter>
  )
}

export default App
