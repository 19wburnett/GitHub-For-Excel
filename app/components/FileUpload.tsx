'use client'

import { useState } from 'react'
import { ExcelData, SheetData, CellData } from '../types'
import * as XLSX from 'xlsx'

interface FileUploadProps {
  onFilesProcessed: (file1: ExcelData, file2: ExcelData) => void
}

export default function FileUpload({ onFilesProcessed }: FileUploadProps) {
  const [file1, setFile1] = useState<File | null>(null)
  const [file2, setFile2] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processExcelFile = async (file: File): Promise<ExcelData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { 
            type: 'array',
            cellFormula: true,
            cellDates: true,
            cellNF: false,
            cellStyles: false
          })

          const sheets: SheetData[] = []

          for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName]
            
            // Convert sheet to JSON with options to preserve structure
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
              header: 1,
              defval: null,
              raw: false
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
                  row: row + 1,
                  col: col + 1
                }

                if (cell) {
                  if (cell.t === 'f' && cell.f) {
                    // Formula cell
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

          resolve(excelData)
        } catch (err) {
          reject(new Error(`Failed to process ${file.name}: ${err}`))
        }
      }

      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))
      reader.readAsArrayBuffer(file)
    })
  }

  const handleCompare = async () => {
    if (!file1 || !file2) {
      setError('Please select both files')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const [processedFile1, processedFile2] = await Promise.all([
        processExcelFile(file1),
        processExcelFile(file2)
      ])

      onFilesProcessed(processedFile1, processedFile2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process files')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload Excel Files</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Excel File
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile1(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {file1 && (
            <p className="mt-1 text-sm text-gray-600">Selected: {file1.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Second Excel File
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile2(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {file2 && (
            <p className="mt-1 text-sm text-gray-600">Selected: {file2.name}</p>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <button
          onClick={handleCompare}
          disabled={!file1 || !file2 || isProcessing}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? 'Processing...' : 'Compare Files'}
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>• Files are processed locally in your browser</p>
        <p>• No files are uploaded to any server</p>
        <p>• Supports .xlsx and .xls formats</p>
      </div>
    </div>
  )
}
