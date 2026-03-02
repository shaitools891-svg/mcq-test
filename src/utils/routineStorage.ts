import { 
  Student, Teacher, ClassSchedule, AppData, 
  TrackRecord, TrackCategory, 
  AttendanceRecord, AttendanceStatus, 
  AttendanceAction, AttendanceStats,
  LessonPlan, ImportRecord
} from '../types'
import { syncSave, syncLoad, SYNC_KEYS, subscribeToChanges } from './supabaseClient'

export const STORAGE_KEY = 'routine_scrapper_data'

const defaultData: AppData = {
  students: [],
  teachers: [],
  schedule: [],
  trackRecords: [],
  attendanceRecords: [],
  attendanceActions: [],
  lessonPlans: [],
  importHistory: []
}

// Add import record to history
export function addImportRecord(studentIds: string[], source: 'pdf' | 'excel' | 'manual' = 'pdf'): void {
  const appData = loadAppData()
  appData.importHistory.unshift({
    id: generateId(),
    studentIds,
    timestamp: Date.now(),
    source
  })
  saveAppData(appData)
}

// Get last import record for undo
export function getLastImportRecord(): ImportRecord | null {
  const appData = loadAppData()
  return appData.importHistory.length > 0 ? appData.importHistory[0] : null
}

// Remove import record from history
export function removeImportRecord(importId: string): void {
  const appData = loadAppData()
  appData.importHistory = appData.importHistory.filter(record => record.id !== importId)
  saveAppData(appData)
}

// Remove students from an import record
export function removeStudentsFromImport(importId: string): number {
  const appData = loadAppData()
  const importRecord = appData.importHistory.find(record => record.id === importId)
  if (!importRecord) {
    return 0
  }
  
  // Remove students from the data
  const initialCount = appData.students.length
  appData.students = appData.students.filter(student => !importRecord.studentIds.includes(student.id))
  
  // Remove the import record from history
  appData.importHistory = appData.importHistory.filter(record => record.id !== importId)
  
  saveAppData(appData)
  return initialCount - appData.students.length
}

// Load data from localStorage
export function loadAppData(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Merge with defaultData to ensure all properties are present
      return {
        ...defaultData,
        ...parsed,
        students: parsed.students || defaultData.students,
        teachers: parsed.teachers || defaultData.teachers,
        schedule: parsed.schedule || defaultData.schedule,
        trackRecords: parsed.trackRecords || defaultData.trackRecords,
        attendanceRecords: parsed.attendanceRecords || defaultData.attendanceRecords,
        attendanceActions: parsed.attendanceActions || defaultData.attendanceActions,
        lessonPlans: parsed.lessonPlans || defaultData.lessonPlans
      }
    }
  } catch (error) {
    console.error('Failed to load app data:', error)
  }
  return defaultData
}

// Save data to localStorage and sync to cloud
let syncEnabled = true

// Check if admin mode is enabled
export function isAdminMode(): boolean {
  return localStorage.getItem('adminMode') === 'true'
}

export function setAdminMode(enabled: boolean): void {
  localStorage.setItem('adminMode', enabled ? 'true' : 'false')
}

// Preferences functions
export function getPreference(key: string, defaultValue: any): any {
  try {
    const value = localStorage.getItem(key)
    if (value !== null) {
      return JSON.parse(value)
    }
  } catch (error) {
    console.error('Error getting preference:', error)
  }
  return defaultValue
}

export function setPreference(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Error setting preference:', error)
  }
}

// --- Change Tracking for Cloud Sync ---

const LAST_SYNC_KEY = 'last_cloud_sync'

export interface ChangeLogEntry {
  type: 'added' | 'modified' | 'deleted'
  category: 'students' | 'teachers' | 'schedule'
  id: string
  name: string
  timestamp: number
}

export interface ChangeLog {
  entries: ChangeLogEntry[]
  summary: {
    students: { added: number; modified: number; deleted: number }
    teachers: { added: number; modified: number; deleted: number }
    schedule: { added: number; modified: number; deleted: number }
  }
}

// Get last sync timestamp
export function getLastSyncTime(): number {
  try {
    const value = localStorage.getItem(LAST_SYNC_KEY)
    return value ? parseInt(value, 10) : 0
  } catch {
    return 0
  }
}

