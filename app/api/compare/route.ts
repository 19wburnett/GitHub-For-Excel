import { NextRequest, NextResponse } from 'next/server'
import { ExcelData, ComparisonResult, SheetDiff, CellDiff, SheetData } from '../../types'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

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
    const { file1Id, file2Id } = await request.json()

    if (!file1Id || !file2Id) {
      return NextResponse.json({ error: 'Both file IDs are required' }, { status: 400 })
    }

    // Retrieve files from Supabase
    const { data: file1Data, error: file1Error } = await supabase.storage
      .from('excel-files')
      .download(file1Id)

    if (file1Error) {
      console.error('Supabase download error for file1:', file1Error)
      return NextResponse.json({ error: 'Failed to retrieve file 1 from storage' }, { status: 500 })
    }

    const { data: file2Data, error: file2Error } = await supabase.storage
      .from('excel-files')
      .download(file2Id)

    if (file2Error) {
      console.error('Supabase download error for file2:', file2Error)
      return NextResponse.json({ error: 'Failed to retrieve file 2 from storage' }, { status: 500 })
    }

    // Process files
    const file1Buffer = Buffer.from(await file1Data.arrayBuffer())
    const file2Buffer = Buffer.from(await file2Data.arrayBuffer())

    const file1 = parseExcelFile(file1Buffer, 'File 1')
    const file2 = parseExcelFile(file2Buffer, 'File 2')

    const result = compareExcelFiles(file1, file2)
    return NextResponse.json(result)

  } catch (error) {
    console.error('Error comparing files:', error)
    return NextResponse.json(
      { error: 'Failed to compare files' },
      { status: 500 }
    )
  }
}

