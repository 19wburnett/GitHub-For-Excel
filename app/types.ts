export interface CellData {
  value: string | number | boolean | null
  formula?: string
  address: string
  row: number
  col: number
}

export interface SheetData {
  name: string
  data: CellData[][]
  maxRow: number
  maxCol: number
}

export interface ExcelData {
  fileName: string
  sheets: SheetData[]
  uploadedAt: string
}

// New type for upload response
export interface UploadResponse {
  fileId: string
  fileName: string
  sheetCount: number
  message: string
}

export interface CellDiff {
  address: string
  row: number
  col: number
  oldValue: string | number | boolean | null
  newValue: string | number | boolean | null
  oldFormula?: string
  newFormula?: string
  type: 'added' | 'removed' | 'changed'
}

export interface SheetDiff {
  sheetName: string
  addedCells: CellDiff[]
  removedCells: CellDiff[]
  changedCells: CellDiff[]
  totalChanges: number
}

export interface ComparisonResult {
  file1Name: string
  file2Name: string
  comparedAt: string
  sheets: SheetDiff[]
  totalChanges: number
  summary: {
    added: number
    removed: number
    changed: number
  }
}
