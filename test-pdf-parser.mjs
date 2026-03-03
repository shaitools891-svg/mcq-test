import fs from 'fs';
import path from 'path';
import pdfjsLib from 'pdfjs-dist';
import { generateId, addImportRecord, loadAppData, saveAppData } from './src/utils/routineStorage.js';

// Configure pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = path.resolve('.', 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');

// Parse student from section text
function parseStudentFromSection(text, indexNumber, className) {
  // Extract student name (after Index: XXX and before F.N.:)
  const nameMatch = text.match(/Index:\s*\d+\s*([^\n]+?)(?=\s*F\.N\.|$)/);
  const fullName = nameMatch ? nameMatch[1].trim() : '';
  
  // Extract father's name
  const fatherMatch = text.match(/F\.N\.:\s*([^\n]+?)(?=\s*M\.N\.|$)/);
  const fatherName = fatherMatch ? fatherMatch[1].trim() : '';
  
  // Extract mother's name
  const motherMatch = text.match(/M\.N\.:\s*([^\n]+?)(?=\s*\d{11}|\s*Address|$)/);
  const motherName = motherMatch ? motherMatch[1].trim() : '';
  
  // Extract date of birth
  const dobMatch = text.match(/DOB\s*:\s*(\d{4}-\d{2}-\d{2})/);
  const dateOfBirth = dobMatch ? dobMatch[1] : '';
  
  // Extract contact numbers (looking for 11-digit numbers)
  const phoneMatches = text.match(/\d{11}/g);
  const contactNumber = phoneMatches ? phoneMatches[0] : '';
  
  // Extract roll number
  const rollMatch = text.match(/Roll\s*:\s*(\d+)/);
  const rollNumber = rollMatch ? rollMatch[1] : '';
  
  // Extract admission date
  const admDateMatch = text.match(/Adm\. Date:\s*(\d+\/\d+\/\d+)/);
  const admissionDate = admDateMatch ? admDateMatch[1] : '';
  
  // Extract address
  const addressMatch = text.match(/Previous Ins\.\s*:\s*([^\n]+?)(?=\s*#|Page:|$)/s);
  let address = '';
  if (addressMatch) {
    address = addressMatch[1].trim();
  } else {
    // Alternative address extraction
    const addrPattern = /(?:BHATIA|JOHIRKONA|NIAMOTPUR|KARIMGANJ|KISHOREGANJ|PAKONDIA|BOGURA|SADAR|TILOKNATPUR|KARIAIL|NA NSREE|HOSSAINPUR|BIR HAZIPUR|HAZIPUR)/g;
    const addrMatches = [...text.matchAll(addrPattern)];
    if (addrMatches.length > 0) {
      address = addrMatches.map(m => m[0]).join(', ');
    }
  }
  
  return {
    fullName,
    fatherName,
    motherName,
    dateOfBirth,
    contactNumber,
    rollNumber,
    indexNumber,
    admissionDate,
    className,
    address
  };
}

// Parse student data from text
function parseStudentDataFromText(text, className) {
  const students = [];
  
  // Find all student entries by matching index patterns
  const indexPattern = /Index:\s*(\d+)/g;
  const matches = [...text.matchAll(indexPattern)];
  
  matches.forEach(match => {
    const indexNumber = match[1];
    const indexPos = match.index;
    
    if (indexPos !== undefined) {
      // Extract text around the index match to find student details
      let startPos = indexPos;
      let endPos = text.indexOf('Page:', indexPos);
      
      if (endPos === -1) {
        endPos = text.length;
      }
      
      const studentText = text.slice(startPos, endPos);
      
      // Parse student information
      const student = parseStudentFromSection(studentText, indexNumber, className);
      if (student.fullName) {
        students.push(student);
      }
    }
  });
  
  return students;
}

// Extract class name from PDF header
function extractClassName(text) {
  const classMatch = text.match(/Class\s*:\s*([^\s]+)/);
  return classMatch ? classMatch[1].trim() : 'Unknown';
}

// Extract text from PDF
async function extractTextFromPDF(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdf = await pdfjsLib.getDocument(data).promise;
  const numPages = pdf.numPages;
  let allText = '';
  let className = '';
  
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(' ');
    allText += pageText;
    
    if (i === 1) {
      className = extractClassName(pageText);
    }
  }
  
  return { allText, className };
}

// Test the PDF parser
async function testPDFParser() {
  try {
    const pdfPath = path.resolve('.', '1846.pdf');
    console.log('Reading PDF file:', pdfPath);
    
    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      console.error('PDF file not found at:', pdfPath);
      return;
    }
    
    // Extract text from PDF
    console.log('Extracting text from PDF...');
    const { allText, className } = await extractTextFromPDF(pdfPath);
    
    console.log('Found class:', className);
    console.log('PDF text length:', allText.length);
    
    // Parse student data
    console.log('Parsing student data...');
    const students = parseStudentDataFromText(allText, className);
    
    console.log(`Parsed ${students.length} students`);
    
    if (students.length > 0) {
      console.log('\nSample students:');
      students.slice(0, 5).forEach((student, index) => {
        console.log(`\n${index + 1}. ${student.fullName}`);
        console.log(`   Father: ${student.fatherName}`);
        console.log(`   DOB: ${student.dateOfBirth}`);
        console.log(`   Contact: ${student.contactNumber}`);
        console.log(`   Address: ${student.address}`);
      });
    } else {
      console.log('No students found in the PDF');
    }
    
    console.log('\nPDF parsing test completed');
  } catch (error) {
    console.error('Error testing PDF parser:', error);
  }
}

// Run the test
testPDFParser().catch(error => {
  console.error('Test failed:', error);
});
