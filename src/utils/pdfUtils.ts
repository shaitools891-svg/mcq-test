import * as pdfjsLib from 'pdfjs-dist'
import { loadAppData, saveAppData, generateId, addImportRecord, getLastImportRecord, removeStudentsFromImport } from './routineStorage'

// Configure pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

interface PDFStudentData {
  fullName: string
  fatherName: string
  motherName: string
  dateOfBirth: string
  contactNumber: string
  rollNumber: string
  indexNumber: string
  admissionDate: string
  className: string
  section: string
  address: string
  gender?: string
}

// Extract students using column positions for ClasswiseTotalStudentReport format
// This format has columns: Serial, ID, Roll, Name, Phone, Father, Mother (without field markers)
function extractStudentsByColumns(items: any[]): string {
  console.log('Starting column extraction, items:', items.length)
  
  // Log sample items to see the actual X/Y values
  console.log('Sample items (first 10):')
  for (let i = 0; i < Math.min(10, items.length); i++) {
    const item = items[i]
    console.log(`  Y=${item.transform[5].toFixed(1)}, X=${item.transform[4].toFixed(1)}: "${item.str}"`)
  }
  
  // Group items by Y position (rows)
  const rows: { [key: number]: any[] } = {}
  items.forEach((item: any) => {
    const y = Math.round(item.transform[5] * 2) / 2  // Round to 0.5
    if (!rows[y]) rows[y] = []
    rows[y].push(item)
  })
  
  console.log('Found rows:', Object.keys(rows).length)
  
  // Sort rows by Y (top to bottom)
  const sortedY = Object.keys(rows).sort((a, b) => parseFloat(b) - parseFloat(a))
  
  let result = ''
  for (const y of sortedY) {
    const rowItems = rows[parseFloat(y)].sort((a: any, b: any) => a.transform[4] - b.transform[4])
    
    // Extract columns based on X position
    let serial = '', id = '', roll = '', name = '', phone = '', father = '', mother = ''
    let currentX = 0
    
    for (const item of rowItems) {
      const x = item.transform[4]
      const text = item.str.trim()
      
      if (!text || text.length === 0) continue
      
      // Skip headers
      if (text.match(/^(Student|ID|Roll|Name|Contact|Father|Mother|Section|Class|Session|Group|Page|No|Serial)$/i)) continue
      if (text === '#') continue
      
      // Determine column based on X position (in points)
      // Column positions based on observed data:
      // Serial: 0-30
      // ID: 30-90  
      // Roll: 90-120
      // Name: 120-280
      // Phone: 280-380
      // Father: 380-500
      // Mother: 500+
      
      if (x < 30) {
        // Serial column
        if (text.match(/^\d+$/)) serial = text
      } else if (x < 90) {
        // ID column (6 digits like 202675)
        if (text.match(/^\d{6}$/)) id = text
      } else if (x < 120) {
        // Roll column (1-2 digits)
        if (text.match(/^\d{1,2}$/)) roll = text
      } else if (x < 280) {
        // Name column (text)
        if (text.match(/^[A-Za-z\s]+$/)) {
          name = name ? name + ' ' + text : text
        }
      } else if (x < 380) {
        // Phone column (11 digits)
        if (text.match(/^\d{11}$/)) phone = text
      } else if (x < 500) {
        // Father column
        if (text.match(/^[A-Za-z\s]+$/)) {
          father = father ? father + ' ' + text : text
        }
      } else {
        // Mother column
        if (text.match(/^[A-Za-z\s]+$/)) {
          mother = mother ? mother + ' ' + text : text
        }
      }
    }
    
    // Only include rows with valid data (must have ID or name or phone)
    if ((id || name) && (phone || roll)) {
      // Skip empty placeholder rows (roll 00 with no other data)
      if (roll === '00' && !phone && !name) continue
      
      result += `${name} ${father} ${mother} ${roll} ${id} ${phone}\n`
    }
  }
  
  console.log('Extracted result:', result.substring(0, 500))
  return result
}

