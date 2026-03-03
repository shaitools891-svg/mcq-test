import { useState, useEffect } from 'react'
import { 
  CheckCircle, XCircle, Clock, Calendar, 
  Search, Phone, Bell, Check, AlertCircle
} from 'lucide-react'
import { AttendanceRecord, AttendanceStatus } from '../../types'
import { 
  addAttendanceRecord, updateAttendanceRecord,
  getStudents, getAttendanceRecordsByDate, getAttendanceStats,
  addAttendanceAction
} from '../../utils/routineStorage'
import { toast } from 'sonner'
import Avatar from '../ui/Avatar'

interface AttendanceProps {
  students: any[]
}

const ATTENDANCE_STATUS = [
  { id: 'present', label: 'Present', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  { id: 'absent', label: 'Absent', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  { id: 'late', label: 'Late', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  { id: 'leave', label: 'Leave', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' }
]

export default function Attendance({ students = [] }: AttendanceProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [selectedClass, setSelectedClass] = useState<string | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [absentStudents, setAbsentStudents] = useState<any[]>([])

  useEffect(() => {
    loadRecords()
    loadAbsentStudents()
  }, [selectedDate, selectedClass])

  const loadRecords = () => {
    let loadedRecords = getAttendanceRecordsByDate(selectedDate)

    if (selectedClass !== 'all') {
      loadedRecords = loadedRecords.filter(record => {
        const student = getStudents().find(s => s.id === record.studentId)
        return student?.className === selectedClass
      })
    }

    setRecords(loadedRecords)
  }

  const loadAbsentStudents = () => {
    const records = getAttendanceRecordsByDate(selectedDate)
    const absentIds = records.filter(r => r.status === 'absent').map(r => r.studentId)
    const absent = students.filter(student => absentIds.includes(student.id))
    setAbsentStudents(absent)
  }

  const handleAttendance = (studentId: string, status: AttendanceStatus, notes?: string) => {
    try {
      const existingRecord = records.find(r => r.studentId === studentId)
      
      if (existingRecord) {
        updateAttendanceRecord(existingRecord.id, { status, notes })
      } else {
        addAttendanceRecord({
          studentId,
          date: selectedDate,
          status,
          notes
        })
      }

      loadRecords()
      loadAbsentStudents()
      toast.success('Attendance updated')
    } catch (error) {
      toast.error('Failed to update attendance')
    }
  }

  const handleMarkAllPresent = () => {
    try {
      students.forEach(student => {
        const existingRecord = records.find(r => r.studentId === student.id)
        
        if (!existingRecord) {
          addAttendanceRecord({
            studentId: student.id,
            date: selectedDate,
            status: 'present'
          })
        } else if (existingRecord.status !== 'present') {
          updateAttendanceRecord(existingRecord.id, { status: 'present' })
        }
      })

      loadRecords()
      loadAbsentStudents()
      toast.success('All students marked as present')
    } catch (error) {
      toast.error('Failed to mark all present')
    }
  }

  const handleCallParent = (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    if (student && student.contactNumber) {
      // Open phone app with student's contact number
      const telUrl = `tel:${student.contactNumber}`
      window.open(telUrl, '_system')
      addAttendanceAction({
        studentId,
        date: selectedDate,
        actionType: 'call'
      })
    } else {
      toast.warning('No contact number available')
    }
  }

  const handleRemindLater = (studentId: string) => {
    addAttendanceAction({
      studentId,
      date: selectedDate,
      actionType: 'remind_later',
      reminderAt: Date.now() + (60 * 60 * 1000) // 1 hour
    })
    toast.success('Reminder set for 1 hour')
  }

  const handleMarkDone = (studentId: string) => {
    addAttendanceAction({
      studentId,
      date: selectedDate,
      actionType: 'done'
    })
    toast.success('Action marked as done')
  }

  const getAttendanceStatus = (studentId: string) => {
    const record = records.find(r => r.studentId === studentId)
    return record?.status || null
  }

  const getClassOptions = () => {
    const classes = [...new Set(students.map(student => student.className))]
    return classes.filter(cls => cls).sort()
  }

  const filteredStudents = students.filter(student => {
    if (selectedClass !== 'all' && student.className !== selectedClass) {
      return false
    }
    if (searchQuery) {
      return student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
             student.fatherName.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  const getStudentStats = (studentId: string) => {
    return getAttendanceStats(studentId)
  }

  const getAttendanceOverview = () => {
    const totalStudents = filteredStudents.length
    const presentStudents = records.filter(r => r.status === 'present').length
    const absentStudentsCount = records.filter(r => r.status === 'absent').length
    const lateStudents = records.filter(r => r.status === 'late').length
    const leaveStudents = records.filter(r => r.status === 'leave').length
    const unmarkedStudents = totalStudents - (presentStudents + absentStudentsCount + lateStudents + leaveStudents)

    return {
      total: totalStudents,
      present: presentStudents,
      absent: absentStudentsCount,
      late: lateStudents,
      leave: leaveStudents,
      unmarked: unmarkedStudents
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Attendance</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{selectedDate}</p>
          </div>
          <button
            onClick={handleMarkAllPresent}
            className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
          >
            Mark All Present
          </button>
        </div>

         <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Date Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-white to-gray-50 dark:from-zinc-800 dark:to-zinc-700 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500 shadow-md transition-all hover:border-blue-300 dark:hover:border-blue-500"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none dark:text-zinc-500" />
            </div>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-white to-gray-50 dark:from-zinc-800 dark:to-zinc-700 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer shadow-md transition-all hover:border-blue-300 dark:hover:border-blue-500"
            >
              <option value="all" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white py-3">All Classes</option>
              {getClassOptions().map(cls => (
                <option key={cls} value={cls} className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white py-3">{cls}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Attendance Overview */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Attendance Overview</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Present</span>
            </div>
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {getAttendanceOverview().present}
            </div>
            <div className="text-xs text-green-500 dark:text-green-500">
              {Math.round((getAttendanceOverview().present / getAttendanceOverview().total) * 100)}%
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">Absent</span>
            </div>
            <div className="text-xl font-bold text-red-600 dark:text-red-400">
              {getAttendanceOverview().absent}
            </div>
            <div className="text-xs text-red-500 dark:text-red-500">
              {Math.round((getAttendanceOverview().absent / getAttendanceOverview().total) * 100)}%
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Late</span>
            </div>
            <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
              {getAttendanceOverview().late}
            </div>
            <div className="text-xs text-orange-500 dark:text-orange-500">
              {Math.round((getAttendanceOverview().late / getAttendanceOverview().total) * 100)}%
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Leave</span>
            </div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {getAttendanceOverview().leave}
            </div>
            <div className="text-xs text-blue-500 dark:text-blue-500">
              {Math.round((getAttendanceOverview().leave / getAttendanceOverview().total) * 100)}%
            </div>
          </div>
        </div>
        {getAttendanceOverview().unmarked > 0 && (
          <div className="mt-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Unmarked: {getAttendanceOverview().unmarked}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Absent Students Alert */}
      {absentStudents.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="text-red-500" size={20} />
            <h3 className="font-medium text-red-800 dark:text-red-200">Absent Students ({absentStudents.length})</h3>
          </div>
          <div className="space-y-2">
            {absentStudents.map(student => {
              const stats = getStudentStats(student.id)
              const isConcerning = stats.currentStreak >= 2
              
              return (
                <div key={student.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar name={student.fullName} photo={student.photo} size="sm" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{student.fullName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {isConcerning ? 
                          `Absent for ${stats.currentStreak} consecutive days` : 
                          'Absent today'
                        }
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Father: {student.fatherName} - {student.contactNumber}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCallParent(student.id)}
                      className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      title="Call Parent"
                    >
                      <Phone size={16} />
                    </button>
                    <button
                      onClick={() => handleRemindLater(student.id)}
                      className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                      title="Remind Later"
                    >
                      <Bell size={16} />
                    </button>
                    <button
                      onClick={() => handleMarkDone(student.id)}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      title="Mark as Done"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Students Attendance List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Calendar size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No students found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStudents.map(student => {
              const status = getAttendanceStatus(student.id)
              const stats = getStudentStats(student.id)
              const [isExpanded, setIsExpanded] = useState(false)

              return (
                <div key={student.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar name={student.fullName} photo={student.photo} size="sm" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{student.fullName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{student.className}</div>
                      </div>
                    </div>

                    {/* Attendance Status Badge */}
                    <div className="ml-4">
                      {status ? (
                        ATTENDANCE_STATUS.map(s => {
                          const IconComponent = s.icon
                          if (s.id === status) {
                            return (
                              <div key={s.id} className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${s.bg}`}>
                                <IconComponent size={14} className={s.color} />
                                <span className={s.color}>{s.label}</span>
                              </div>
                            )
                          }
                          return null
                        })
                      ) : (
                        <div className="text-gray-400 text-xs">Not marked</div>
                      )}
                    </div>
                  </div>

                  {/* Attendance Actions */}
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {ATTENDANCE_STATUS.map(statusOption => {
                      const IconComponent = statusOption.icon
                      const isActive = status === statusOption.id
                      
                      return (
                        <button
                          key={statusOption.id}
                          onClick={() => handleAttendance(student.id, statusOption.id as AttendanceStatus)}
                          className={`flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                            isActive 
                              ? `${statusOption.bg} ${statusOption.color} border-2 border-current`
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          <IconComponent size={14} />
                          <span>{statusOption.label}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full mt-2 py-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center justify-center gap-1 transition-colors"
                  >
                    <svg 
                      className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    {isExpanded ? 'Hide Details' : 'Show Details'}
                  </button>

                  {/* Stats - Only visible when expanded */}
                  {isExpanded && (
                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <div className="font-medium">{stats.currentStreak}</div>
                          <div className={stats.currentStreak >= 2 ? 'text-red-500' : 'text-gray-500'}>
                            Absent Streak
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{stats.percentage}%</div>
                          <div>Total</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{stats.totalAbsent}</div>
                          <div>Total Absent</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
