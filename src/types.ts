import { LucideIcon } from 'lucide-react'

export type Theme = 'light' | 'dark' | 'system'
export type ViewMode = 'web' | 'android'

export type ToolCategory = 'Edit' | 'Secure' | 'Convert' | 'Optimize'

export interface Tool {

  title: string

  desc: string

  icon: LucideIcon

  implemented?: boolean

  path?: string

  category: ToolCategory

  color?: string

  bg?: string

}

// ==================== ROUTINE SCRAPPER TYPES ====================

export interface Student {
  id: string
  fullName: string
  fatherName: string
  motherName: string
  dateOfBirth: string
  contactNumber: string
  roll: string // Class roll number
  section: string // Section like "Boys Section 1", "Class Nursery"
  address: string // Student address
  photo: string | null // Base64 or data URL
  comment?: string // Optional comment/notes field
  className?: string // Class name: Play 1, Play 2, Nursery 1, Nursery 2, KG, Grade 1, Grade 2
  
  // Additional fields from Excel/Student List
  studentIndex?: string // Student ID from Excel
  session?: string // Academic session
  groupName?: string // Group (Science, Arts, Commerce, N/A)
  gender?: string // Male, Female
  bloodGroup?: string // Blood group (A+, A-, B+, B-, O+, O-, AB+, AB-)
  admissionDate?: string // Date of admission
  createdAt: number
}

export interface Teacher {
  id: string
  name: string
  subjects: string[] // Array of subjects the teacher teaches
  contactNumber: string // Contact number for the teacher
  photo: string | null // Base64 or data URL
  createdAt: number
}

export type DayOfWeek = 'Everyday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'

export interface ClassSchedule {
  id: string
  className: string // Class name: Play 1, Play 2, Nursery 1, Nursery 2, KG, Grade 1, Grade 2
  subject: string
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  day: DayOfWeek
  teacherId: string | null // Link to Teacher
  shadowTeacherId: string | null // Link to Shadow Teacher (optional)
  createdAt: number
}

export type TrackCategory = 
  | 'book_not_brought'
  | 'notebook_not_brought'
  | 'stationary_not_brought'
  | 'homework_not_done'
  | 'homework_incomplete'
  | 'classwork_not_done'
  | 'classwork_incorrect'
  | 'not_attentive'
  | 'sleeping'
  | 'talking'
  | 'behavior_issue'
  | 'good_behavior'

export interface TrackRecord {
  id: string
  studentId: string
  category: TrackCategory
  date: string // YYYY-MM-DD
  status: 'positive' | 'negative' | 'warning'
  notes?: string
  createdAt: number
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave'

export interface AttendanceRecord {
  id: string
  studentId: string
  date: string // YYYY-MM-DD
  status: AttendanceStatus
  markedBy?: string
  notes?: string
  createdAt: number
}

export interface LessonPlan {
  id: string
  date: string // YYYY-MM-DD
  className: string
  subject: string
  topic: string
  objectives: string // What students will learn
  materials: string // Materials needed for the lesson
  procedures: string // Step-by-step lesson plan
  assessment: string // How students will be assessed
  homework: string // Homework assignment
  notes?: string // Additional notes
  createdAt: number
}

export interface AttendanceAction {
  id: string
  studentId: string
  date: string
  actionType: 'call' | 'remind_later' | 'done'
  createdAt: number
  reminderAt?: number // for snooze feature
}

export interface AttendanceStats {
  studentId: string
  currentStreak: number // consecutive absences
  longestStreak: number
  totalAbsent: number
  totalPresent: number
  totalLate: number
  totalLeave: number
  percentage: number
  lastAbsentDate?: string
}

export interface ImportRecord {
  id: string
  studentIds: string[]
  timestamp: number
  source: 'pdf' | 'excel' | 'manual'
}

export interface AppData {
  students: Student[]
  teachers: Teacher[]
  schedule: ClassSchedule[]
  trackRecords: TrackRecord[]
  attendanceRecords: AttendanceRecord[]
  attendanceActions: AttendanceAction[]
  lessonPlans: LessonPlan[]
  importHistory: ImportRecord[]
}