// Extract students from the new "card format" PDF (ClasswiseTotalStudentReport format)
// This format has blocks per student with: Index, Name, F.N., M.N., Phone, Roll, DOB
// Fixed version using block-based parsing
function extractStudentsFromCardFormat(items: any[]): string {
  console.log('Card format extraction (block-based), items:', items.length)
  
  // Get all text preserving some structure - join with newlines for better parsing
  const allText = items.map((item: any) => item.str).join('\n')
  console.log('All text sample:', allText.substring(0, 500))
  
  // First, let's normalize the text - replace multiple spaces/newlines with single space
  const normalizedText = allText.replace(/\s+/g, ' ')
  console.log('Normalized text sample:', normalizedText.substring(0, 500))
  
  // Parse students from the text - look for Index: pattern followed by student data
  const students: string[] = []
  
  // Split by "Index:" and process each part
  const parts = normalizedText.split(/Index:/g)
  console.log('Found', parts.length - 1, 'potential student blocks')
  
  // Debug: log the first few parts
  for (let i = 1; i < Math.min(parts.length, 3); i++) {
    console.log(`Part ${i}:`, parts[i].substring(0, 200))
  }
  
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i]
    
    // Skip empty blocks (these are likely header/empty rows)
    if (part.trim().length < 10) continue
    
    // Extract index (first 6 digits after "Index:")
    const indexMatch = part.match(/^(\d{6})/)
    if (!indexMatch) continue
    const index = indexMatch[1]
    
    // Skip placeholder records (index starting with 2028xx seem to be empty - roll 00)
    // Check if this is a valid student by looking for roll number > 0
    const rollMatch = part.match(/Roll\s*:\s*(\d+)/)
    const roll = rollMatch ? rollMatch[1] : ''
    
    // Skip if roll is 00 or empty - these are placeholder records
    if (roll === '00' || roll === '') continue
    
    // Extract phone (11 digits)
    const phoneMatch = part.match(/(\d{11})/)
    const phone = phoneMatch ? phoneMatch[1] : ''
    
    // Find name - text after index before F.N.
    // The format is: "Index: 202765 ABUBAKR TASHFI F.N.:"
    let name = ''
    const nameMatch = part.match(/^\d{6}\s+([A-Za-z][A-Za-z\s]*?)(?=\s+F\.N\.:|\s+Roll\s*:|\s+M\.N\.:)/i)
    if (nameMatch) {
      name = nameMatch[1].trim()
    }
    
    // If no name found with first regex, try alternative
    if (!name) {
      const altNameMatch = part.match(/^\d{6}\s+([A-Za-z]+(?:\s+[A-Za-z]+)*?)\s+F\.N\.:/i)
      if (altNameMatch) {
        name = altNameMatch[1].trim()
      }
    }
    
    // Find father's name - after "F.N.:" before "M.N." or "Roll" or phone
    let father = ''
    const fatherMatch = part.match(/F\.N\.:\s*([A-Za-z]+(?:\s+[A-Za-z]+)*?)(?=\s+M\.N\.:|\s+Roll\s*:|\s+\d{11})/i)
    if (fatherMatch) {
      father = fatherMatch[1].trim()
    }
    
    // Find mother's name - after "M.N.:" before "Roll" or phone
    let mother = ''
    const motherMatch = part.match(/M\.N\.:\s*([A-Za-z]+(?:\s+[A-Za-z]+)*?)(?=\s+Roll\s*:|\s+\d{11}|\s+Previous)/i)
    if (motherMatch) {
      mother = motherMatch[1].trim()
    }
    
    console.log(`Block ${i}: index=${index}, name="${name}", father="${father}", mother="${mother}", roll=${roll}, phone=${phone}`)
    
    // Only add if we have essential data
    if (name && phone) {
      students.push(`${name} ${father} ${mother} ${roll} ${index} ${phone}`)
    }
  }
  
  const result = students.join('\n')
  console.log('Card format result (block-based):', students.length, 'students extracted')
  console.log('Sample results:', result.substring(0, 500))
  return result
}

