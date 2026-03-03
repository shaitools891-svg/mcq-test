import { useState, useEffect } from 'react'
import { 
  BookOpen, FileText, CheckCircle, XCircle, 
  AlertCircle, Calendar, Search, Book
} from 'lucide-react'
import { TrackRecord, TrackCategory } from '../../types'
import { 
  getTrackRecords, addTrackRecord, deleteTrackRecord,
  getTrackRecordsByStudent, getTrackRecordsByCategory, getTrackRecordsByDate
} from '../../utils/routineStorage'
import { toast } from 'sonner'
import Avatar from '../ui/Avatar'

interface TrackStudentsProps {
  students: any[]
}

const TRACK_CATEGORIES = [
  { id: 'book_not_brought', label: 'Didn\'t bring book', icon: Book, color: 'text-red-500' },
  { id: 'notebook_not_brought', label: 'Didn\'t bring notebook', icon: FileText, color: 'text-orange-500' },
  { id: 'stationary_not_brought', label: 'Didn\'t bring stationary', icon: BookOpen, color: 'text-yellow-500' },
  { id: 'homework_not_done', label: 'Homework not done', icon: FileText, color: 'text-red-500' },
  { id: 'homework_incomplete', label: 'Homework incomplete', icon: FileText, color: 'text-orange-500' },
  { id: 'classwork_not_done', label: 'Classwork not done', icon: FileText, color: 'text-red-500' },
  { id: 'classwork_incorrect', label: 'Classwork incorrect', icon: FileText, color: 'text-orange-500' },
  { id: 'not_attentive', label: 'Not attentive', icon: AlertCircle, color: 'text-yellow-500' },
  { id: 'sleeping', label: 'Sleeping', icon: AlertCircle, color: 'text-purple-500' },
  { id: 'talking', label: 'Talking', icon: AlertCircle, color: 'text-blue-500' },
  { id: 'behavior_issue', label: 'Behavior issue', icon: XCircle, color: 'text-red-500' },
  { id: 'good_behavior', label: 'Good behavior', icon: CheckCircle, color: 'text-green-500' }
]