function parseExcelFile(buffer: Buffer, fileName: string): ExcelData {
  const workbook = XLSX.read(buffer, { 
    type: 'buffer',
    cellFormula: true,
    cellDates: true,
    cellNF: false,
    cellStyles: false
  })

  const sheets: SheetData[] = []

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: null,
      raw: false
    })

    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    const maxRow = range.e.r
    const maxCol = range.e.c

    const structuredData: any[][] = []
    for (let row = 0; row <= maxRow; row++) {
      const rowData: any[] = []
      for (let col = 0; col <= maxCol; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
        const cell = worksheet[cellAddress]
        let cellData: any = {
          value: null,
          address: cellAddress,
          row: row + 1,
          col: col + 1
        }

        if (cell) {
          if (cell.t === 'f' && cell.f) {
            cellData.formula = cell.f
            cellData.value = cell.v !== undefined ? cell.v : null
          } else if (cell.f) {
            cellData.formula = cell.f
            cellData.value = cell.v !== undefined ? cell.v : null
          } else if (cell.t === 'd') {
            cellData.value = cell.v instanceof Date ? cell.v.toISOString() : cell.v
          } else if (cell.t === 'b') {
            cellData.value = cell.v
          } else if (cell.t === 'n') {
            cellData.value = cell.v
          } else if (cell.t === 's') {
            cellData.value = cell.v
          } else if (cell.t === 'e') {
            cellData.value = `#ERROR: ${cell.v}`
          } else {
            if (cell.f) {
              cellData.formula = cell.f
            }
            cellData.value = cell.v
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

  return {
    fileName,
    sheets,
    uploadedAt: new Date().toISOString()
  }
}

function compareExcelFiles(file1: ExcelData, file2: ExcelData): ComparisonResult {
  const sheets: SheetDiff[] = []
  let totalAdded = 0
  let totalRemoved = 0
  let totalChanged = 0

  // Get all unique sheet names
  const allSheetNames = new Set([
    ...file1.sheets.map(s => s.name),
    ...file2.sheets.map(s => s.name)
  ])

  // Convert Set to Array for better compatibility
  const sheetNamesArray = Array.from(allSheetNames)

  for (const sheetName of sheetNamesArray) {
    const sheet1 = file1.sheets.find(s => s.name === sheetName)
    const sheet2 = file2.sheets.find(s => s.name === sheetName)

    const sheetDiff = compareSheet(sheet1, sheet2, sheetName)
    sheets.push(sheetDiff)

    totalAdded += sheetDiff.addedCells.length
    totalRemoved += sheetDiff.removedCells.length
    totalChanged += sheetDiff.changedCells.length
  }

  return {
    file1Name: file1.fileName,
    file2Name: file2.fileName,
    comparedAt: new Date().toISOString(),
    sheets,
    totalChanges: totalAdded + totalRemoved + totalChanged,
    summary: {
      added: totalAdded,
      removed: totalRemoved,
      changed: totalChanged
    }
  }
}

function compareSheet(sheet1: SheetData | undefined, sheet2: SheetData | undefined, sheetName: string): SheetDiff {
  const addedCells: CellDiff[] = []
  const removedCells: CellDiff[] = []
  const changedCells: CellDiff[] = []

  if (!sheet1 && !sheet2) {
    return {
      sheetName,
      addedCells: [],
      removedCells: [],
      changedCells: [],
      totalChanges: 0
    }
  }

  if (!sheet1) {
    // Sheet exists only in file2 - all cells are added
    if (sheet2) {
      for (let row = 0; row < sheet2.maxRow; row++) {
        for (let col = 0; col < sheet2.maxCol; col++) {
          const cell = sheet2.data[row]?.[col]
          if (cell && (cell.value !== null || cell.formula)) {
            addedCells.push({
              address: cell.address,
              row: cell.row,
              col: cell.col,
              oldValue: null,
              newValue: cell.value,
              newFormula: cell.formula,
              type: 'added'
            })
          }
        }
      }
    }
  } else if (!sheet2) {
    // Sheet exists only in file1 - all cells are removed
    for (let row = 0; row < sheet1.maxRow; row++) {
      for (let col = 0; col < sheet1.maxCol; col++) {
        const cell = sheet1.data[row]?.[col]
        if (cell && (cell.value !== null || cell.formula)) {
          removedCells.push({
            address: cell.address,
            row: cell.row,
            col: cell.col,
            oldValue: cell.value,
            newValue: null,
            oldFormula: cell.formula,
            type: 'removed'
          })
        }
      }
    }
  } else {
    // Both sheets exist - compare cell by cell
    const maxRows = Math.max(sheet1.maxRow, sheet2.maxRow)
    const maxCols = Math.max(sheet1.maxCol, sheet2.maxCol)

    for (let row = 0; row < maxRows; row++) {
      for (let col = 0; col < maxCols; col++) {
        const cell1 = sheet1.data[row]?.[col]
        const cell2 = sheet2.data[row]?.[col]

        const address = getCellAddress(row, col)

        if (!cell1 && cell2 && (cell2.value !== null || cell2.formula)) {
          // Cell exists only in file2
          addedCells.push({
            address,
            row: row + 1,
            col: col + 1,
            oldValue: null,
            newValue: cell2.value,
            newFormula: cell2.formula,
            type: 'added'
          })
        } else if (cell1 && !cell2 && (cell1.value !== null || cell1.formula)) {
          // Cell exists only in file1
          removedCells.push({
            address,
            row: row + 1,
            col: col + 1,
            oldValue: cell1.value,
            newValue: null,
            oldFormula: cell1.formula,
            type: 'removed'
          })
        } else if (cell1 && cell2) {
          // Both cells exist - check for changes
          const valueChanged = !isEqual(cell1.value, cell2.value)
          const formulaChanged = !isEqual(cell1.formula, cell2.formula)

          if (valueChanged || formulaChanged) {
            changedCells.push({
              address,
              row: row + 1,
              col: col + 1,
              oldValue: cell1.value,
              newValue: cell2.value,
              oldFormula: cell1.formula,
              newFormula: cell2.formula,
              type: 'changed'
            })
          }
        }
      }
    }
  }

  return {
    sheetName,
    addedCells,
    removedCells,
    changedCells,
    totalChanges: addedCells.length + removedCells.length + changedCells.length
  }
}

function getCellAddress(row: number, col: number): string {
  let colStr = ''
  while (col >= 0) {
    colStr = String.fromCharCode(65 + (col % 26)) + colStr
    col = Math.floor(col / 26) - 1
  }
  return `${colStr}${row + 1}`
}

function isEqual(a: any, b: any): boolean {
  if (a === b) return true
  if (a == null && b == null) return true
  if (a == null || b == null) return false

  // Handle date comparisons
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime()
  }

  // Handle string comparisons (case-insensitive for Excel)
  if (typeof a === 'string' && typeof b === 'string') {
    const normalizeFormula = (formula: string) => {
      return formula
        .replace(/\s+/g, ' ') // Normalize whitespace
        .toLowerCase() // Case insensitive
        .trim()
    }

    // Check if both might be formulas (start with =)
    if (a.startsWith('=') || b.startsWith('=')) {
      return normalizeFormula(a) === normalizeFormula(b)
    }

    return a.toLowerCase() === b.toLowerCase()
  }

  return false
}