// Parse Classwise Total Student Report PDF format
function parseStudentDataFromText(text: string, className: string): PDFStudentData[] {
  const students: PDFStudentData[] = []
  
  // Extract class and section from header
  let extractedClass = ''
  let extractedSection = ''
  
  // Find class name
  const classMatch = text.match(/Class\s*:\s*(\w+)/i)
  if (classMatch) {
    extractedClass = classMatch[1].trim()
  }
  
  // Find section
  const sectionMatch = text.match(/Section\s*:\s*([^\s]+)/i)
  if (sectionMatch) {
    extractedSection = sectionMatch[1].trim()
  }
  
  if (!extractedClass) {
    extractedClass = className || 'Unknown'
  }
  
  // Improved parsing: handle the new format where data is space-separated
  // Format: Name Father Mother Roll Index Phone
  const lines = text.split('\n').filter(line => line.trim().length > 0)
  
  for (const line of lines) {
    const parts = line.trim().split(/\s+/)
    if (parts.length < 4) continue
    
    // Look for phone number (11 digits) in parts
    const phoneIndex = parts.findIndex(p => p.match(/^\d{11}$/))
    
    // If no phone found, look for Index (6 digits) 
    const indexIndex = parts.findIndex(p => p.match(/^\d{6}$/))
    
    if (phoneIndex === -1 && indexIndex === -1) continue
    
    let phone = ''
    let index = ''
    let roll = ''
    let fullName = ''
    let fatherName = ''
    let motherName = ''
    
    if (phoneIndex !== -1) {
      phone = parts[phoneIndex]
    }
    
    if (indexIndex !== -1) {
      index = parts[indexIndex]
    }
    
    // Extract roll - look for 1-2 digit numbers that aren't phone or index
    const numericParts = parts.filter(p => p.match(/^\d{1,2}$/))
    if (numericParts.length > 0) {
      roll = numericParts[0]
    }
    
    // Get non-numeric parts as names
    const nameParts = parts.filter(p => !p.match(/^\d+$/))
    
    if (nameParts.length >= 3) {
      // Assume: first parts = name, middle = father/mother
      motherName = nameParts[nameParts.length - 1]
      fatherName = nameParts[nameParts.length - 2]
      fullName = nameParts.slice(0, nameParts.length - 2).join(' ')
    } else if (nameParts.length === 2) {
      fullName = nameParts[0]
      fatherName = nameParts[1]
    } else if (nameParts.length === 1) {
      fullName = nameParts[0]
    }
    
    // Skip if we don't have meaningful data
    if (!fullName || fullName.length < 2) continue
    if (!phone && !index) continue  // Must have at least one identifier
    
    // Skip placeholder records (roll = 00 or empty names)
    if (roll === '00' && !phone) continue
    
    students.push({
      fullName,
      fatherName,
      motherName,
      dateOfBirth: '',
      contactNumber: phone,
      rollNumber: roll,
      indexNumber: index,
      admissionDate: '',
      className: extractedClass,
      section: extractedSection,
      address: ''
    })
  }
  
  // Fallback: try simple phone-based extraction if no students found
  if (students.length === 0) {
    const phonePattern = /(\d{11})/g
    let match
    while ((match = phonePattern.exec(text)) !== null) {
      const phone = match[0]
      const pos = match.index
      
      const before = text.slice(Math.max(0, pos - 80), pos)
      const after = text.slice(pos + 11, Math.min(text.length, pos + 50))
      
      // Find 2-digit roll and 6-digit ID
      const rollMatch = before.match(/(\d{2})\s*$/)
      const idMatch = before.match(/(\d{6})\s+\d{2}\s*$/)
      
      const roll = rollMatch ? rollMatch[1] : ''
      const id = idMatch ? idMatch[1] : ''
      
      // Get name parts - text before roll/ID
      let namePart = before
      if (idMatch) namePart = before.slice(0, idMatch.index)
      else if (rollMatch) namePart = before.slice(0, rollMatch.index)
      
      const nameWords = namePart.trim().split(/\s+/)
      
      let fullName = '', fatherName = '', motherName = ''
      if (nameWords.length >= 3) {
        motherName = nameWords[nameWords.length - 1]
        fatherName = nameWords[nameWords.length - 2]
        fullName = nameWords.slice(0, nameWords.length - 2).join(' ')
      } else if (nameWords.length === 2) {
        fullName = nameWords[0]
        fatherName = nameWords[1]
      } else {
        fullName = namePart.trim()
      }
      
      if (fullName && fullName.length > 2) {
        const exists = students.some(s => s.contactNumber === phone)
        if (!exists) {
          students.push({
            fullName,
            fatherName,
            motherName,
            dateOfBirth: '',
            contactNumber: phone,
            rollNumber: roll,
            indexNumber: id,
            admissionDate: '',
            className: extractedClass,
            section: extractedSection,
            address: ''
          })
        }
      }
    }
  }
  
  return students
}

// Extract class name from PDF text
function extractClassName(text: string): string {
  const classMatch = text.match(/Class\s*:\s*(\w+)/i)
  if (classMatch) {
    return classMatch[1].trim()
  }
  return 'Unknown'
}

