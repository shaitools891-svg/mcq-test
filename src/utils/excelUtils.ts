import * as XLSX from 'xlsx'
import { Teacher, DayOfWeek } from '../types'
import { loadAppData, saveAppData, generateId, addImportRecord } from './routineStorage'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

// Parse time slot to start and end times
function parseTimeSlot(timeSlot: string): { startTime: string; endTime: string } {
  const [start, end] = timeSlot.split('-')
  return {
    startTime: start.length === 4 ? '0' + start : start,
    endTime: end.length === 4 ? '0' + end : end
  }
}

// Parse teacher name from subject string like "Hifz (Mr. Abdullah)"
function parseSubjectAndTeacher(cellValue: string): { subject: string; teacherName: string | null } {
  if (!cellValue || cellValue.trim() === '' || cellValue.toLowerCase() === 'tiffin') {
    return { subject: cellValue || '', teacherName: null }
  }
  
  // Match pattern: "Subject (Mr. TeacherName)" or "Subject (Mrs. TeacherName)" etc.
  const match = cellValue.match(/^(.+?)\s*\((Mr\.|Mrs\.|Ms\.|Dr\.)\s*([^)]+)\)$/i)
  if (match) {
    return {
      subject: match[1].trim(),
      teacherName: match[3].trim()
    }
  }
  
  return { subject: cellValue, teacherName: null }
}

// Download CSV file
async function downloadCSV(content: string, filename: string): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    // On Android, save to Documents folder
    const result = await Filesystem.writeFile({
      path: filename,
      data: btoa(content),
      directory: Directory.Documents,
    })
    return result.uri
  } else {
    // In browser, use blob download
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    return filename
  }
}

// Parse CSV content
function parseCSVContent(content: string): any[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []
  
  // Get headers from first line
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  
  const result: any[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    const row: any = {}
    headers.forEach((header, index) => {
      let value = values[index] || ''
      // Remove surrounding quotes if present
      value = value.trim().replace(/^"|"$/g, '')
      row[header] = value
    })
    if (Object.values(row).some(v => v)) {
      result.push(row)
    }
  }
  return result
}

