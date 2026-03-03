import { useState, useEffect } from 'react'
import { 
  Calendar, Plus, Clock, Trash2, Edit2, Save, X, 
  ChevronDown, Play, ArrowRight
} from 'lucide-react'
import { ClassSchedule, Teacher, DayOfWeek } from '../../types'
import { 
  addSchedule, updateSchedule, 
  deleteSchedule, getRunningClass, 
  getNextClass, getTeachers, getTeacherById, getScheduleForTeacher,
  getPreference, setPreference
} from '../../utils/routineStorage'

import Avatar from '../ui/Avatar'

const DAYS: DayOfWeek[] = ['Everyday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const CLASSES: string[] = ['Play 1', 'Play 2', 'Play', 'Nursery 1', 'Nursery 2', 'Nursery', 'KG 1', 'KG 2', 'KG', 'Grade 1', 'Grade 2']

export default function ClassRoutine() {
  const [schedule, setSchedule] = useState<ClassSchedule[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [runningClass, setRunningClass] = useState<{ schedule: ClassSchedule; teacher: Teacher | null } | null>(null)
  const [nextClass, setNextClass] = useState<{ schedule: ClassSchedule; teacher: Teacher | null; minutesUntil: number } | null>(null)
  const [currentTime, setCurrentTime] = useState<string>('')
  const [formData, setFormData] = useState({
    className: getPreference('lastClass', 'Play 1') as string,
    subject: '',
    startTime: getPreference('lastStartTime', '09:00'),
    endTime: getPreference('lastEndTime', '10:00'),
    day: getPreference('lastDay', 'Saturday') as DayOfWeek,
    teacherId: '' as string | null,
    shadowTeacherId: '' as string | null
  })
  useEffect(() => {
    loadData()
    // Initialize current time immediately
    setCurrentTime(getCurrentTime())
    
    let timeInterval: NodeJS.Timeout
    let interval: NodeJS.Timeout
    
    // Update current time every second for real-time clock display
    timeInterval = setInterval(() => {
      setCurrentTime(getCurrentTime())
    }, 1000)
    
     // Refresh running class data every second for real-time updates
     interval = setInterval(() => {
       refreshRunningClass()
     }, 1000)
    
    // Listen for add-routine event from main nav
    const handleAddRoutine = () => {
      setShowForm(true)
      setEditingId(null)
      setFormData({
        className: getPreference('lastClass', 'Play 1'),
        subject: '',
        startTime: getPreference('lastStartTime', '09:00'),
        endTime: getPreference('lastEndTime', '10:00'),
        day: getPreference('lastDay', 'Saturday'),
        teacherId: null,
        shadowTeacherId: null
      })
    }
    
    window.addEventListener('add-routine', handleAddRoutine)
    return () => {
      clearInterval(interval)
      clearInterval(timeInterval)
      window.removeEventListener('add-routine', handleAddRoutine)
    }
  }, [])

  useEffect(() => {
    loadSchedule()
  }, [selectedTeacher])

  const loadData = () => {
    setTeachers(getTeachers())
    loadSchedule()
    refreshRunningClass()
  }

  const loadSchedule = () => {
    setSchedule(getScheduleForTeacher(selectedTeacher))
  }

  const refreshRunningClass = () => {
    setRunningClass(getRunningClass())
    setNextClass(getNextClass())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const data = {
      ...formData,
      teacherId: formData.teacherId || null,
      shadowTeacherId: formData.shadowTeacherId || null
    }
    
    // Save last selected values
    setPreference('lastClass', data.className)
    setPreference('lastDay', data.day)
    setPreference('lastStartTime', data.startTime)
    setPreference('lastEndTime', data.endTime)
    
    if (editingId) {
      updateSchedule(editingId, data)
    } else {
      addSchedule(data)
    }
    
    resetForm()
    loadData()
  }

  const resetForm = () => {
    setFormData({
      className: 'Play 1',
      subject: '',
      startTime: '09:00',
      endTime: '10:00',
      day: 'Saturday',
      teacherId: null,
      shadowTeacherId: null
    })
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (item: ClassSchedule) => {
    setFormData({
      className: item.className || 'Play 1',
      subject: item.subject,
      startTime: item.startTime,
      endTime: item.endTime,
      day: item.day,
      teacherId: item.teacherId || '',
      shadowTeacherId: item.shadowTeacherId || ''
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this class?')) {
      deleteSchedule(id)
      loadData()
    }
  }

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  // Helper to convert 24h time string to 12h format
  const formatTo12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-20">
      {/* Running Class Banner */}
      <div className={`p-4 pt-8 text-white transition-all duration-500 ${runningClass ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 'bg-gradient-to-r from-gray-400 to-gray-500 dark:from-zinc-700 dark:to-zinc-600'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${runningClass ? 'bg-white/20 animate-pulse' : 'bg-white/10'}`}>
              <Play size={16} fill="currentColor" />
            </div>
            <span className="font-bold text-sm">{runningClass ? 'NOW RUNNING' : 'NO ACTIVE CLASS'}</span>
          </div>
          <span className="text-xs font-medium opacity-80">{currentTime || getCurrentTime()}</span>
        </div>
        
        {runningClass ? (
          <div className="flex items-center gap-4">
            <Avatar 
              name={runningClass.teacher?.name || ''} 
              photo={runningClass.teacher?.photo} 
              size="lg"
              className="ring-2 ring-white/30"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg leading-tight">{runningClass.schedule.subject}</h3>
              <p className="text-sm opacity-90 mt-1">
                {runningClass.teacher ? runningClass.teacher.name : 'No teacher assigned'}
              </p>
              <p className="text-xs opacity-75 mt-0.5">
                {formatTo12Hour(runningClass.schedule.startTime)} - {formatTo12Hour(runningClass.schedule.endTime)}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="font-medium">No class running right now</p>
            {nextClass && (
              <p className="text-sm opacity-80 mt-1">
                Next: {nextClass.schedule.subject} in {nextClass.minutesUntil} minutes
              </p>
            )}
          </div>
        )}
      </div>

      {/* Next Class */}
      {nextClass && !runningClass && (
        <div className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <ArrowRight className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium uppercase">Next Class</p>
              <p className="font-bold dark:text-white">{nextClass.schedule.subject}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-amber-500">{nextClass.minutesUntil} min</p>
              <p className="text-xs text-gray-400">{formatTo12Hour(nextClass.schedule.startTime)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Day Selector */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-white/10 px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="font-bold dark:text-white text-sm">Class Schedule</span>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-rose-500 appearance-none cursor-pointer shadow-sm transition-colors"
            >
              <option value="all" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white py-2">All Teachers</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id} className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white py-2">{teacher.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none dark:text-zinc-500" />
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-gray-400 dark:text-zinc-500">
            Routine for Saturday - Thursday
          </span>
        </div>
      </div>

      {/* Schedule List */}
      <div className="p-4 space-y-3">
        {schedule.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-zinc-500 font-medium">
              No classes scheduled
            </p>
            <p className="text-gray-300 dark:text-zinc-600 text-sm mt-1">
              Add classes to build your routine
            </p>
          </div>
        ) : (
          schedule.map(item => {
            const teacher = item.teacherId ? getTeacherById(item.teacherId) : null
            return (
              <div 
                key={item.id}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-gray-100 dark:border-white/5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  {/* Time */}
                  <div className="flex flex-col items-center justify-center w-16 bg-gray-50 dark:bg-zinc-800 rounded-xl py-2">
                    <span className="text-xs font-bold text-gray-400">{formatTo12Hour(item.startTime)}</span>
                    <div className="w-0.5 h-2 bg-gray-200 dark:bg-zinc-700 my-1"></div>
                    <span className="text-xs font-bold text-gray-400">{formatTo12Hour(item.endTime)}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
                        {item.className || 'Play 1'}
                      </span>
                      <h3 className="font-bold dark:text-white text-base">{item.subject}</h3>
                    </div>
                    
                    {/* Teachers Row */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {/* Main Teacher */}
                      {teacher && (
                        <div className="flex items-center gap-1.5">
                          <Avatar 
                            name={teacher.name} 
                            photo={teacher.photo} 
                            size="sm"
                            className="ring-2 ring-rose-200 dark:ring-rose-800"
                          />
                          <span className="text-xs font-medium text-gray-600 dark:text-zinc-300">{teacher.name}</span>
                        </div>
                      )}
                      
                      {/* Shadow Teacher */}
                      {item.shadowTeacherId && (() => {
                        const shadowTeacher = getTeacherById(item.shadowTeacherId)
                        return shadowTeacher ? (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 rounded-full">
                            <Avatar 
                              name={shadowTeacher.name} 
                              photo={shadowTeacher.photo} 
                              size="sm"
                            />
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Shadow</span>
                            <span className="text-xs text-amber-700 dark:text-amber-300">{shadowTeacher.name}</span>
                          </div>
                        ) : null
                      })()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/10">
              <h2 className="text-lg font-bold dark:text-white">
                {editingId ? 'Edit Class' : 'Add New Class'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Class */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                  Class
                </label>
                <div className="relative">
                  <select
                    value={formData.className}
                    onChange={(e) => setFormData(prev => ({ ...prev, className: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-white to-gray-50 dark:from-zinc-800 dark:to-zinc-700 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-rose-500 appearance-none cursor-pointer shadow-md transition-all hover:border-rose-300 dark:hover:border-rose-500"
                  >
                    {CLASSES.map(cls => (
                      <option key={cls} value={cls} className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white py-3">{cls}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none dark:text-zinc-500" />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 border-0 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-rose-500"
                  placeholder="Enter subject name"
                />
              </div>

              {/* Day */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                  Day
                </label>
                <div className="relative">
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData(prev => ({ ...prev, day: e.target.value as DayOfWeek }))}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-white to-gray-50 dark:from-zinc-800 dark:to-zinc-700 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-rose-500 appearance-none cursor-pointer shadow-md transition-all hover:border-rose-300 dark:hover:border-rose-500"
                  >
                    {DAYS.map(day => (
                      <option key={day} value={day} className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white py-3">{day}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none dark:text-zinc-500" />
                </div>
              </div>

              {/* Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 border-0 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 border-0 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Teacher */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                  Teacher (Optional)
                </label>
                <div className="relative">
                  <select
                    value={formData.teacherId || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, teacherId: e.target.value || null }))}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-white to-gray-50 dark:from-zinc-800 dark:to-zinc-700 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-rose-500 appearance-none cursor-pointer shadow-md transition-all hover:border-rose-300 dark:hover:border-rose-500"
                  >
                    <option value="" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white py-3">Select a teacher</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id} className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white py-3">{teacher.name} - {(teacher.subjects || []).join(', ')}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none dark:text-zinc-500" />
                </div>
              </div>

              {/* Shadow Teacher */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                  Shadow Teacher (Optional)
                </label>
                <div className="relative">
                  <select
                    value={formData.shadowTeacherId || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, shadowTeacherId: e.target.value || null }))}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-white to-gray-50 dark:from-zinc-800 dark:to-zinc-700 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-rose-500 appearance-none cursor-pointer shadow-md transition-all hover:border-rose-300 dark:hover:border-rose-500"
                  >
                    <option value="" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white py-3">Select a shadow teacher</option>
                    {teachers.filter(t => t.id !== formData.teacherId).map(teacher => (
                      <option key={teacher.id} value={teacher.id} className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white py-3">{teacher.name} - {(teacher.subjects || []).join(', ')}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none dark:text-zinc-500" />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                {editingId ? (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Add Class
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