// Set last sync timestamp
export function setLastSyncTime(timestamp: number): void {
  try {
    localStorage.setItem(LAST_SYNC_KEY, timestamp.toString())
  } catch (error) {
    console.error('Error setting last sync time:', error)
  }
}

// Compare two arrays to find changes since last sync
export function getChangeLog(): ChangeLog {
  const lastSync = getLastSyncTime()
  const currentData = loadAppData()
  
  // Load previous data from cloud to compare
  // We'll store snapshots locally for comparison
  const snapshotKey = 'data_snapshot'
  let previousData: AppData | null = null
  
  try {
    const snapshot = localStorage.getItem(snapshotKey)
    if (snapshot) {
      previousData = JSON.parse(snapshot)
    }
  } catch {
    // No previous snapshot
  }
  
  const entries: ChangeLogEntry[] = []
  
  // If no previous data, all current data is new
  if (!previousData || lastSync === 0) {
    // All students are new
    currentData.students.forEach(s => {
      entries.push({
        type: 'added',
        category: 'students',
        id: s.id,
        name: s.fullName,
        timestamp: s.createdAt || Date.now()
      })
    })
    // All teachers are new
    currentData.teachers.forEach(t => {
      entries.push({
        type: 'added',
        category: 'teachers',
        id: t.id,
        name: t.name,
        timestamp: t.createdAt || Date.now()
      })
    })
    // All schedule entries are new
    currentData.schedule.forEach(s => {
      entries.push({
        type: 'added',
        category: 'schedule',
        id: s.id,
        name: `${s.subject} (${s.day})`,
        timestamp: s.createdAt || Date.now()
      })
    })
  } else {
    // Compare with previous snapshot
    const previousStudents = new Map(previousData.students.map(s => [s.id, s]))
    const previousTeachers = new Map(previousData.teachers.map(t => [t.id, t]))
    const previousSchedule = new Map(previousData.schedule.map(s => [s.id, s]))
    
    const currentStudents = new Map(currentData.students.map(s => [s.id, s]))
    const currentTeachers = new Map(currentData.teachers.map(t => [t.id, t]))
    const currentSchedule = new Map(currentData.schedule.map(s => [s.id, s]))
    
    // Find added and modified students
    currentData.students.forEach(s => {
      const prev = previousStudents.get(s.id)
      if (!prev) {
        entries.push({
          type: 'added',
          category: 'students',
          id: s.id,
          name: s.fullName,
          timestamp: s.createdAt || Date.now()
        })
      } else if (JSON.stringify(prev) !== JSON.stringify(s)) {
        entries.push({
          type: 'modified',
          category: 'students',
          id: s.id,
          name: s.fullName,
          timestamp: s.createdAt || Date.now()
        })
      }
    })
    
    // Find deleted students
    previousData.students.forEach(s => {
      if (!currentStudents.has(s.id)) {
        entries.push({
          type: 'deleted',
          category: 'students',
          id: s.id,
          name: s.fullName,
          timestamp: Date.now()
        })
      }
    })
    
    // Find added and modified teachers
    currentData.teachers.forEach(t => {
      const prev = previousTeachers.get(t.id)
      if (!prev) {
        entries.push({
          type: 'added',
          category: 'teachers',
          id: t.id,
          name: t.name,
          timestamp: t.createdAt || Date.now()
        })
      } else if (JSON.stringify(prev) !== JSON.stringify(t)) {
        entries.push({
          type: 'modified',
          category: 'teachers',
          id: t.id,
          name: t.name,
          timestamp: t.createdAt || Date.now()
        })
      }
    })
    
    // Find deleted teachers
    previousData.teachers.forEach(t => {
      if (!currentTeachers.has(t.id)) {
        entries.push({
          type: 'deleted',
          category: 'teachers',
          id: t.id,
          name: t.name,
          timestamp: Date.now()
        })
      }
    })
    
    // Find added and modified schedule
    currentData.schedule.forEach(s => {
      const prev = previousSchedule.get(s.id)
      if (!prev) {
        entries.push({
          type: 'added',
          category: 'schedule',
          id: s.id,
          name: `${s.subject} (${s.day})`,
          timestamp: s.createdAt || Date.now()
        })
      } else if (JSON.stringify(prev) !== JSON.stringify(s)) {
        entries.push({
          type: 'modified',
          category: 'schedule',
          id: s.id,
          name: `${s.subject} (${s.day})`,
          timestamp: s.createdAt || Date.now()
        })
      }
    })
    
    // Find deleted schedule
    previousData.schedule.forEach(s => {
      if (!currentSchedule.has(s.id)) {
        entries.push({
          type: 'deleted',
          category: 'schedule',
          id: s.id,
          name: `${s.subject} (${s.day})`,
          timestamp: Date.now()
        })
      }
    })
  }
  
  // Calculate summary
  const summary = {
    students: { added: 0, modified: 0, deleted: 0 },
    teachers: { added: 0, modified: 0, deleted: 0 },
    schedule: { added: 0, modified: 0, deleted: 0 }
  }
  
  entries.forEach(entry => {
    summary[entry.category][entry.type]++
  })
  
  // Sort entries by timestamp (newest first)
  entries.sort((a, b) => b.timestamp - a.timestamp)
  
  return { entries, summary }
}