// Map PDF class and section to app class category
export function mapClassFromPDF(pdfClass: string, section: string, gender: string): string {
  const classLower = pdfClass.toLowerCase()
  const sectionLower = section.toLowerCase()
  const isBoys = sectionLower.includes('boys') || gender.toLowerCase() === 'male'
  const isGirls = sectionLower.includes('girls') || gender.toLowerCase() === 'female'
  
  const sectionMatch = sectionLower.match(/(?:section|section-)\s*(\d+)/i)
  const sectionNumber = sectionMatch ? parseInt(sectionMatch[1]) : 0
  
  if (isBoys && sectionNumber > 0) {
    if (classLower === 'nursery') return sectionNumber === 1 ? 'Nursery 1' : 'Nursery 2'
    if (classLower === 'play') return sectionNumber === 1 ? 'Play 1' : 'Play 2'
    if (classLower === 'kg') return sectionNumber === 1 ? 'KG 1' : 'KG 2'
  }
  
  if (isGirls || (!isBoys && !isGirls)) {
    if (classLower === 'nursery') return 'Nursery'
    if (classLower === 'play') return 'Play'
    if (classLower === 'kg') return 'KG'
    if (classLower.includes('grade 1') || classLower === 'one') return 'Grade 1'
    if (classLower.includes('grade 2') || classLower === 'two') return 'Grade 2'
  }
  
  if (classLower === 'nursery') return 'Nursery 1'
  if (classLower === 'play') return 'Play 1'
  if (classLower === 'kg') return 'KG 1'
  if (classLower.includes('grade 1') || classLower === 'one') return 'Grade 1'
  if (classLower.includes('grade 2') || classLower === 'two') return 'Grade 2'
  
  return 'Nursery 1'
}

// Preview students from PDF without saving
export async function previewStudentsFromPDF(file: File): Promise<{ students: PDFStudentData[], className: string, section: string }> {
  console.log('Starting PDF preview for:', file.name)
  console.log('PDFJS version:', pdfjsLib.version)
  
  try {
    const arrayBuffer = await file.arrayBuffer()
    console.log('File loaded, size:', arrayBuffer.byteLength)
    console.log('File loaded, size:', arrayBuffer.byteLength)
    
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    console.log('PDF loaded, pages:', pdf.numPages)
    
    const numPages = pdf.numPages
    let allText = ''
    let className = ''
    let isCardFormat = false
    
    // Extract text from all pages
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const items = textContent.items as any[]
      
      // Sort items by Y (top to bottom), then by X (left to right)
      items.sort((a: any, b: any) => {
        const yDiff = b.transform[5] - a.transform[5]
        if (Math.abs(yDiff) > 0.1) return yDiff
        return a.transform[4] - b.transform[4]
      })
      
      // Check for format - look for Index: or specific patterns
      const rawText = items.map((item: any) => item.str).join(' ')
      console.log('Raw text sample:', rawText.substring(0, 300))
      // Card format has "Index:" pattern with F.N.
      // OR it's a simple column format with 6-digit IDs and 11-digit phones
      if (!isCardFormat) {
        const hasIndexMarker = rawText.includes('Index:')
        const hasFNs = rawText.includes('F.N.:') || rawText.includes('F.N')
        const hasFather = rawText.includes('Father')
        const hasCardFormatNames = rawText.includes('ABUBAKR') || rawText.includes('HUZAIFA')
        
        // Check for simple column format (6-digit ID, 11-digit phone)
        const has6DigitID = !!rawText.match(/\b\d{6}\b/)
        const has11DigitPhone = !!rawText.match(/\b\d{11}\b/)
        
        console.log('Format detection - hasIndexMarker:', hasIndexMarker, 'hasFNs:', hasFNs, 'hasFather:', hasFather)
        console.log('Format detection - has6DigitID:', has6DigitID, 'has11DigitPhone:', has11DigitPhone)
        
        isCardFormat = (hasIndexMarker && (hasFNs || hasFather || hasCardFormatNames)) || 
                       (has6DigitID && has11DigitPhone)
        console.log('Is card format:', isCardFormat)
      }
      console.log('Is card format:', isCardFormat)
      if (i === 1) {
        className = extractClassName(rawText)
      }
      
      // Use appropriate extraction method based on format
    let studentsText = ''
    if (isCardFormat) {
      studentsText = extractStudentsFromCardFormat(items)
    } else {
      studentsText = extractStudentsByColumns(items)
    }
    
    // Debug: log what we extracted
    console.log('Extracted students text:', studentsText.substring(0, 200))
    allText += studentsText
    }
    
    const parsedStudents = parseStudentDataFromText(allText, className)
    console.log('Parsed students count:', parsedStudents.length)
    const section = parsedStudents.length > 0 ? parsedStudents[0].section : ''
    
    return { students: parsedStudents, className, section }
  } catch (error) {
    console.error('Error parsing PDF:', error)
    return { students: [], className: '', section: '' }
  }
}

