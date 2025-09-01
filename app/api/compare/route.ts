import { NextRequest, NextResponse } from 'next/server'
import { ExcelData, ComparisonResult, SheetDiff, CellDiff, SheetData } from '../../types'

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
    // Check content length to prevent memory issues
    const contentLength = request.headers.get('content-length')
    console.log('Request content length:', contentLength)
    
    // Increase the limit to 50MB to match Vercel config
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) { // 50MB limit
      console.log('File size too large:', parseInt(contentLength))
      return NextResponse.json(
        { error: 'File size too large. Please upload files smaller than 50MB.' },
        { status: 413 }
      )
    }

    console.log('Parsing request body...')
    const body = await request.json()
    console.log('Request body parsed successfully')
    
    const { file1, file2 } = body

    if (!file1 || !file2) {
      console.log('Missing file data:', { hasFile1: !!file1, hasFile2: !!file2 })
      return NextResponse.json(
        { error: 'Both files are required for comparison' },
        { status: 400 }
      )
    }

    // Validate file structure
    if (!file1.sheets || !Array.isArray(file1.sheets)) {
      console.log('Invalid file1 structure:', file1)
      return NextResponse.json(
        { error: 'Invalid file1 structure' },
        { status: 400 }
      )
    }

    if (!file2.sheets || !Array.isArray(file2.sheets)) {
      console.log('Invalid file2 structure:', file2)
      return NextResponse.json(
        { error: 'Invalid file2 structure' },
        { status: 400 }
      )
    }

    console.log('Starting comparison...')
    console.log(`File 1: ${file1.fileName}, Sheets: ${file1.sheets.length}`)
    console.log(`File 2: ${file2.fileName}, Sheets: ${file2.sheets.length}`)
    
    // Log sheet sizes to identify potential memory issues
    file1.sheets.forEach((sheet: any, index: number) => {
      console.log(`File1 Sheet ${index}: ${sheet.name}, Rows: ${sheet.maxRow}, Cols: ${sheet.maxCol}`)
    })
    
    file2.sheets.forEach((sheet: any, index: number) => {
      console.log(`File2 Sheet ${index}: ${sheet.name}, Rows: ${sheet.maxRow}, Cols: ${sheet.maxCol}`)
    })

    const result = compareExcelFiles(file1, file2)
    console.log('Comparison completed successfully')
    console.log(`Total changes: ${result.totalChanges}`)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Comparison error:', error)
    
    // Provide more specific error information
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON data received' },
        { status: 400 }
      )
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Comparison failed: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to compare files. Please try again.' },
      { status: 500 }
    )
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
    // Sheet exists only in file2 (added)
    if (sheet2) {
      // Add all cells from sheet2 as added
      for (let row = 0; row < sheet2.data.length; row++) {
        for (let col = 0; col < sheet2.data[row].length; col++) {
          const cell = sheet2.data[row][col]
          if (cell.value !== null || cell.formula) {
            addedCells.push({
              address: cell.address,
              row: cell.row,
              col: cell.col,
              oldValue: null,
              newValue: cell.value,
              oldFormula: undefined,
              newFormula: cell.formula,
              type: 'added'
            })
          }
        }
      }
    }
    return {
      sheetName,
      addedCells,
      removedCells: [],
      changedCells: [],
      totalChanges: addedCells.length
    }
  }

  if (!sheet2) {
    // Sheet exists only in file1 (removed)
    // Add all cells from sheet1 as removed
    for (let row = 0; row < sheet1.data.length; row++) {
      for (let col = 0; col < sheet1.data[row].length; col++) {
        const cell = sheet1.data[row][col]
        if (cell.value !== null || cell.formula) {
          removedCells.push({
            address: cell.address,
            row: cell.row,
            col: cell.col,
            oldValue: cell.value,
            newValue: null,
            oldFormula: cell.formula,
            newFormula: undefined,
            type: 'removed'
          })
        }
      }
    }
    return {
      sheetName,
      addedCells: [],
      removedCells,
      changedCells: [],
      totalChanges: removedCells.length
    }
  }

  // Both sheets exist, compare them cell by cell
  const maxRow = Math.max(sheet1.maxRow, sheet2.maxRow)
  const maxCol = Math.max(sheet1.maxCol, sheet2.maxCol)

  for (let row = 0; row < maxRow; row++) {
    for (let col = 0; col < maxCol; col++) {
      const cell1 = sheet1.data[row]?.[col]
      const cell2 = sheet2.data[row]?.[col]

      if (!cell1 && !cell2) continue

      if (!cell1) {
        // Cell exists only in sheet2 (added)
        if (cell2 && (cell2.value !== null || cell2.formula)) {
          addedCells.push({
            address: cell2.address,
            row: cell2.row,
            col: cell2.col,
            oldValue: null,
            newValue: cell2.value,
            oldFormula: undefined,
            newFormula: cell2.formula,
            type: 'added'
          })
        }
      } else if (!cell2) {
        // Cell exists only in sheet1 (removed)
        if (cell1.value !== null || cell1.formula) {
          removedCells.push({
            address: cell1.address,
            row: cell1.row,
            col: cell1.col,
            oldValue: cell1.value,
            newValue: null,
            oldFormula: cell1.formula,
            newFormula: undefined,
            type: 'removed'
          })
        }
      } else {
        // Both cells exist, compare them
        if (!isEqual(cell1.value, cell2.value) || !isEqual(cell1.formula, cell2.formula)) {
          changedCells.push({
            address: cell1.address,
            row: cell1.row,
            col: cell1.col,
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

  return {
    sheetName,
    addedCells,
    removedCells,
    changedCells,
    totalChanges: addedCells.length + removedCells.length + changedCells.length
  }
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