// Save current data snapshot for future comparison
export function saveDataSnapshot(): void {
  try {
    const data = loadAppData()
    localStorage.setItem('data_snapshot', JSON.stringify(data))
  } catch (error) {
    console.error('Error saving data snapshot:', error)
  }
}

export function saveAppData(data: AppData, syncToCloud = false): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    // Cloud sync disabled - only keeping MCQ results sync
    // The app is now MCQ-test focused only
  } catch (error) {
    console.error('Failed to save app data:', error)
  }
}

// Sync from cloud to local - disabled for MCQ test app
export async function syncFromCloud(): Promise<void> {
  // Cloud sync disabled - the app is now MCQ-test focused only
  // Supabase table 'app_data' no longer exists
  console.log('Cloud sync disabled - MCQ test only app')
}

// Subscribe to cloud changes - disabled for MCQ test app
export function subscribeToCloudChanges(_callback: () => void): () => void {
  // Cloud sync disabled - return no-op function
  console.log('Cloud subscription disabled - MCQ test only app')
  return () => {}
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

// Student operations
export function addStudent(student: Omit<Student, 'id' | 'createdAt'>): Student {
  const data = loadAppData()
  const newStudent: Student = {
    ...student,
    id: generateId(),
    createdAt: Date.now()
  }
  data.students.push(newStudent)
  saveAppData(data)
  return newStudent
}

export function updateStudent(id: string, updates: Partial<Student>): Student | null {
  const data = loadAppData()
  const index = data.students.findIndex(s => s.id === id)
  if (index === -1) return null
  
  data.students[index] = { ...data.students[index], ...updates }
  saveAppData(data)
  return data.students[index]
}

export function deleteStudent(id: string): boolean {
  const data = loadAppData()
  const index = data.students.findIndex(s => s.id === id)
  if (index === -1) return false
  
  data.students.splice(index, 1)
  saveAppData(data)
  return true
}

export function getStudents(): Student[] {
  const data = loadAppData()
  return data?.students || []
}

export function searchStudents(query: string, className?: string): Student[] {
  const data = loadAppData()
  const lowerQuery = query.toLowerCase()
  const results = data.students.filter(s => {
    const matchesQuery = s.fullName.toLowerCase().includes(lowerQuery) ||
      s.fatherName.toLowerCase().includes(lowerQuery)
    const matchesClass = !className || className === 'all' || s.className === className
    return matchesQuery && matchesClass
  })
  // Sort search results alphabetically by full name
  return results.sort((a, b) => a.fullName.localeCompare(b.fullName))
}

export function getStudentsByClass(className: string): Student[] {
  const data = loadAppData()
  if (className === 'all') return data.students
  return data.students.filter(s => s.className === className)
}

// Teacher operations
export function addTeacher(teacher: Omit<Teacher, 'id' | 'createdAt'>): Teacher {
  const data = loadAppData()
  const newTeacher: Teacher = {
    ...teacher,
    id: generateId(),
    createdAt: Date.now()
  }
  data.teachers.push(newTeacher)
  saveAppData(data)
  return newTeacher
}

export function updateTeacher(id: string, updates: Partial<Teacher>): Teacher | null {
  const data = loadAppData()
  const index = data.teachers.findIndex(t => t.id === id)
  if (index === -1) return null
  
  data.teachers[index] = { ...data.teachers[index], ...updates }
  saveAppData(data)
  return data.teachers[index]
}

export function deleteTeacher(id: string): boolean {
  const data = loadAppData()
  const index = data.teachers.findIndex(t => t.id === id)
  if (index === -1) return false
  
  data.teachers.splice(index, 1)
  // Also remove teacher from schedule
  data.schedule = data.schedule.map(s => 
    s.teacherId === id ? { ...s, teacherId: null } : s
  )
  saveAppData(data)
  return true
}

export function getTeachers(): Teacher[] {
  return loadAppData().teachers || []
}

export function getTeacherById(id: string): Teacher | null {
  const data = loadAppData()
  return data.teachers.find(t => t.id === id) || null
}

// Schedule operations
export function addSchedule(schedule: Omit<ClassSchedule, 'id' | 'createdAt'>): ClassSchedule {
  const data = loadAppData()
  const newSchedule: ClassSchedule = {
    ...schedule,
    id: generateId(),
    createdAt: Date.now()
  }
  data.schedule.push(newSchedule)
  saveAppData(data)
  return newSchedule
}

export function updateSchedule(id: string, updates: Partial<ClassSchedule>): ClassSchedule | null {
  const data = loadAppData()
  const index = data.schedule.findIndex(s => s.id === id)
  if (index === -1) return null
  
  data.schedule[index] = { ...data.schedule[index], ...updates }
  saveAppData(data)
  return data.schedule[index]
}

export function deleteSchedule(id: string): boolean {
  const data = loadAppData()
  const index = data.schedule.findIndex(s => s.id === id)
  if (index === -1) return false
  
  data.schedule.splice(index, 1)
  saveAppData(data)
  return true
}

export function getSchedule(): ClassSchedule[] {
  return loadAppData().schedule || []
}

// Day order for proper sorting (Sunday = 0)
const DAY_ORDER: Record<string, number> = {
  'Sunday': 0,
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6
}

// Helper to sort by day then by time
const sortByDayAndTime = (a: ClassSchedule, b: ClassSchedule): number => {
  const dayCompare = (DAY_ORDER[a.day] ?? 7) - (DAY_ORDER[b.day] ?? 7)
  if (dayCompare !== 0) return dayCompare
  return a.startTime.localeCompare(b.startTime)
}

// Get schedule for a specific day
export function getScheduleForDay(day: string): ClassSchedule[] {
  const data = loadAppData()
  return data.schedule
    .filter(s => s.day === day || s.day === 'Everyday')
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
}

// Get schedule for a specific teacher (all days Saturday-Thursday)
export function getScheduleForTeacher(teacherId: string | null): ClassSchedule[] {
  const data = loadAppData()
  // Weekend days to exclude (only Friday)
  const weekendDays = ['Friday']
  
  let filteredSchedule = data.schedule
    .filter(s => !weekendDays.includes(s.day))
    .sort(sortByDayAndTime)
  
  if (teacherId && teacherId !== 'all') {
    filteredSchedule = filteredSchedule.filter(s => s.teacherId === teacherId)
  }
  
  return filteredSchedule
}

// Get all schedule (excluding Friday)
export function getAllSchedule(): ClassSchedule[] {
  const data = loadAppData()
  const weekendDays = ['Friday']
  return data.schedule
    .filter(s => !weekendDays.includes(s.day))
    .sort(sortByDayAndTime)
}

// Get current running class
export function getRunningClass(): { schedule: ClassSchedule; teacher: Teacher | null } | null {
  const now = new Date()
  const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()]
  
  const data = loadAppData()
  const todayClasses = data.schedule
    .filter(s => s.day === currentDay || s.day === 'Everyday')
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
  
  for (const cls of todayClasses) {
    // Convert class times to Date objects for proper comparison
    const [startHours, startMinutes] = cls.startTime.split(':').map(Number)
    const [endHours, endMinutes] = cls.endTime.split(':').map(Number)
    
    const startTime = new Date()
    startTime.setHours(startHours, startMinutes, 0, 0)
    
    const endTime = new Date()
    endTime.setHours(endHours, endMinutes, 0, 0)
    
    if (now >= startTime && now <= endTime) {
      const teacher = cls.teacherId ? data.teachers.find(t => t.id === cls.teacherId) || null : null
      return { schedule: cls, teacher }
    }
  }
  
  return null
}

