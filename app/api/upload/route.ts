import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { ExcelData, SheetData, CellData } from '../../types'

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json({ error: 'Invalid file type. Please upload an Excel file.' }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Parse Excel file
    const workbook = XLSX.read(buffer, { 
      type: 'buffer',
      cellFormula: true, // Include formulas
      cellDates: true,   // Parse dates
      cellNF: false,     // Don't include number formats
      cellStyles: false  // Don't include cell styles
    })

    const sheets: SheetData[] = []

    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName]
      
      // Convert sheet to JSON with options to preserve structure
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, // Use array format to preserve row/column structure
        defval: null, // Default value for empty cells
        raw: false // Convert values to appropriate types
      })

      // Get sheet dimensions
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      const maxRow = range.e.r
      const maxCol = range.e.c

      // Convert to structured format
      const structuredData: CellData[][] = []
      
      for (let row = 0; row <= maxRow; row++) {
        const rowData: CellData[] = []
        for (let col = 0; col <= maxCol; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
          const cell = worksheet[cellAddress]
          
          let cellData: CellData = {
            value: null,
            address: cellAddress,
            row: row + 1, // Excel rows are 1-indexed
            col: col + 1  // Excel cols are 1-indexed
          }

          if (cell) {
            // Handle different cell types
            if (cell.t === 'f' && cell.f) {
              // Formula cell - primary case
              cellData.formula = cell.f
              cellData.value = cell.v !== undefined ? cell.v : null
            } else if (cell.f) {
              // Cell has formula but might not be marked as type 'f'
              cellData.formula = cell.f
              cellData.value = cell.v !== undefined ? cell.v : null
            } else if (cell.t === 'd') {
              // Date cell
              cellData.value = cell.v instanceof Date ? cell.v.toISOString() : cell.v
            } else if (cell.t === 'b') {
              // Boolean cell
              cellData.value = cell.v
            } else if (cell.t === 'n') {
              // Number cell
              cellData.value = cell.v
            } else if (cell.t === 's') {
              // String cell
              cellData.value = cell.v
            } else if (cell.t === 'e') {
              // Error cell
              cellData.value = `#ERROR: ${cell.v}`
            } else {
              // Default case - check if it might have a formula
              if (cell.f) {
                cellData.formula = cell.f
              }
              cellData.value = cell.v
            }
            
            // Debug logging for formula cells
            if (cellData.formula) {
              console.log(`Found formula in ${cellAddress}:`, {
                formula: cellData.formula,
                value: cellData.value,
                cellType: cell.t,
                hasFormula: !!cell.f
              })
            }
          }

          rowData.push(cellData)
        }
        structuredData.push(rowData)
      }

      sheets.push({
        name: sheetName,
        data: structuredData,
        maxRow: maxRow + 1,
        maxCol: maxCol + 1
      })
    }

    const excelData: ExcelData = {
      fileName: file.name,
      sheets: sheets,
      uploadedAt: new Date().toISOString()
    }

    return NextResponse.json(excelData)

  } catch (error) {
    console.error('Error processing Excel file:', error)
    return NextResponse.json(
      { error: 'Failed to process Excel file. Please ensure the file is valid.' },
      { status: 500 }
    )
  }
}
