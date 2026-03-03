/**
 * MCQ Test Platform
 * A web-based MCQ testing application for students
 */

import { Suspense } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import ProfileSelection from './components/ProfileSelection'
import MCQTest from './components/MCQTest'

function App() {
  const LoadingSpinner = () => (
    <div className="h-full w-full flex items-center justify-center bg-[#FAFAFA] dark:bg-black min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <HashRouter>
      <Layout>
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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/mcq-test" element={<MCQTest />} />
          </Routes>
        </Suspense>
      </Layout>
    </HashRouter>
  )
}

export default App
