// Test script to analyze PDF structure and debug extraction
const fs = require('fs');
const path = require('path');

// Import pdfjs-dist
const pdfjsLib = require('pdfjs-dist');

// Set worker
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/build/pdf.worker.mjs');

async function analyzePDF() {
  const pdfPath = './ClasswiseTotalStudentReport (1).pdf';
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  
  console.log('Loading PDF...');
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  console.log('PDF loaded, pages:', pdf.numPages);
  
  // Get first page
  const page = await pdf.getPage(1);
  const textContent = await page.getTextContent();
  const items = textContent.items;
  
  console.log('\n=== RAW TEXT ITEMS ===');
  console.log('Total items:', items.length);
  
  // Get all text
  let allText = '';
  for (const item of items) {
    allText += item.str + ' ';
  }
  
  console.log('\n=== ALL TEXT (first 2000 chars) ===');
  console.log(allText.substring(0, 2000));
  
  console.log('\n=== FORMAT DETECTION ===');
  const hasIndexMarker = allText.includes('Index:');
  const hasFNs = allText.includes('F.N.:') || allText.includes('F.N');
  const hasFather = allText.includes('Father');
  const hasCardFormatNames = allText.includes('ABUBAKR') || allText.includes('HUZAIFA');
  const has6DigitID = !!allText.match(/\b\d{6}\b/);
  const has11DigitPhone = !!allText.match(/\b\d{11}\b/);
  
  console.log('hasIndexMarker:', hasIndexMarker);
  console.log('hasFNs:', hasFNs);
  console.log('hasFather:', hasFather);
  console.log('hasCardFormatNames:', hasCardFormatNames);
  console.log('has6DigitID:', has6DigitID);
  console.log('has11DigitPhone:', has11DigitPhone);
  
  const isCardFormat = (hasIndexMarker && (hasFNs || hasFather || hasCardFormatNames)) || 
                     (has6DigitID && has11DigitPhone);
  console.log('Is card format:', isCardFormat);
  
  // Now let's simulate the extraction
  console.log('\n=== EXTRACTION TEST ===');
  
  // Test card format extraction
  if (isCardFormat) {
    console.log('\n--- Using Card Format Extraction ---');
    
    // Split by "Index:"
    const parts = allText.split(/Index:/g);
    console.log('Found', parts.length - 1, 'potential student blocks');
    
    const students = [];
    for (let i = 1; i < Math.min(parts.length, 5); i++) {
      const part = parts[i];
      console.log(`\n--- Block ${i} (first 200 chars) ---`);
      console.log(part.substring(0, 200));
      
      // Extract index (first 6 digits)
      const indexMatch = part.match(/^(\d{6})/);
      const index = indexMatch ? indexMatch[1] : 'NOT FOUND';
      console.log('Index:', index);
      
      // Extract phone (11 digits)
      const phoneMatch = part.match(/(\d{11})/);
      const phone = phoneMatch ? phoneMatch[1] : 'NOT FOUND';
      console.log('Phone:', phone);
      
      // Extract roll
      const rollMatch = part.match(/Roll\s*:\s*(\d+)/);
      const roll = rollMatch ? rollMatch[1] : 'NOT FOUND';
      console.log('Roll:', roll);
      
      // Find name
      const nameMatch = part.match(/^\d{6}\s+([A-Za-z\s]+?)(?=\s+F\.N\.|\s+Roll\s*:|\s+M\.N\.)/i);
      const name = nameMatch ? nameMatch[1].trim() : 'NOT FOUND';
      console.log('Name:', name);
      
      // Find father's name
      const fatherMatch = part.match(/F\.N\.:\s*([^\s]+(?:\s+[^\s]+)*?)(?=\s+M\.N\.|\s+Roll\s*:|\s+DOB\s*:|\s+Adm\.|\s+\d{11})/i);
      const father = fatherMatch ? fatherMatch[1].trim() : 'NOT FOUND';
      console.log('Father:', father);
      
      // Find mother's name
      const motherMatch = part.match(/M\.N\.:\s*([^\s]+(?:\s+[^\s]+)*?)(?=\s+Roll\s*:|\s+DOB\s*:|\s+Adm\.|\s+\d{11})/i);
      const mother = motherMatch ? motherMatch[1].trim() : 'NOT FOUND';
      console.log('Mother:', mother);
      
      if (name && phone && name !== 'NOT FOUND' && phone !== 'NOT FOUND') {
        students.push({ name, father, mother, roll, index, phone });
      }
    }
    
    console.log('\n=== EXTRACTED STUDENTS ===');
    console.log(JSON.stringify(students, null, 2));
  }
}

analyzePDF().catch(console.error);