// Get next class
export function getNextClass(): { schedule: ClassSchedule; teacher: Teacher | null; minutesUntil: number } | null {
  const now = new Date()
  const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()]
  const currentTime = now.toTimeString().substring(0, 5) // HH:MM format
  
  const data = loadAppData()
  const todayClasses = data.schedule
    .filter(s => (s.day === currentDay || s.day === 'Everyday') && s.startTime > currentTime)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
  
  if (todayClasses.length > 0) {
    const nextClass = todayClasses[0]
    const [hours, minutes] = nextClass.startTime.split(':').map(Number)
    const nextTime = new Date()
    nextTime.setHours(hours, minutes, 0, 0)
    const minutesUntil = Math.round((nextTime.getTime() - now.getTime()) / (1000 * 60))
    const teacher = nextClass.teacherId ? data.teachers.find(t => t.id === nextClass.teacherId) || null : null
    return { schedule: nextClass, teacher, minutesUntil }
  }
  
  return null
}

// Track Records operations
export function addTrackRecord(record: Omit<TrackRecord, 'id' | 'createdAt'>): TrackRecord {
  const data = loadAppData()
  const newRecord: TrackRecord = {
    ...record,
    id: generateId(),
    createdAt: Date.now()
  }
  data.trackRecords.push(newRecord)
  saveAppData(data)
  return newRecord
}

