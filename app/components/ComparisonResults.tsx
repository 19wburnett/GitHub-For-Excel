'use client'

import { useState } from 'react'
import { ComparisonResult, SheetDiff, CellDiff } from '../types'

interface ComparisonResultsProps {
  result: ComparisonResult
}

export default function ComparisonResults({ result }: ComparisonResultsProps) {
  const [selectedSheet, setSelectedSheet] = useState<string>(result.sheets[0]?.sheetName || '')
  const [showFormulas, setShowFormulas] = useState(false)

  const selectedSheetData = result.sheets.find(sheet => sheet.sheetName === selectedSheet)

  const getCellClass = (cell: CellDiff) => {
    switch (cell.type) {
      case 'added':
        return 'diff-cell-added'
      case 'removed':
        return 'diff-cell-removed'
      case 'changed':
        return 'diff-cell-changed'
      default:
        return ''
    }
  }

  const formatCellValue = (value: string | number | boolean | null) => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
    return String(value)
  }

  const getColumnLetter = (colIndex: number) => {
    let result = ''
    while (colIndex >= 0) {
      result = String.fromCharCode(65 + (colIndex % 26)) + result
      colIndex = Math.floor(colIndex / 26) - 1
    }
    return result
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Comparison Results</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{result.summary.added}</div>
            <div className="text-sm text-gray-600">Added</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{result.summary.removed}</div>
            <div className="text-sm text-gray-600">Removed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{result.summary.changed}</div>
            <div className="text-sm text-gray-600">Changed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{result.totalChanges}</div>
            <div className="text-sm text-gray-600">Total Changes</div>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>File 1:</strong> {result.file1Name}</p>
          <p><strong>File 2:</strong> {result.file2Name}</p>
          <p><strong>Compared:</strong> {new Date(result.comparedAt).toLocaleString()}</p>
        </div>
      </div>

      {/* Sheet Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Sheet Comparison</h3>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showFormulas}
              onChange={(e) => setShowFormulas(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Show Formulas</span>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {result.sheets.map((sheet) => (
            <button
              key={sheet.sheetName}
              onClick={() => setSelectedSheet(sheet.sheetName)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedSheet === sheet.sheetName
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {sheet.sheetName}
              <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                {sheet.totalChanges}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Sheet Details */}
      {selectedSheetData && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">
              {selectedSheet} - {selectedSheetData.totalChanges} changes
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cell
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Old Value
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    New Value
                  </th>
                  {showFormulas && (
                    <>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Old Formula
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        New Formula
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[
                  ...selectedSheetData.addedCells.map(cell => ({ ...cell, type: 'added' as const })),
                  ...selectedSheetData.removedCells.map(cell => ({ ...cell, type: 'removed' as const })),
                  ...selectedSheetData.changedCells.map(cell => ({ ...cell, type: 'changed' as const }))
                ]
                  .sort((a, b) => {
                    // Sort by row first, then by column
                    if (a.row !== b.row) return a.row - b.row
                    return a.col - b.col
                  })
                  .map((cell, index) => (
                    <tr key={`${cell.address}-${index}`} className={getCellClass(cell)}>
                      <td className="px-3 py-2 text-sm font-mono text-gray-900">
                        {cell.address}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          cell.type === 'added' ? 'bg-green-100 text-green-800' :
                          cell.type === 'removed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {cell.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {cell.type === 'removed' || cell.type === 'changed' 
                          ? formatCellValue(cell.oldValue)
                          : '-'
                        }
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {cell.type === 'added' || cell.type === 'changed'
                          ? formatCellValue(cell.newValue)
                          : '-'
                        }
                      </td>
                      {showFormulas && (
                        <>
                          <td className="px-3 py-2 text-sm font-mono text-gray-600">
                            {cell.oldFormula || '-'}
                          </td>
                          <td className="px-3 py-2 text-sm font-mono text-gray-600">
                            {cell.newFormula || '-'}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {selectedSheetData.totalChanges === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">
              <p>No changes found in this sheet</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
