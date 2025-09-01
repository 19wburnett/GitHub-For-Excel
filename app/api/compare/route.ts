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
    const { file1, file2 } = await request.json()

    if (!file1 || !file2) {
      return NextResponse.json({ error: 'Both files are required' }, { status: 400 })
    }

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