export function updateTrackRecord(id: string, updates: Partial<TrackRecord>): TrackRecord | null {
  const data = loadAppData()
  const index = data.trackRecords.findIndex(r => r.id === id)
  if (index === -1) return null
  
  data.trackRecords[index] = { ...data.trackRecords[index], ...updates }
  saveAppData(data)
  return data.trackRecords[index]
}

export function deleteTrackRecord(id: string): boolean {
  const data = loadAppData()
  const index = data.trackRecords.findIndex(r => r.id === id)
  if (index === -1) return false
  
  data.trackRecords.splice(index, 1)
  saveAppData(data)
  return true
}

export function getTrackRecords(): TrackRecord[] {
  return loadAppData().trackRecords || []
}

export function getTrackRecordsByStudent(studentId: string): TrackRecord[] {
  return (loadAppData().trackRecords || []).filter(r => r.studentId === studentId)
}

export function getTrackRecordsByDate(date: string): TrackRecord[] {
  return (loadAppData().trackRecords || []).filter(r => r.date === date)
}

export function getTrackRecordsByCategory(category: TrackCategory): TrackRecord[] {
  return (loadAppData().trackRecords || []).filter(r => r.category === category)
}

// Lesson Plan operations
export function addLessonPlan(plan: Omit<LessonPlan, 'id' | 'createdAt'>): LessonPlan {
  const data = loadAppData()
  const newPlan: LessonPlan = {
    ...plan,
    id: generateId(),
    createdAt: Date.now()
  }
  data.lessonPlans.push(newPlan)
  saveAppData(data)
  return newPlan
}

export function updateLessonPlan(id: string, updates: Partial<LessonPlan>): LessonPlan | null {
  const data = loadAppData()
  const index = data.lessonPlans.findIndex(r => r.id === id)
  if (index === -1) return null
  
  data.lessonPlans[index] = { ...data.lessonPlans[index], ...updates }
  saveAppData(data)
  return data.lessonPlans[index]
}

export function deleteLessonPlan(id: string): boolean {
  const data = loadAppData()
  const index = data.lessonPlans.findIndex(r => r.id === id)
  if (index === -1) return false
  
  data.lessonPlans.splice(index, 1)
  saveAppData(data)
  return true
}

export function getLessonPlans(): LessonPlan[] {
  return loadAppData().lessonPlans || []
}

export function getLessonPlansByDate(date: string): LessonPlan[] {
  const data = loadAppData()
  return data.lessonPlans.filter(plan => plan.date === date)
}

export function getLessonPlansByClass(className: string): LessonPlan[] {
  const data = loadAppData()
  return data.lessonPlans.filter(plan => plan.className === className)
}

export function getLessonPlansBySubject(subject: string): LessonPlan[] {
  const data = loadAppData()
  return data.lessonPlans.filter(plan => plan.subject === subject)
}

// Attendance Records operations
export function addAttendanceRecord(record: Omit<AttendanceRecord, 'id' | 'createdAt'>): AttendanceRecord {
  const data = loadAppData()
  const newRecord: AttendanceRecord = {
    ...record,
    id: generateId(),
    createdAt: Date.now()
  }
  data.attendanceRecords.push(newRecord)
  saveAppData(data)
  return newRecord
}

