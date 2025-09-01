'use client'

import { useState, useMemo } from 'react'
import { ComparisonResult, CellDiff, SheetDiff } from '../types'

interface ComparisonResultsProps {
  result: ComparisonResult
  onReset?: () => void
}

export default function ComparisonResults({ result, onReset }: ComparisonResultsProps) {
  const [selectedSheet, setSelectedSheet] = useState<string>(result.sheets[0]?.sheetName || '')
  const [showFormulas, setShowFormulas] = useState(true)
  const [changeTypeFilter, setChangeTypeFilter] = useState<string>('all')
  const [formulaChangeFilter, setFormulaChangeFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<string>('address')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Get all cells from all sheets
  const allCells = useMemo(() => {
    const cells: (CellDiff & { sheetName: string })[] = []
    result.sheets.forEach(sheet => {
      if (sheet.addedCells) {
        sheet.addedCells.forEach(cell => cells.push({ ...cell, sheetName: sheet.sheetName }))
      }
      if (sheet.removedCells) {
        sheet.removedCells.forEach(cell => cells.push({ ...cell, sheetName: sheet.sheetName }))
      }
      if (sheet.changedCells) {
        sheet.changedCells.forEach(cell => cells.push({ ...cell, sheetName: sheet.sheetName }))
      }
    })
    return cells
  }, [result.sheets])

  // Filter cells based on selected sheet and filters
  const filteredCells = useMemo(() => {
    return allCells.filter(cell => {
      // Filter by sheet
      if (selectedSheet && cell.sheetName !== selectedSheet) return false
      
      // Filter by change type
      if (changeTypeFilter !== 'all' && cell.type !== changeTypeFilter) return false
      
      // Filter by formula changes
      if (formulaChangeFilter !== 'all') {
        const formulaChangeType = getFormulaChangeType(cell)
        if (formulaChangeType !== formulaChangeFilter) return false
      }
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesAddress = cell.address.toLowerCase().includes(searchLower)
        const matchesOldValue = String(cell.oldValue || '').toLowerCase().includes(searchLower)
        const matchesNewValue = String(cell.newValue || '').toLowerCase().includes(searchLower)
        const matchesOldFormula = (cell.oldFormula || '').toLowerCase().includes(searchLower)
        const matchesNewFormula = (cell.newFormula || '').toLowerCase().includes(searchLower)
        
        if (!matchesAddress && !matchesOldValue && !matchesNewValue && !matchesOldFormula && !matchesNewFormula) {
          return false
        }
      }
      
      return true
    })
  }, [allCells, selectedSheet, changeTypeFilter, formulaChangeFilter, searchTerm])

  // Sort filtered cells
  const sortedCells = useMemo(() => {
    return [...filteredCells].sort((a, b) => {
      let aValue: any
      let bValue: any
      
      switch (sortField) {
        case 'address':
          aValue = a.address
          bValue = b.address
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        case 'row':
          aValue = a.row
          bValue = b.row
          break
        case 'col':
          aValue = a.col
          bValue = b.col
          break
        case 'oldValue':
          aValue = a.oldValue
          bValue = b.oldValue
          break
        case 'newValue':
          aValue = a.newValue
          bValue = b.newValue
          break
        case 'oldFormula':
          aValue = a.oldFormula || ''
          bValue = b.oldFormula || ''
          break
        case 'newFormula':
          aValue = a.newFormula || ''
          bValue = b.newFormula || ''
          break
        default:
          aValue = a.address
          bValue = b.address
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredCells, sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) return '↕️'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  const hasFormulaChanges = (cell: CellDiff) => {
    if (cell.type === 'added') {
      return !!cell.newFormula
    }
    if (cell.type === 'removed') {
      return !!cell.oldFormula
    }
    if (cell.type === 'changed') {
      return cell.oldFormula !== cell.newFormula
    }
    return false
  }

  const getFormulaChangeType = (cell: CellDiff) => {
    if (!hasFormulaChanges(cell)) return 'none'
    if (cell.type === 'added') return 'formula-added'
    if (cell.type === 'removed') return 'formula-removed'
    if (cell.type === 'changed') {
      const oldFormula = cell.oldFormula || ''
      const newFormula = cell.newFormula || ''
      if (oldFormula && newFormula) {
        if (oldFormula.includes('=') && newFormula.includes('=')) {
          const oldRefs = oldFormula.match(/[A-Z]+\d+/g) || []
          const newRefs = newFormula.match(/[A-Z]+\d+/g) || []
          if (JSON.stringify(oldRefs.sort()) !== JSON.stringify(newRefs.sort())) {
            return 'reference-changed'
          }
          const oldFuncs = oldFormula.match(/[A-Z]+\(/g) || []
          const newFuncs = newFormula.match(/[A-Z]+\(/g) || []
          if (JSON.stringify(oldFuncs.sort()) !== JSON.stringify(newFuncs.sort())) {
            return 'function-changed'
          }
          return 'formula-modified'
        }
      }
      return 'formula-changed'
    }
    return 'none'
  }

  const getValueImpact = (cell: CellDiff) => {
    if (cell.type !== 'changed' || !cell.oldFormula || !cell.newFormula) return null
    const oldValue = cell.oldValue
    const newValue = cell.newValue
    if (oldValue === null || newValue === null) return null
    if (typeof oldValue === 'number' && typeof newValue === 'number') {
      if (oldValue === 0) return newValue === 0 ? 'no-change' : 'infinite-change'
      const percentChange = ((newValue - oldValue) / Math.abs(oldValue)) * 100
      if (Math.abs(percentChange) < 0.01) return 'minimal-change'
      if (percentChange > 0) return 'increased'
      if (percentChange < 0) return 'decreased'
    }
    if (oldValue !== newValue) return 'value-changed'
    return 'no-change'
  }

  const getValueImpactIcon = (impact: string | null) => {
    if (!impact) return ''
    switch (impact) {
      case 'increased': return '📈'
      case 'decreased': return '📉'
      case 'no-change': return '➡️'
      case 'minimal-change': return '➡️'
      case 'value-changed': return '🔄'
      case 'infinite-change': return '∞'
      default: return ''
    }
  }

  const getFormulaChangeIcon = (type: string) => {
    switch (type) {
      case 'formula-added': return '➕'
      case 'formula-removed': return '➖'
      case 'reference-changed': return '🔗'
      case 'function-changed': return '⚙️'
      case 'formula-modified': return '✏️'
      case 'formula-changed': return '🔄'
      default: return ''
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Comparison Results</h2>
        {onReset && (
          <button
            onClick={onReset}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            Compare Different Files
          </button>
        )}
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">File 1:</span> {result.file1Name}
          </div>
          <div>
            <span className="font-medium">File 2:</span> {result.file2Name}
          </div>
          <div>
            <span className="font-medium">Total Changes:</span> {result.totalChanges}
          </div>
          <div>
            <span className="font-medium">Compared:</span> {new Date(result.comparedAt).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Formula Changes Analysis */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg">
        <h3 className="font-semibold text-green-800 mb-2">Formula Changes Analysis</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Formula Added:</span> {allCells.filter(cell => getFormulaChangeType(cell) === 'formula-added').length}
          </div>
          <div>
            <span className="font-medium">Formula Removed:</span> {allCells.filter(cell => getFormulaChangeType(cell) === 'formula-removed').length}
          </div>
          <div>
            <span className="font-medium">Reference Changes:</span> {allCells.filter(cell => getFormulaChangeType(cell) === 'reference-changed').length}
          </div>
          <div>
            <span className="font-medium">Function Changes:</span> {allCells.filter(cell => getFormulaChangeType(cell) === 'function-changed').length}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sheet</label>
            <select
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sheets</option>
              {result.sheets.map(sheet => (
                <option key={sheet.sheetName} value={sheet.sheetName}>
                  {sheet.sheetName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Change Type</label>
            <select
              value={changeTypeFilter}
              onChange={(e) => setChangeTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Changes</option>
              <option value="added">Added</option>
              <option value="removed">Removed</option>
              <option value="changed">Changed</option>
            </select>
          </div>

          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Formula Changes</label>
            <select
              value={formulaChangeFilter}
              onChange={(e) => setFormulaChangeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="none">No Formula Changes</option>
              <option value="formula-added">Formula Added</option>
              <option value="formula-removed">Formula Removed</option>
              <option value="reference-changed">Reference Changed</option>
              <option value="function-changed">Function Changed</option>
              <option value="formula-modified">Formula Modified</option>
              <option value="formula-changed">Formula Changed</option>
            </select>
          </div>
        </div>

        <div className="flex-1 min-w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search by address, value, or formula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showFormulas}
              onChange={(e) => setShowFormulas(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Show Formulas</span>
          </label>
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('address')}
              >
                Cell {getSortIcon('address')}
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('type')}
              >
                Type {getSortIcon('type')}
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('row')}
              >
                Row {getSortIcon('row')}
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('col')}
              >
                Col {getSortIcon('col')}
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('oldValue')}
              >
                Old Value {getSortIcon('oldValue')}
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('newValue')}
              >
                New Value {getSortIcon('newValue')}
              </th>
              {showFormulas && (
                <>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('oldFormula')}
                  >
                    Old Formula {getSortIcon('oldFormula')}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('newFormula')}
                  >
                    New Formula {getSortIcon('newFormula')}
                  </th>
                </>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Formula Changes
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value Impact
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedCells.map((cell, index) => (
              <tr key={`${cell.sheetName}-${cell.address}-${index}`} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono text-gray-900">
                  {cell.address}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    cell.type === 'added' ? 'bg-green-100 text-green-800' :
                    cell.type === 'removed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {cell.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{cell.row}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{cell.col}</td>
                <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                  {cell.oldValue !== null ? String(cell.oldValue) : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                  {cell.newValue !== null ? String(cell.newValue) : '-'}
                </td>
                {showFormulas && (
                  <>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate font-mono">
                      {cell.oldFormula || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate font-mono">
                      {cell.newFormula || '-'}
                    </td>
                  </>
                )}
                <td className="px-4 py-3 text-sm">
                  {(() => {
                    const formulaChangeType = getFormulaChangeType(cell)
                    if (formulaChangeType === 'none') return '-'
                    return (
                      <span className="inline-flex items-center space-x-1">
                        <span>{getFormulaChangeIcon(formulaChangeType)}</span>
                        <span className="text-xs">{formulaChangeType.replace('-', ' ')}</span>
                      </span>
                    )
                  })()}
                </td>
                <td className="px-4 py-3 text-sm">
                  {(() => {
                    const impact = getValueImpact(cell)
                    if (!impact) return '-'
                    return (
                      <span className="inline-flex items-center space-x-1">
                        <span>{getValueImpactIcon(impact)}</span>
                        <span className="text-xs">{impact.replace('-', ' ')}</span>
                      </span>
                    )
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedCells.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No changes found matching the current filters.
        </div>
      )}
    </div>
  )
}
