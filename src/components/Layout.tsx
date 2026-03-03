import React from 'react'
import BottomNav from './BottomNav'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  // Show bottom nav on all pages except profile
  const shouldShowNav = true

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black text-gray-900 dark:text-white transition-colors">
      {/* Main Content */}
      <main className={`${shouldShowNav ? 'pb-20' : ''} min-h-screen`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {shouldShowNav && <BottomNav />}
    </div>
  )
}