export function updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>): AttendanceRecord | null {
  const data = loadAppData()
  const index = data.attendanceRecords.findIndex(r => r.id === id)
  if (index === -1) return null
  
  data.attendanceRecords[index] = { ...data.attendanceRecords[index], ...updates }
  saveAppData(data)
  return data.attendanceRecords[index]
}

export function deleteAttendanceRecord(id: string): boolean {
  const data = loadAppData()
  const index = data.attendanceRecords.findIndex(r => r.id === id)
  if (index === -1) return false
  
  data.attendanceRecords.splice(index, 1)
  saveAppData(data)
  return true
}

export function getAttendanceRecords(): AttendanceRecord[] {
  return loadAppData().attendanceRecords || []
}

export function getAttendanceRecordsByStudent(studentId: string): AttendanceRecord[] {
  return (loadAppData().attendanceRecords || []).filter(r => r.studentId === studentId)
}

export function getAttendanceRecordsByDate(date: string): AttendanceRecord[] {
  const data = loadAppData()
  return data?.attendanceRecords?.filter(r => r.date === date) || []
}

export function getAttendanceRecordsByStatus(status: AttendanceStatus): AttendanceRecord[] {
  return (loadAppData().attendanceRecords || []).filter(r => r.status === status)
}

// Attendance Actions operations
export function addAttendanceAction(action: Omit<AttendanceAction, 'id' | 'createdAt'>): AttendanceAction {
  const data = loadAppData()
  const newAction: AttendanceAction = {
    ...action,
    id: generateId(),
    createdAt: Date.now()
  }
  data.attendanceActions.push(newAction)
  saveAppData(data)
  return newAction
}

export function updateAttendanceAction(id: string, updates: Partial<AttendanceAction>): AttendanceAction | null {
  const data = loadAppData()
  const index = data.attendanceActions.findIndex(r => r.id === id)
  if (index === -1) return null
  
  data.attendanceActions[index] = { ...data.attendanceActions[index], ...updates }
  saveAppData(data)
  return data.attendanceActions[index]
}

export function deleteAttendanceAction(id: string): boolean {
  const data = loadAppData()
  const index = data.attendanceActions.findIndex(r => r.id === id)
  if (index === -1) return false
  
  data.attendanceActions.splice(index, 1)
  saveAppData(data)
  return true
}

export function getAttendanceActions(): AttendanceAction[] {
  return loadAppData().attendanceActions || []
}

export function getAttendanceActionsByStudent(studentId: string): AttendanceAction[] {
  return (loadAppData().attendanceActions || []).filter(r => r.studentId === studentId)
}

export function getAttendanceStats(studentId: string): AttendanceStats {
  const data = loadAppData()
  const studentRecords = data.attendanceRecords.filter(r => r.studentId === studentId)
  
  let currentStreak = 0
  let longestStreak = 0
  let totalPresent = 0
  let totalAbsent = 0
  let totalLate = 0
  let totalLeave = 0
  
  // Sort records by date (ascending)
  const sortedRecords = [...studentRecords].sort((a, b) => a.date.localeCompare(b.date))
  
  // Calculate streaks and totals
  sortedRecords.forEach(record => {
    if (record.status === 'absent') {
      currentStreak++
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak
      }
    } else {
      currentStreak = 0
    }
    
    switch (record.status) {
      case 'present':
        totalPresent++
        break
      case 'absent':
        totalAbsent++
        break
      case 'late':
        totalLate++
        break
      case 'leave':
        totalLeave++
        break
    }
  })
  
  const totalDays = sortedRecords.length
  const percentage = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0
  
  const lastAbsentDate = sortedRecords
    .filter(r => r.status === 'absent')
    .sort((a, b) => b.date.localeCompare(a.date))[0]?.date
  
  return {
    studentId,
    currentStreak: studentRecords.length > 0 ? currentStreak : 0,
    longestStreak,
    totalPresent,
    totalAbsent,
    totalLate,
    totalLeave,
    percentage,
    lastAbsentDate
  }
}

// Convert file to base64 with optional resize for profile pictures
export async function fileToBase64(file: File, maxWidth: number = 800, maxHeight: number = 800): Promise<string> {
  // If not an image file, return as-is
  if (!file.type.startsWith('image/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        // Check if resize is needed
        if (img.width <= maxWidth && img.height <= maxHeight) {
          // No resize needed
          resolve(reader.result as string)
          return
        }

        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width
        let height = img.height
        
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        // Create canvas and resize
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(reader.result as string)
          return
        }
        
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