// Save previewed students to app data
export function savePreviewedStudents(students: PDFStudentData[]): number {
  const appData = loadAppData()
  const importedStudentIds: string[] = []
  
  students.forEach(student => {
    if (student.fullName) {
      const studentId = generateId()
      const mappedClass = mapClassFromPDF(student.className || '', student.section || '', student.gender || 'Male')
      appData.students.push({
        id: studentId,
        fullName: student.fullName,
        fatherName: student.fatherName,
        motherName: student.motherName,
        dateOfBirth: student.dateOfBirth,
        contactNumber: student.contactNumber,
        roll: student.rollNumber,
        section: student.section,
        address: student.address,
        className: mappedClass,
        gender: student.gender || 'Male',
        comment: '',
        photo: null,
        createdAt: Date.now()
      })
      importedStudentIds.push(studentId)
    }
  })
  
  saveAppData(appData)
  addImportRecord(importedStudentIds, 'pdf')
  return importedStudentIds.length
}

// Import students from PDF file
export async function importStudentsFromPDF(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        const numPages = pdf.numPages
        let allText = ''
        let className = ''
        let isCardFormat = false
        
        // Extract text from all pages
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          const items = textContent.items as any[]
          
          // Sort items by Y then X
          items.sort((a: any, b: any) => {
            const yDiff = b.transform[5] - a.transform[5]
            if (Math.abs(yDiff) > 0.1) return yDiff
            return a.transform[4] - b.transform[4]
          })
          
          // Check for format on first page
          if (i === 1) {
            const rawText = items.map((item: any) => item.str).join(' ')
            const hasIndexMarker = rawText.includes('Index:')
            const hasFNs = rawText.includes('F.N.:') || rawText.includes('F.N')
            const hasFather = rawText.includes('Father')
            const hasCardFormatNames = rawText.includes('ABUBAKR') || rawText.includes('HUZAIFA')
            
            // Check for simple column format (6-digit ID, 11-digit phone)
            const has6DigitID = !!rawText.match(/\b\d{6}\b/)
            const has11DigitPhone = !!rawText.match(/\b\d{11}\b/)
            
            isCardFormat = (hasIndexMarker && (hasFNs || hasFather || hasCardFormatNames)) || 
                           (has6DigitID && has11DigitPhone)
            className = extractClassName(rawText)
          }
          
          // Use appropriate extraction method based on format
          let studentsText = ''
          if (isCardFormat) {
            studentsText = extractStudentsFromCardFormat(items)
          } else {
            studentsText = extractStudentsByColumns(items)
          }
          allText += studentsText
        }
        
        // Parse student data
        const parsedStudents = parseStudentDataFromText(allText, className)
        
        // Save to app data
        const appData = loadAppData()
        const importedStudentIds: string[] = []
        
        parsedStudents.forEach(student => {
          if (student.fullName) {
            const studentId = generateId()
            const mappedClass = mapClassFromPDF(student.className || '', student.section || '', student.gender || 'Male')
            appData.students.push({
              id: studentId,
              fullName: student.fullName,
              fatherName: student.fatherName,
              motherName: student.motherName,
              dateOfBirth: student.dateOfBirth,
              contactNumber: student.contactNumber,
              roll: student.rollNumber,
              section: student.section,
              address: student.address,
              className: mappedClass,
              comment: '',
              photo: null,
              createdAt: Date.now()
            })
            importedStudentIds.push(studentId)
          }
        })
        
        saveAppData(appData)
        addImportRecord(importedStudentIds, 'pdf')
        resolve(importedStudentIds.length)
      } catch (error) {
        console.error('Error importing students from PDF:', error)
        reject(error)
      }
    }
    
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

// Undo last PDF import
export function undoPDFImport(): number {
  const importRecord = getLastImportRecord()
  
  if (!importRecord || importRecord.source !== 'pdf') {
    return 0
  }
  
  const removedCount = removeStudentsFromImport(importRecord.id)
  return removedCount
}
