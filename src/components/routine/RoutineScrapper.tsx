import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import StudentDirectory from './StudentDirectory'
import TeacherDatabase from './TeacherDatabase'
import ClassRoutine from './ClassRoutine'

type Tab = 'routine' | 'students' | 'teachers'

export default function RoutineScrapper() {
  const location = useLocation()
  
  // Sync tab with URL path
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (location.pathname === '/students') return 'students'
    if (location.pathname === '/teachers') return 'teachers'
    return 'routine'
  })

  // When URL changes externally, sync the tab
  useEffect(() => {
    if (location.pathname === '/students') setActiveTab('students')
    else if (location.pathname === '/teachers') setActiveTab('teachers')
    else setActiveTab('routine')
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pt-safe">
      {/* Content */}
      <div className="pb-20">
        {activeTab === 'routine' && <ClassRoutine />}
        {activeTab === 'students' && <StudentDirectory />}
        {activeTab === 'teachers' && <TeacherDatabase />}
      </div>
    </div>
  )
}
