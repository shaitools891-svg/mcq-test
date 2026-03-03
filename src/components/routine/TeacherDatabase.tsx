import { useState, useEffect, useRef } from 'react'
import { 
  GraduationCap, Plus, Camera, X, 
  Trash2, Edit2, Save
} from 'lucide-react'
import { Teacher } from '../../types'
import { 
  getTeachers, addTeacher, updateTeacher, 
  deleteTeacher, fileToBase64 
} from '../../utils/routineStorage'

import { hapticNavigation, hapticDestructive } from '../../utils/haptics'
import Avatar from '../ui/Avatar'

export default function TeacherDatabase() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    subjects: [] as string[],
    contactNumber: '',
    photo: null as string | null
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadTeachers()
    
    // Listen for add-teacher event from main nav
    const handleAddTeacher = () => {
      setShowForm(true)
      setEditingId(null)
      setFormData({
        name: '',
        subjects: [],
        contactNumber: '',
        photo: null
      })
    }
    
    window.addEventListener('add-teacher', handleAddTeacher)
    return () => window.removeEventListener('add-teacher', handleAddTeacher)
  }, [])

  const loadTeachers = () => {
    const loadedTeachers = getTeachers()
    // Backwards compatibility: convert old 'subject' to 'subjects' array
    const migratedTeachers = loadedTeachers.map(t => ({
      ...t,
      subjects: t.subjects && t.subjects.length > 0 
        ? t.subjects 
        : ((t as any).subject ? [(t as any).subject] : []),
      contactNumber: t.contactNumber || ''
    }))
    setTeachers(migratedTeachers)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const base64 = await fileToBase64(file)
      setFormData(prev => ({ ...prev, photo: base64 }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingId) {
      updateTeacher(editingId, formData)
    } else {
      addTeacher(formData)
    }
    
    resetForm()
    loadTeachers()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      subjects: [],
      contactNumber: '',
      photo: null
    })
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (teacher: Teacher) => {
    setFormData({
      name: teacher.name,
      subjects: teacher.subjects || [],
      contactNumber: teacher.contactNumber || '',
      photo: teacher.photo
    })
    setEditingId(teacher.id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this teacher?')) {
      deleteTeacher(id)
      loadTeachers()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-white/10 px-4 py-4">
        <div className="flex items-center justify-between mb-4 pt-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <GraduationCap className="w-5 h-5 text-emerald-500" />
            </div>
            <h1 className="text-xl font-bold dark:text-white">Teacher Database</h1>
          </div>
        </div>
        
      </div>

      {/* Teacher List */}
      <div className="p-4 space-y-3">
        {teachers.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="w-12 h-12 text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-zinc-500 font-medium">
              No teachers yet
            </p>
            <p className="text-gray-300 dark:text-zinc-600 text-sm mt-1">
              Add your first teacher to get started
            </p>
          </div>
        ) : (
          teachers.map(teacher => (
            <div 
              key={teacher.id}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                {/* Photo */}
                <Avatar 
                  name={teacher.name} 
                  photo={teacher.photo} 
                  size="lg"
                  className="ring-2 ring-gray-100 dark:ring-zinc-700"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold dark:text-white text-base truncate">{teacher.name}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(teacher.subjects || []).slice(0, 3).map((subject, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold"
                      >
                        {subject}
                      </span>
                    ))}
                    {(teacher.subjects || []).length > 3 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 text-xs font-semibold">
                        +{(teacher.subjects || []).length - 3}
                      </span>
                    )}
                  </div>
                  {teacher.contactNumber && (
                    <p className="text-gray-500 dark:text-zinc-400 text-xs mt-1.5 flex items-center gap-1">
                      <span className="text-blue-500">📞</span> {teacher.contactNumber}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => { hapticNavigation(); handleEdit(teacher); }}
                    className="p-2.5 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => { hapticDestructive(); handleDelete(teacher.id); }}
                    className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
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
                {editingId ? 'Edit Teacher' : 'Add New Teacher'}
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
              {/* Photo */}
              <div className="flex justify-center">
                <div 
                  className="cursor-pointer relative group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Avatar 
                    name={formData.name} 
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
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 border-0 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter teacher name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                  Subjects
                </label>
                <input
                  type="text"
                  required
                  value={formData.subjects.join(', ')}
                  onChange={(e) => setFormData(prev => ({ ...prev, subjects: e.target.value.split(',').map(s => s.trim()).filter(s => s) }))}
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 border-0 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter subjects (comma separated)"
                />
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Separate multiple subjects with commas</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 border-0 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter contact number"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                {editingId ? (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Add Teacher
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
