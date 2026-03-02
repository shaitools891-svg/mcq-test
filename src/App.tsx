/**
 * PaperKnife - The Swiss Army Knife for PDFs
 * Copyright (C) 2026 potatameister
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
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
import { clearActivity, updateLastSeen, getLastSeen } from './utils/recentActivity'
import { Capacitor } from '@capacitor/core'
import { syncFromCloud, subscribeToCloudChanges, saveDataSnapshot } from './utils/routineStorage'
import { importBackupFromUri } from './utils/backupUtils'
import ScrollToTop from './components/ScrollToTop'
import { checkForRunningClassOnStartup, showRunningClassNotification, temporarilyDisableNotificationSound } from './utils/notificationUtils'

// Critical Views - No lazy loading to prevent dynamic import errors on Android
import AndroidToolsView from './components/AndroidToolsView'
import AndroidHistoryView from './components/AndroidHistoryView'
import Thanks from './components/Thanks'
import PrivacyPolicy from './components/PrivacyPolicy'
import SettingsView from './components/Settings'

import RoutineScrapper from './components/routine/RoutineScrapper'
import ClassRoutine from './components/routine/ClassRoutine'
import StudentDirectory from './components/routine/StudentDirectory'
import ProfileSelection from './components/ProfileSelection'
import Dashboard, { DashboardWrapper } from './components/Dashboard'
import TeacherDatabase from './components/routine/TeacherDatabase'
import MCQTest from './components/MCQTest'

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

  // Improved Auto-Wipe Logic
  useEffect(() => {
    const isAutoWipeEnabled = localStorage.getItem('autoWipe') === 'true'
    const timerMinutes = parseInt(localStorage.getItem('autoWipeTimer') || '15')
    const lastSeen = getLastSeen()
    const now = Date.now()

    if (isAutoWipeEnabled) {
      const elapsedMinutes = (now - lastSeen) / (1000 * 60)
      if (timerMinutes === 0 || (lastSeen > 0 && elapsedMinutes >= timerMinutes)) {
        clearActivity().then(() => {
          console.log(`Auto-Wipe triggered (${elapsedMinutes.toFixed(1)}m inactivity).`)
        })
      }
    }

    updateLastSeen()
    const interval = setInterval(updateLastSeen, 30000)
    return () => clearInterval(interval)
  }, [])

  // Handle incoming files (PDF/JSON shared to the app)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const handleFileIntent = async (event: Event) => {
      const customEvent = event as CustomEvent<{ uri: string; mimeType: string }>
      const { uri, mimeType } = customEvent.detail
      
      console.log('Received file intent:', mimeType, uri)
      
      if (mimeType === 'application/json') {
        const result = await importBackupFromUri(uri)
        if (result.success) {
          // Show success message - the user will need to refresh
          alert('Backup imported successfully! Please refresh the app.')
          window.location.reload()
        } else {
          alert('Import failed: ' + result.error)
        }
      }
    }

    window.addEventListener('fileIntent', handleFileIntent)
    
    return () => {
      window.removeEventListener('fileIntent', handleFileIntent)
    }
  }, [])

  // Cloud Sync - Initialize on app start
  useEffect(() => {
    // Try to sync from cloud on startup
    syncFromCloud().then(() => {
      console.log('Initial cloud sync completed')
      // Save snapshot after sync for change tracking
      saveDataSnapshot()
    })
    
    // Subscribe to real-time cloud changes
    const unsubscribe = subscribeToCloudChanges(() => {
      console.log('Cloud data changed, re-syncing...')
    })
    
    return () => {
      unsubscribe()
    }
  }, [])

  // Check for running class on app startup and poll for changes
  useEffect(() => {
    // Initial check
    checkForRunningClassOnStartup().then((runningClass) => {
      if (runningClass) {
        console.log(`Found running class: ${runningClass.schedule.className} - ${runningClass.schedule.subject}`)
      }
    })
    
    // Poll for running class changes every 15 seconds to detect class changes more quickly
    const pollingInterval = setInterval(() => {
      showRunningClassNotification()
    }, 15000) // 15 seconds
    
    // Volume button event listener to stop notification sound
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if volume button control is enabled
      const volumeControlEnabled = JSON.parse(localStorage.getItem('volumeButtonControl') || 'true');
      
      if (volumeControlEnabled && (event.code === 'VolumeUp' || event.code === 'VolumeDown' || event.code === 'AudioVolumeUp' || event.code === 'AudioVolumeDown')) {
        console.log('[Notifications] Volume button pressed, stopping notification sound');
        temporarilyDisableNotificationSound();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      clearInterval(pollingInterval);
      window.removeEventListener('keydown', handleKeyDown);
    }
  }, [])

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
    // File drop handling - PDF tools removed
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
                <Route path="/students" element={<StudentDirectory />} />
                <Route path="/teachers" element={<TeacherDatabase />} />
                <Route path="/android-tools" element={<AndroidToolsView tools={activeTools} />} />
                <Route path="/android-history" element={<AndroidHistoryView />} />
                <Route path="/routine-scrapper" element={<RoutineScrapper />} />
                <Route path="/mcq-test" element={<MCQTest />} />
                <Route path="/dashboard" element={<DashboardWrapper />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/settings" element={<SettingsView theme={theme} setTheme={setTheme} />} />
                <Route path="/thanks" element={<Thanks />} />
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