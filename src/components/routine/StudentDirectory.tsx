import { useState, useEffect, useRef } from 'react'
import { 
  Users, Plus, Search, Camera, X, 
  Trash2, Edit2, Save, ChevronDown, Upload, FileText
} from 'lucide-react'
import { Student } from '../../types'
import { 
  getStudents, addStudent, updateStudent, 
  deleteStudent, searchStudents, fileToBase64,
  getPreference, setPreference
} from '../../utils/routineStorage'

import { hapticNavigation, hapticDestructive } from '../../utils/haptics'
import Avatar from '../ui/Avatar'
import TrackStudents from './TrackStudents'
import Attendance from './Attendance'
import { previewStudentsFromExcel, savePreviewedExcelStudents } from '../../utils/excelUtils'
import { previewStudentsFromPDF, savePreviewedStudents } from '../../utils/pdfUtils'
import { toast } from 'sonner'


// Student Item Component
interface StudentItemProps {
  student: Student
  isSelected: boolean
  isSelecting: boolean
  onLongPress: () => void
  onToggleSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

function StudentItem({ student, isSelected, isSelecting, onLongPress, onToggleSelect, onEdit, onDelete }: StudentItemProps) {
  // Use refs to track long press state on the profile pic only
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPressRef = useRef(false)
  
  // Handle touch start on the profile pic - only start long press timer
  const handleProfilePicTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation() // Prevent card touch
    isLongPressRef.current = false
    pressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      onLongPress()
    }, 500) // 500ms long press
  }
  
  // Handle touch end on the profile pic
  const handleProfilePicTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation()
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current)
      pressTimerRef.current = null
    }
  }
  
  // Handle touch cancel on the profile pic
  const handleProfilePicTouchCancel = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current)
      pressTimerRef.current = null
    }
    isLongPressRef.current = false
  }
  
  // Handle mouse down on the profile pic (for desktop)
  const handleProfilePicMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card mouse down
    isLongPressRef.current = false
    pressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      onLongPress()
    }, 500) // 500ms long press
  }
  
  // Handle mouse up on the profile pic
  const handleProfilePicMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current)
      pressTimerRef.current = null
    }
  }
  
  // Handle mouse leave on the profile pic (cancel long press if mouse leaves)
  const handleProfilePicMouseLeave = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current)
      pressTimerRef.current = null
    }
    isLongPressRef.current = false
  }
  
  // Handle click on the card when in selection mode - toggle selection
  const handleCardClick = () => {
    if (isSelecting) {
      onToggleSelect()
    }
  }

  return (
    <div 
      className={`bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow ripple-effect ${
        isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''
      }`}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-4">
        {/* Select Checkbox - always rendered but invisible when not selecting */}
        <div 
          className={`flex-shrink-0 mt-1 w-4 h-4 ${isSelecting ? 'opacity-100' : 'opacity-0'}`}
          onClick={isSelecting ? (e) => e.stopPropagation() : undefined}
        >
          {isSelecting && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelect();
              }}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:bg-gray-700"
            />
          )}
        </div>

        {/* Photo - Long press only on profile pic starts multi-selection */}
        <div
          onTouchStart={handleProfilePicTouchStart}
          onTouchEnd={handleProfilePicTouchEnd}
          onTouchCancel={handleProfilePicTouchCancel}
          onMouseDown={handleProfilePicMouseDown}
          onMouseUp={handleProfilePicMouseUp}
          onMouseLeave={handleProfilePicMouseLeave}
          className="flex-shrink-0"
        >
          <Avatar 
            name={student.fullName} 
            photo={student.photo} 
            size="lg"
            className="ring-2 ring-gray-100 dark:ring-zinc-700 cursor-pointer"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold dark:text-white text-base truncate">{student.fullName}</h3>
            {student.className && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
                {student.className}
              </span>
            )}
          </div>
          {student.fatherName && (
            <p className="text-gray-500 dark:text-zinc-400 text-sm mt-0.5 truncate">
              Father: {student.fatherName}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {student.dateOfBirth && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-semibold">
                🎂 {student.dateOfBirth}
              </span>
            )}
            {student.contactNumber && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                📞 {student.contactNumber}
              </span>
            )}
          </div>
          {student.comment && (
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2 bg-gray-50 dark:bg-zinc-800 rounded-lg px-2 py-1.5 line-clamp-2">
              📝 {student.comment}
            </p>
          )}
        </div>

        {/* Actions */}
        {!isSelecting && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onEdit}
              className="p-2.5 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={onDelete}
              className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const CLASSES: string[] = ['Play 1', 'Play 2', 'Play', 'Nursery 1', 'Nursery 2', 'Nursery', 'KG 1', 'KG 2', 'KG', 'Grade 1', 'Grade 2']