export default function TrackStudents({ students = [] }: TrackStudentsProps) {
  const [records, setRecords] = useState<TrackRecord[]>([])
  const [selectedCategory, setSelectedCategory] = useState<TrackCategory | 'all'>('all')
  const [selectedStudent, setSelectedStudent] = useState<string | 'all'>('all')
  const [selectedClass, setSelectedClass] = useState<string | 'all'>('all')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [searchQuery, setSearchQuery] = useState<string>('')

  useEffect(() => {
    loadRecords()
  }, [selectedCategory, selectedStudent, selectedClass, selectedDate])

  const loadRecords = () => {
    let loadedRecords = getTrackRecords()

    if (selectedCategory !== 'all') {
      loadedRecords = getTrackRecordsByCategory(selectedCategory)
    }

    if (selectedStudent !== 'all') {
      loadedRecords = getTrackRecordsByStudent(selectedStudent)
    }

    if (selectedClass !== 'all') {
      loadedRecords = loadedRecords.filter(record => {
        const student = students.find(s => s.id === record.studentId)
        return student?.className === selectedClass
      })
    }

    if (selectedDate) {
      loadedRecords = getTrackRecordsByDate(selectedDate)
    }

    setRecords(loadedRecords)
  }

  const handleAddTrackRecord = (studentId: string, category: TrackCategory, notes?: string) => {
    try {
      const newRecord = addTrackRecord({
        studentId,
        category,
        date: selectedDate,
        status: category === 'good_behavior' ? 'positive' : 'negative',
        notes
      })
      setRecords(prev => [...prev, newRecord])
      toast.success('Record added successfully')
    } catch (error) {
      toast.error('Failed to add record')
    }
  }

  const handleDeleteRecord = (recordId: string) => {
    try {
      deleteTrackRecord(recordId)
      setRecords(prev => prev.filter(r => r.id !== recordId))
      toast.success('Record deleted successfully')
    } catch (error) {
      toast.error('Failed to delete record')
    }
  }

  const getCategoryDetails = (categoryId: TrackCategory) => {
    return TRACK_CATEGORIES.find(c => c.id === categoryId) || TRACK_CATEGORIES[0]
  }

  const getStudentDetails = (studentId: string) => {
    return students.find(s => s.id === studentId)
  }

  const filteredRecords = records.filter(record => {
    const student = getStudentDetails(record.studentId)
    return !searchQuery || 
      (student?.fullName && student.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (record.notes && record.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-white/10 px-4 py-4">
        <div className="flex items-center justify-between mb-4 pt-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <BookOpen className="w-5 h-5 text-blue-500" />
            </div>
            <h1 className="text-xl font-bold dark:text-white">Track Students</h1>
          </div>
        </div>
        
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
      {/* Filter Section */}
      <div className="space-y-4">
        {/* Date Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Class Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Grade or Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value)
              setSelectedStudent('all') // Reset student selection when class changes
            }}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-white to-gray-50 dark:from-zinc-800 dark:to-zinc-700 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer shadow-md transition-all hover:border-blue-300 dark:hover:border-blue-500"
          >
            <option value="all" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white py-3">All Classes</option>
            {Array.from(new Set(students.map(student => student.className))).filter(Boolean).sort().map(cls => (
              <option key={cls} value={cls} className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white py-3">
                {cls}
              </option>
            ))}
          </select>
        </div>

        {/* Student Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Student
          </label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-white to-gray-50 dark:from-zinc-800 dark:to-zinc-700 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer shadow-md transition-all hover:border-blue-300 dark:hover:border-blue-500"
          >
            <option value="all" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white py-3">All Students</option>
            {students
              .filter(student => selectedClass === 'all' || student.className === selectedClass)
              .map(student => (
                <option key={student.id} value={student.id} className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white py-3">
                  {student.fullName} ({student.className})
                </option>
              ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as TrackCategory | 'all')}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-white to-gray-50 dark:from-zinc-800 dark:to-zinc-700 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer shadow-md transition-all hover:border-blue-300 dark:hover:border-blue-500"
          >
            <option value="all" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white py-3">All Categories</option>
            {TRACK_CATEGORIES.map(category => (
              <option key={category.id} value={category.id} className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white py-3">
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Category Grid for Quick Entry */}
      <div className="grid grid-cols-2 gap-2">
        {TRACK_CATEGORIES.map(category => {
          const IconComponent = category.icon
          return (
            <button
              key={category.id}
              onClick={() => selectedStudent !== 'all' ? 
                handleAddTrackRecord(selectedStudent, category.id as TrackCategory) : 
                toast.warning('Please select a student first')}
              disabled={selectedStudent === 'all'}
              className={`p-3 rounded-lg text-left transition-colors ${
                selectedStudent === 'all' ? 
                'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' :
                'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <IconComponent size={16} className={category.color} />
                <span className="text-sm font-medium">{category.label}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Records List */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Calendar size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No track records found</p>
            {selectedStudent === 'all' && (
              <p className="text-xs text-gray-400 mt-1">Select a student to start tracking</p>
            )}
          </div>
        ) : (
          filteredRecords.map(record => {
            const student = getStudentDetails(record.studentId)
            const category = getCategoryDetails(record.category)
            const IconComponent = category.icon

            // Skip rendering records for students that don't exist anymore
            if (!student) {
              return null
            }

            return (
              <div
                key={record.id}
                className={`p-4 rounded-lg border ${
                  record.status === 'positive' 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar name={student.fullName} photo={student.photo} size="sm" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {student.fullName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {student.className || 'No class'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <IconComponent size={16} className={category.color} />
                      <span className="text-sm font-medium">{category.label}</span>
                    </div>

                    {record.notes && (
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                        {record.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 ml-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {record.createdAt ? new Date(record.createdAt).toLocaleTimeString() : 'Unknown time'}
                    </span>
                    <button
                      onClick={() => handleDeleteRecord(record.id)}
                      className="px-2 py-1 text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
      </div>
    </div>
  )
}