// Download workbook (Excel) file
async function downloadWorkbook(wb: XLSX.WorkBook, filename: string): Promise<string> {
  const excelData = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
  
  // Convert base64 to binary (used by both paths)
  const binaryString = atob(excelData)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  
  if (Capacitor.isNativePlatform()) {
    // On Android, save to cache first then share
    try {
      // Write to cache directory
      const cachePath = `${Date.now()}_${filename}`
      await Filesystem.writeFile({
        path: cachePath,
        data: excelData,
        directory: Directory.Cache,
      })
      
      // Get the file URI
      const fileUri = await Filesystem.getUri({
        path: cachePath,
        directory: Directory.Cache,
      })
      
      // Use Share plugin to let user save the file
      await Share.share({
        title: 'Export Excel File',
        text: `Export ${filename}`,
        url: fileUri.uri,
        dialogTitle: 'Save or Share Excel File',
      })
      
      return filename
    } catch (error) {
      console.error('Share failed, trying direct save:', error)
      // Fallback: Save to Documents folder
      const result = await Filesystem.writeFile({
        path: filename,
        data: excelData,
        directory: Directory.Documents,
      })
      return result.uri
    }
  } else {
    // In browser, use blob download
    const workbookBlob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = URL.createObjectURL(workbookBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    return filename
  }
}

// Export students to Excel
export async function exportStudents(format: 'xlsx' | 'csv' = 'xlsx'): Promise<void> {
  const data = loadAppData()
  
  // Build CSV content with title and all fields
  let csvContent = 'Full Name,Father Name,Date of Birth,Contact Number,Class,Comment\n'
  
  data.students.forEach(s => {
    const row = [
      `"${s.fullName.replace(/"/g, '""')}"`,
      `"${s.fatherName.replace(/"/g, '""')}"`,
      s.dateOfBirth,
      s.contactNumber,
      `"${(s.className || '').replace(/"/g, '""')}"`,
      `"${(s.comment || '').replace(/"/g, '""')}"`
    ]
    csvContent += row.join(',') + '\n'
  })
  
  if (format === 'csv') {
    await downloadCSV(csvContent, 'students.csv')
  } else {
    // Convert CSV to workbook
    const wb = XLSX.read(csvContent, { type: 'string' })
    await downloadWorkbook(wb, 'students.xlsx')
  }
}

// Preview students from Excel/CSV - returns parsed data for preview
export async function previewStudentsFromExcel(file: File): Promise<{ students: any[], className: string, section: string }> {
  const isCSV = file.name.toLowerCase().endsWith('.csv')
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        let jsonData: any[]
        
        if (isCSV) {
          const content = e.target?.result as string
          jsonData = parseCSVContent(content)
        } else {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[]
        }
        
        // Parse each row to Student format
        const students = jsonData.map(row => parseStudentRow(row)).filter(s => s !== null)
        
        // Get class and section from first student
        const className = students.length > 0 ? (students[0].className || '') : ''
        const section = students.length > 0 ? (students[0].section || '') : ''
        
        resolve({ students, className, section })
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}

// Save previewed Excel students to app data
export function savePreviewedExcelStudents(students: any[]): number {
  const appData = loadAppData()
  const importedStudentIds: string[] = []
  
  students.forEach(student => {
    const studentId = generateId()
    appData.students.push({
      id: studentId,
      fullName: student.fullName || '',
      fatherName: student.fatherName || '',
      motherName: student.motherName || '',
      dateOfBirth: student.dateOfBirth || '',
      contactNumber: student.contactNumber || '',
      roll: student.roll || '',
      section: student.section || '',
      address: student.address || '',
      className: student.className || '',
      comment: student.comment || '',
      photo: null,
      createdAt: Date.now(),
      // Additional fields from Excel
      studentIndex: student.studentIndex || '',
      session: student.session || '',
      groupName: student.groupName || '',
      gender: student.gender || '',
      bloodGroup: student.bloodGroup || '',
      admissionDate: student.admissionDate || ''
    })
    importedStudentIds.push(studentId)
  })
  
  saveAppData(appData)
  addImportRecord(importedStudentIds, 'excel')
  return importedStudentIds.length
}

// Parse a row from Excel to Student format
function parseStudentRow(row: any): any {
  // Check if this is the new Excel format (Student List with Serial, ClassName, etc.)
  if (row['Serial'] !== undefined && row['ClassName'] !== undefined) {
    return {
      fullName: row['StudentName'] || row['Student Name'] || '',
      fatherName: row['FatherName'] || row['Father Name'] || '',
      motherName: row['MotherName'] || row['Mother Name'] || '',
      dateOfBirth: row['DateOfBirth'] || row['Date of Birth'] || '',
      contactNumber: row['ContactNo'] || row['Contact No'] || row['Phone'] || '',
      roll: String(row['RollNo'] || row['Roll No'] || row['Roll'] || ''),
      section: row['SectionName'] || row['Section Name'] || row['Section'] || '',
      address: row['Address'] || '',
      className: row['ClassName'] || row['Class Name'] || row['Class'] || '',
      comment: '',
      studentIndex: String(row['StudentIndex'] || row['Student ID'] || ''),
      session: String(row['Session'] || ''),
      groupName: row['GroupName'] || row['Group Name'] || row['Group'] || '',
      gender: row['Gender'] || '',
      bloodGroup: row['BloodGroupName'] || row['Blood Group'] || '',
      admissionDate: row['AdmissionDate'] || row['Admission Date'] || ''
    }
  }
  
  // Original format
  return {
    fullName: row['Full Name'] || row['fullName'] || row['Name'] || row['name'] || '',
    fatherName: row['Father Name'] || row['fatherName'] || row['Father'] || row['father'] || '',
    motherName: row['Mother Name'] || row['motherName'] || row['Mother'] || row['mother'] || '',
    dateOfBirth: row['Date of Birth'] || row['dateOfBirth'] || row['DOB'] || row['dob'] || '',
    contactNumber: row['Contact Number'] || row['contactNumber'] || row['Phone'] || row['phone'] || row['Mobile'] || '',
    roll: row['Roll'] || row['roll'] || row['Roll Number'] || row['rollNumber'] || '',
    section: row['Section'] || row['section'] || '',
    address: row['Address'] || row['address'] || row['Location'] || row['location'] || '',
    className: row['Class'] || row['className'] || row['class'] || '',
    comment: row['Comment'] || row['comment'] || row['Note'] || row['note'] || ''
  }
}

// Import students from Excel or CSV
export async function importStudents(file: File): Promise<number> {
  const isCSV = file.name.toLowerCase().endsWith('.csv')
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        let jsonData: any[]
        
        if (isCSV) {
          // Parse CSV content
          const content = e.target?.result as string
          jsonData = parseCSVContent(content)
        } else {
          // Parse Excel file
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[]
        }
        
        const appData = loadAppData()
        let count = 0
        
        jsonData.forEach(row => {
          // Support various column name formats
          const fullName = row['Full Name'] || row['fullName'] || row['Name'] || row['name']
          if (fullName) {
            appData.students.push({
              id: generateId(),
              fullName: fullName,
              fatherName: row['Father Name'] || row['fatherName'] || row['Father'] || row['father'] || '',
              motherName: row['Mother Name'] || row['motherName'] || row['Mother'] || row['mother'] || '',
              dateOfBirth: row['Date of Birth'] || row['dateOfBirth'] || row['DOB'] || row['dob'] || '',
              contactNumber: row['Contact Number'] || row['contactNumber'] || row['Phone'] || row['phone'] || row['Mobile'] || '',
              roll: row['Roll'] || row['roll'] || row['Roll Number'] || row['rollNumber'] || '',
              section: row['Section'] || row['section'] || '',
              address: row['Address'] || row['address'] || row['Location'] || row['location'] || '',
              className: row['Class'] || row['className'] || row['class'] || '',
              comment: row['Comment'] || row['comment'] || row['Note'] || row['note'] || '',
              photo: null,
              createdAt: Date.now()
            })
            count++
          }
        })
        
        saveAppData(appData)
        resolve(count)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}

// Export teachers to Excel or CSV
export async function exportTeachers(format: 'xlsx' | 'csv' = 'xlsx'): Promise<void> {
  const data = loadAppData()
  
  let csvContent = 'Name,Subjects,Contact Number\n'
  
  data.teachers.forEach(t => {
    const subjects = Array.isArray(t.subjects) ? t.subjects.join(', ') : (t as any).subject || ''
    const contactNumber = t.contactNumber || ''
    const row = [
      `"${t.name.replace(/"/g, '""')}"`,
      `"${subjects.replace(/"/g, '""')}"`,
      `"${contactNumber.replace(/"/g, '""')}"`
    ]
    csvContent += row.join(',') + '\n'
  })
  
  if (format === 'csv') {
    await downloadCSV(csvContent, 'teachers.csv')
  } else {
    const wb = XLSX.read(csvContent, { type: 'string' })
    await downloadWorkbook(wb, 'teachers.xlsx')
  }
}

// Import teachers from Excel or CSV
export async function importTeachers(file: File): Promise<number> {
  const isCSV = file.name.toLowerCase().endsWith('.csv')
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        let jsonData: any[]
        
        if (isCSV) {
          // Parse CSV content
          const content = e.target?.result as string
          jsonData = parseCSVContent(content)
        } else {
          // Parse Excel file
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[]
        }
        
        const appData = loadAppData()
        let count = 0
        
        jsonData.forEach(row => {
          // Support various column name formats
          const name = row['Name'] || row['name'] || row['Teacher Name'] || row['teacherName']
          const subjectValue = row['Subjects'] || row['subjects'] || row['Subject'] || row['subject'] || 'Unknown'
          const contactNumber = row['Contact Number'] || row['contactNumber'] || row['Contact'] || row['contact'] || ''
          
          if (name) {
            // Handle both single subject (string) and multiple subjects (comma-separated)
            const subjects = typeof subjectValue === 'string' 
              ? subjectValue.split(',').map((s: string) => s.trim()).filter((s: string) => s)
              : [subjectValue]
            
            appData.teachers.push({
              id: generateId(),
              name: name,
              subjects: subjects,
              contactNumber: contactNumber,
              photo: null,
              createdAt: Date.now()
            })
            count++
          }
        })
        
        saveAppData(appData)
        resolve(count)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}

// Export schedule to Excel or CSV - matching the import template format
// Format: Class,6.45-7.45,7.50-8.30,...
export async function exportSchedule(format: 'xlsx' | 'csv' = 'xlsx'): Promise<void> {
  const data = loadAppData()
  
  // Predefined time slots for the template (as per school schedule)
  const timeSlots = [
    '6.45-7.45',
    '7.50-8.30',
    '8.30-9.10',
    '9.10-9.50',
    '9.50-10.10',
    '10.10-10.50',
    '11.00-11.40',
    '11.40-12.20',
    '12.20-1.00',
    '1.00-1.20',
    '1.20-2.00'
  ]
  
  // Get unique class names from existing schedule
  const classSet = new Set<string>()
  data.schedule.forEach(s => {
    const className = s.subject.split(' - ')[0]
    if (className && className !== s.subject) {
      classSet.add(className)
    }
  })
  const classes = Array.from(classSet).sort()
  
  // Build CSV content
  let csvContent = 'Class,' + timeSlots.join(',') + '\n'
  
  classes.forEach(className => {
    const row = [className]
    timeSlots.forEach(slot => {
      // Find matching schedule entry for this class and time slot
      const { startTime, endTime } = parseTimeSlot(slot)
      const entry = data.schedule.find(s => {
        const sClass = s.subject.split(' - ')[0]
        return sClass === className && s.startTime === startTime && s.endTime === endTime
      })
      if (entry) {
        const teacher = entry.teacherId ? data.teachers.find(t => t.id === entry.teacherId) : null
        const subject = entry.subject.split(' - ')[1] || entry.subject
        row.push(teacher ? `${subject} (${teacher.name})` : subject)
      } else {
        row.push('')
      }
    })
    csvContent += row.join(',') + '\n'
  })
  
  if (format === 'csv') {
    await downloadCSV(csvContent, 'schedule.csv')
  } else {
    const wb = XLSX.read(csvContent, { type: 'string' })
    await downloadWorkbook(wb, 'schedule.xlsx')
  }
}

// Import class routine from Excel or CSV format
// Format: Class,6.45-7.45,7.50-8.30,...
export async function importClassRoutine(file: File): Promise<{ classesAdded: number; teachersCreated: number }> {
  const isCSV = file.name.toLowerCase().endsWith('.csv')
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        let content: string
        
        if (isCSV) {
          content = e.target?.result as string
        } else {
          // Parse Excel file to get CSV content
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          content = XLSX.utils.sheet_to_csv(firstSheet)
        }
        
        const lines = content.trim().split('\n')
        
        if (lines.length < 2) {
          reject(new Error('File must contain at least a header and one class row'))
          return
        }
        
        const appData = loadAppData()
        let classesAdded = 0
        let teachersCreated = 0
        
        // First line is header with time slots
        const header = lines[0].split(',')
        
        // Parse time slots from header (starting from index 1)
        const timeSlots: string[] = []
        for (let i = 1; i < header.length; i++) {
          timeSlots.push(header[i].trim())
        }
        
        // Process each class row (starting from index 1)
        for (let rowIdx = 1; rowIdx < lines.length; rowIdx++) {
          const row = lines[rowIdx].split(',')
          if (row.length < 2) continue
          
          const className = row[0].trim()
          if (!className) continue
          
          // Parse each time slot for this class
          for (let colIdx = 1; colIdx < row.length; colIdx++) {
            const cellValue = row[colIdx]?.trim()
            if (!cellValue || cellValue.toLowerCase() === 'tiffin') continue
            
            const timeSlot = timeSlots[colIdx - 1]
            if (!timeSlot) continue
            
            const { startTime, endTime } = parseTimeSlot(timeSlot)
            const { subject, teacherName } = parseSubjectAndTeacher(cellValue)
            
            if (!subject) continue
            
            let teacherId: string | null = null
            if (teacherName) {
              const existingTeacher = appData.teachers.find(
                t => t.name.toLowerCase() === teacherName.toLowerCase()
              )
              if (existingTeacher) {
                teacherId = existingTeacher.id
              } else {
                const newTeacher: Teacher = {
                  id: generateId(),
                  name: teacherName,
                  subjects: [subject],
                  contactNumber: '',
                  photo: null,
                  createdAt: Date.now()
                }
                appData.teachers.push(newTeacher)
                teacherId = newTeacher.id
                teachersCreated++
              }
            }
            
            // Add schedule for each day (Sunday to Thursday)
            const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
            days.forEach(day => {
              appData.schedule.push({
                id: generateId(),
                className: className,
                subject: subject,
                startTime,
                endTime,
                day,
                teacherId,
                shadowTeacherId: null,
                createdAt: Date.now()
              })
              classesAdded++
            })
          }
        }
        
        saveAppData(appData)
        resolve({ classesAdded, teachersCreated })
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}

// Export all data to Excel (multiple sheets)
export async function exportAllData(): Promise<void> {
  const data = loadAppData()
  const wb = XLSX.utils.book_new()
  
  // Students sheet
  if (data.students.length > 0) {
    const students = data.students.map(s => ({
      'Full Name': s.fullName,
      'Father Name': s.fatherName,
      'Date of Birth': s.dateOfBirth,
      'Contact Number': s.contactNumber,
      'Class': s.className || '',
      'Comment': s.comment || ''
    }))
    const wsStudents = XLSX.utils.json_to_sheet(students)
    XLSX.utils.book_append_sheet(wb, wsStudents, 'Students')
  }
  
  // Teachers sheet
  if (data.teachers.length > 0) {
    const teachers = data.teachers.map(t => ({
      'Name': t.name,
      'Subjects': Array.isArray(t.subjects) ? t.subjects.join(', ') : '',
      'Contact Number': t.contactNumber || ''
    }))
    const wsTeachers = XLSX.utils.json_to_sheet(teachers)
    XLSX.utils.book_append_sheet(wb, wsTeachers, 'Teachers')
  }
  
  // Schedule sheet
  if (data.schedule.length > 0) {
    const schedule = data.schedule.map(s => {
      const teacher = s.teacherId ? data.teachers.find(t => t.id === s.teacherId) : null
      return {
        'Class': s.className || '',
        'Subject': s.subject,
        'Day': s.day,
        'Start Time': s.startTime,
        'End Time': s.endTime,
        'Teacher': teacher ? teacher.name : ''
      }
    })
    const wsSchedule = XLSX.utils.json_to_sheet(schedule)
    XLSX.utils.book_append_sheet(wb, wsSchedule, 'Schedule')
  }
  
  await downloadWorkbook(wb, 'routine_scrapper_data.xlsx')
}

// Clear all data
export function clearAllData(): void {
  saveAppData({
    students: [],
    teachers: [],
    schedule: [],
    trackRecords: [],
    attendanceRecords: [],
    attendanceActions: [],
    lessonPlans: [],
    importHistory: []
  })
}