type Tab = 'directory' | 'track' | 'attendance'

export default function StudentDirectory() {
  // Ref for preserving scroll position
  const listScrollRef = useRef<HTMLDivElement>(null)
  const scrollPosRef = useRef(0)
  
  const [students, setStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [genderFilter, setGenderFilter] = useState<'all' | 'boys' | 'girls'>('all')
  // Note: setGenderFilter is reserved for future UI implementation
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('directory')
  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    motherName: '',
    dateOfBirth: '',
    contactNumber: '',
    roll: '',
    section: '',
    address: '',
    photo: null as string | null,
    comment: '',
    className: getPreference('lastStudentClass', '') as string,
    gender: 'Male' as string
  })
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [isSelecting, setIsSelecting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewStudents, setPreviewStudents] = useState<any[]>([])
  const [previewClassName, setPreviewClassName] = useState('')
  const [previewSection, setPreviewSection] = useState('')
  const [previewGender, setPreviewGender] = useState<'Male' | 'Female'>('Male')
  const [importSource, setImportSource] = useState<'excel' | 'pdf'>('excel')
  
  // Save scroll position when entering selection mode
  useEffect(() => {
    if (listScrollRef.current && isSelecting) {
      // Small delay to allow layout to settle after entering selection mode
      setTimeout(() => {
        if (listScrollRef.current) {
          listScrollRef.current.scrollTop = scrollPosRef.current
        }
      }, 50)
    }
  }, [isSelecting])
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const excelInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  const handleExcelImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      toast.message('Parsing Excel file...')
      const { students, className, section } = await previewStudentsFromExcel(file)
      
      if (students.length === 0) {
        toast.error('No students found in Excel file')
        return
      }
      
      // Show preview
      setPreviewStudents(students)
      setPreviewClassName(className)
      setPreviewSection(section)
      setImportSource('excel')
      setShowPreview(true)
    } catch (error) {
      console.error('Error importing students from Excel:', error)
      toast.error('Failed to import students from Excel')
    }

  // Reset input
    if (excelInputRef.current) {
      excelInputRef.current.value = ''
    }
  }

  const handlePDFImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      toast.message('Parsing PDF file...')
      console.log('Starting PDF import for:', file.name)
      const { students, className, section } = await previewStudentsFromPDF(file)
      console.log('PDF import result:', students.length, 'students, class:', className, 'section:', section)
      
      if (students.length === 0) {
        toast.error('No students found in PDF file. Check console for details.')
        // Don't return early - still reset input
      } else {
        // Show preview
        setPreviewStudents(students)
        setPreviewClassName(className)
        setPreviewSection(section)
        setImportSource('pdf')
        setShowPreview(true)
      }
    } catch (error) {
      console.error('Error importing students from PDF:', error)
      toast.error('Failed to import students from PDF: ' + (error as Error).message)
    }

    // Reset input
    if (pdfInputRef.current) {
      pdfInputRef.current.value = ''
    }
  }

  const handleConfirmImport = async () => {
    try {
      toast.message('Importing students...')
      let count = 0
      
      if (importSource === 'pdf') {
        // For PDF import, add gender to each student
        const studentsWithGender = previewStudents.map(s => ({ ...s, gender: previewGender }))
        count = savePreviewedStudents(studentsWithGender)
        toast.success(`Successfully imported ${count} students from PDF`, {
          duration: 5000
        })
      } else {
        // For Excel import, add gender to each student
        const studentsWithGender = previewStudents.map(s => ({ ...s, gender: previewGender }))
        count = savePreviewedExcelStudents(studentsWithGender)
        toast.success(`Successfully imported ${count} students from Excel`, {
          duration: 5000
        })
      }
      
      setShowPreview(false)
      setPreviewStudents([])
      loadStudents()
    } catch (error) {
      console.error('Error saving previewed students:', error)
      toast.error('Failed to import students')
    }
  }

  useEffect(() => {
    loadStudents()
    
    // Listen for add-student event from main nav
    const handleAddStudent = () => {
      setActiveTab('directory')
      setShowForm(true)
      setEditingId(null)
      setFormData({
        fullName: '',
        fatherName: '',
        motherName: '',
        dateOfBirth: '',
        contactNumber: '',
        roll: '',
        section: '',
        address: '',
        photo: null,
        comment: '',
        className: getPreference('lastStudentClass', ''),
        gender: 'Male'
      })
    }
    
    window.addEventListener('add-student', handleAddStudent)
    return () => window.removeEventListener('add-student', handleAddStudent)
  }, [])

  const loadStudents = () => {
    let data = searchQuery ? searchStudents(searchQuery, selectedClass) : 
      (selectedClass && selectedClass !== 'all' ? getStudents().filter(s => s.className === selectedClass) : getStudents())
    
    // Filter by gender if not 'all'
    if (genderFilter === 'boys') {
      data = data.filter(s => s.gender === 'Male')
    } else if (genderFilter === 'girls') {
      data = data.filter(s => s.gender === 'Female')
    }
    
    // Sort students alphabetically by full name
    const sortedData = [...data].sort((a, b) => a.fullName.localeCompare(b.fullName))
    setStudents(sortedData)
    // Don't clear selected students - keep the selection state
  }

  useEffect(() => {
    loadStudents()
  }, [searchQuery, selectedClass, genderFilter])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const base64 = await fileToBase64(file)
      setFormData(prev => ({ ...prev, photo: base64 }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Save last selected class
    if (formData.className) {
      setPreference('lastStudentClass', formData.className)
    }
    
    if (editingId) {
      updateStudent(editingId, formData)
    } else {
      addStudent(formData)
    }
    
    resetForm()
    loadStudents()
  }

  const resetForm = () => {
    setFormData({
      fullName: '',
      fatherName: '',
      motherName: '',
      dateOfBirth: '',
      contactNumber: '',
      roll: '',
      section: '',
      address: '',
      photo: null,
      comment: '',
      className: '',
      gender: 'Male'
    })
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (student: Student) => {
    setFormData({
      fullName: student.fullName,
      fatherName: student.fatherName,
      motherName: student.motherName || '',
      dateOfBirth: student.dateOfBirth,
      contactNumber: student.contactNumber,
      roll: student.roll || '',
      section: student.section || '',
      address: student.address || '',
      photo: student.photo,
      comment: student.comment || '',
      className: student.className || '',
      gender: student.gender || 'Male'
    })
    setEditingId(student.id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      deleteStudent(id)
      loadStudents()
    }
  }

  // Handle long press - enter selection mode
  const handleLongPress = (studentId: string) => {
    // Only enter selection mode if not already in selection mode
    if (!isSelecting) {
      // Save scroll position before entering selection mode
      if (listScrollRef.current) {
        scrollPosRef.current = listScrollRef.current.scrollTop
      }
      hapticDestructive() // Haptic feedback on long press
      setIsSelecting(true)
      setSelectedStudents([studentId])
    }
  }

  // Handle selection toggle
  const handleToggleSelection = (studentId: string) => {
    hapticNavigation() // Haptic feedback on selection
    handleSelectStudent(studentId)
  }

  // Handle select all
  const handleSelectAll = () => {
    hapticNavigation()
    const allIds = students.map(s => s.id)
    setSelectedStudents(allIds)
  }

  // Handle clear selection
  const handleClearSelection = () => {
    hapticNavigation()
    setSelectedStudents([])
    setIsSelecting(false)
  }

  // Handle select student
  const handleSelectStudent = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) 
        ? prev.filter(studentId => studentId !== id)
        : [...prev, id]
    )
  }



  const handleDeleteSelected = () => {
    if (selectedStudents.length === 0) {
      toast.error('No students selected')
      return
    }

    if (confirm(`Are you sure you want to delete ${selectedStudents.length} student(s)?`)) {
      selectedStudents.forEach(id => deleteStudent(id))
      setSelectedStudents([])
      setIsSelecting(false)
      loadStudents()
      toast.success(`Successfully deleted ${selectedStudents.length} student(s)`)
    }
  }

  const renderDirectoryTabContent = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-20">
      {/* Directory Tab Content (without header and tabs) */}
       <div className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-white/10 px-4 py-4">
        {/* Import Excel Button */}
        <div className="mb-3">
          <button
            onClick={() => excelInputRef.current?.click()}
            className="w-full py-2.5 px-4 bg-purple-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-purple-600 transition-colors"
          >
            <Upload size={16} />
            Import Students from Excel
          </button>
          <input
            ref={excelInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleExcelImport}
            className="hidden"
          />
        </div>

        {/* Import PDF Button */}
        <div className="mb-3">
          <button
            onClick={() => pdfInputRef.current?.click()}
            className="w-full py-2.5 px-4 bg-red-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-colors"
          >
            <FileText size={16} />
            Import Students from PDF
          </button>
          <input
            ref={pdfInputRef}
            type="file"
            accept=".pdf"
            onChange={handlePDFImport}
            className="hidden"
          />
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or father's name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-zinc-800 border-0 rounded-xl text-sm dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Class Filter */}
        <div className="relative">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer shadow-sm transition-colors"
          >
            <option value="all" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white py-2">All Classes</option>
            {CLASSES.map(cls => (
              <option key={cls} value={cls} className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white py-2">{cls}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none dark:text-zinc-500" />
        </div>

        {/* Gender Toggle */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setGenderFilter('all')}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all ${
              genderFilter === 'all' 
                ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900' 
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setGenderFilter('boys')}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              genderFilter === 'boys' 
                ? 'bg-blue-500 text-white' 
                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
            }`}
          >
            Boys
          </button>
          <button
            onClick={() => setGenderFilter('girls')}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              genderFilter === 'girls' 
                ? 'bg-pink-500 text-white' 
                : 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/30'
            }`}
          >
            Girls
          </button>
        </div>
      </div>

      {/* Multi-Select Actions */}
      {isSelecting && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white py-3 px-4 z-50 flex items-center justify-between shadow-lg animate-slide-down" style={{ top: '0px', paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClearSelection}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
            <span className="font-bold">{selectedStudents.length} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-sm font-medium flex items-center gap-1"
            >
              <Save size={16} />
              Select All
            </button>
            <button
              onClick={handleClearSelection}
              className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-sm font-medium"
            >
              Clear
            </button>
            <button
              onClick={handleDeleteSelected}
              className="px-3 py-1.5 rounded-lg bg-white text-red-500 hover:bg-gray-100 transition-colors text-sm font-bold flex items-center gap-1"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Student List */}
      <div className="p-4 space-y-3">        {students.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-zinc-500 font-medium">
              {searchQuery ? 'No students found' : 'No students yet'}
            </p>
            <p className="text-gray-300 dark:text-zinc-600 text-sm mt-1">
              {searchQuery ? 'Try a different search term' : 'Add your first student to get started'}
            </p>
          </div>
        ) : (
          students.map(student => (
            <StudentItem
              key={student.id}
              student={student}
              isSelected={selectedStudents.includes(student.id)}
              isSelecting={isSelecting}
              onLongPress={() => handleLongPress(student.id)}
              onToggleSelect={() => handleToggleSelection(student.id)}
              onEdit={() => { hapticNavigation(); handleEdit(student); }}
              onDelete={() => { hapticDestructive(); handleDelete(student.id); }}
            />
          ))
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/10">
              <h2 className="text-lg font-bold dark:text-white">
                {editingId ? 'Edit Student' : 'Add New Student'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Photo */}
              <div className="flex justify-center">
                <div 
                  className="cursor-pointer relative group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Avatar 
                    name={formData.fullName} 
                    photo={formData.photo} 
                    size="xl"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Fields */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 border-0 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                  Class <span className="text-gray-400">(Optional)</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.className}
                    onChange={(e) => setFormData(prev => ({ ...prev, className: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-white to-gray-50 dark:from-zinc-800 dark:to-zinc-700 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer shadow-md transition-all hover:border-blue-300 dark:hover:border-blue-500"
                  >
                    <option value="" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white py-3">Select Class</option>
                    {CLASSES.map(cls => (
                      <option key={cls} value={cls} className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white py-3">{cls}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none dark:text-zinc-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                  Father's Name <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.fatherName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fatherName: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 border-0 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter father's name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                  Mother's Name <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.motherName}
                  onChange={(e) => setFormData(prev => ({ ...prev, motherName: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 border-0 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter mother's name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                    Roll <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.roll}
                    onChange={(e) => setFormData(prev => ({ ...prev, roll: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 border-0 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Roll number"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                    Section <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 border-0 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Boys Section 1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                  Gender
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, gender: 'Male' }))}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
                      formData.gender === 'Male' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    Boy
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, gender: 'Female' }))}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
                      formData.gender === 'Female' 
                        ? 'bg-pink-500 text-white' 
                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    Girl
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                  Address <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 border-0 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter address"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 border-0 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 border-0 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter contact number"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                  Comment <span className="text-gray-400">(Optional)</span>
                </label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 border-0 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Add any additional notes..."
                  rows={2}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                {editingId ? (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Add Student
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Preview Modal */}
      {showPreview && previewStudents.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-white/10">
              <h2 className="text-lg font-bold dark:text-white">Import Preview</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {previewStudents.length} students found • Class: {previewClassName} {previewSection && `• Section: ${previewSection}`}
              </p>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-80">
              {/* Preview first student card */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Preview (first student):</p>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {previewStudents[0]?.fullName?.charAt(0) || previewStudents[0]?.studentIndex?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold dark:text-white truncate">{previewStudents[0]?.fullName || previewStudents[0]?.studentIndex || 'Unnamed'}</p>
                      <div className="text-sm text-gray-500 dark:text-gray-400 space-y-0.5 mt-1">
                        {(previewStudents[0]?.roll || previewStudents[0]?.rollNo) && (
                          <p>Roll: {previewStudents[0]?.roll || previewStudents[0]?.rollNo}</p>
                        )}
                        {previewStudents[0]?.fatherName && (
                          <p>Father: {previewStudents[0]?.fatherName}</p>
                        )}
                        {previewStudents[0]?.motherName && (
                          <p>Mother: {previewStudents[0]?.motherName}</p>
                        )}
                        {previewStudents[0]?.contactNumber && (
                          <p>Phone: {previewStudents[0]?.contactNumber}</p>
                        )}
                        {previewStudents[0]?.section && (
                          <p>Section: {previewStudents[0]?.section}</p>
                        )}
                        {previewStudents[0]?.gender && (
                          <p>Gender: {previewStudents[0]?.gender}</p>
                        )}
                        {previewStudents[0]?.bloodGroup && (
                          <p>Blood Group: {previewStudents[0]?.bloodGroup}</p>
                        )}
                        {previewStudents[0]?.studentIndex && (
                          <p>Student ID: {previewStudents[0]?.studentIndex}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Show more students count */}
              {previewStudents.length > 1 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  + {previewStudents.length - 1} more students will be imported
                </p>
              )}
            </div>

            {/* Gender Selection */}
            <div className="px-4 py-3 border-t border-gray-100 dark:border-white/10">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Select gender for imported students:
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewGender('Male')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    previewGender === 'Male' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                  }`}
                >
                  Boy
                </button>
                <button
                  onClick={() => setPreviewGender('Female')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    previewGender === 'Female' 
                      ? 'bg-pink-500 text-white' 
                      : 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/30'
                  }`}
                >
                  Girl
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-white/10 flex gap-3">
              <button
                onClick={() => {
                  setShowPreview(false)
                  setPreviewStudents([])
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-white/20 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-xl text-white font-medium transition-colors"
              >
                Confirm Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Header with Navigation Tabs - Fixed for all tabs */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-white/10 px-4 py-4">
        <div className="flex items-center justify-between mb-4 pt-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <h1 className="text-xl font-bold dark:text-white">Student Directory</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-3">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('directory')}
              className={`py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'directory'
                  ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Directory
            </button>
            <button
              onClick={() => setActiveTab('track')}
              className={`py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'track'
                  ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Track
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'attendance'
                  ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Attendance
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'directory' && renderDirectoryTabContent()}
      {activeTab === 'track' && <TrackStudents students={getStudents()} />}
      {activeTab === 'attendance' && <Attendance students={getStudents()} />}
    </div>
  )
}
