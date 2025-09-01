'use client'

import { useState, useMemo } from 'react'
import { ComparisonResult, SheetDiff, CellDiff } from '../types'

interface ComparisonResultsProps {
  result: ComparisonResult
}

type SortField = 'address' | 'type' | 'row' | 'col' | 'oldValue' | 'newValue'
type SortDirection = 'asc' | 'desc'
type ChangeType = 'added' | 'removed' | 'changed' | 'all'

export default function ComparisonResults({ result }: ComparisonResultsProps) {
  const [selectedSheet, setSelectedSheet] = useState<string>(result.sheets[0]?.sheetName || '')
  const [showFormulas, setShowFormulas] = useState(true) // Always show formulas by default
  
  // Filtering state
  const [changeTypeFilter, setChangeTypeFilter] = useState<ChangeType>('all')
  const [formulaChangeFilter, setFormulaChangeFilter] = useState<'all' | 'formula-changed' | 'formula-unchanged'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('address')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const selectedSheetData = result.sheets.find(sheet => sheet.sheetName === selectedSheet)

  const hasFormulaChanges = (cell: CellDiff) => {
    // Check if formulas actually changed (not just if they exist)
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

  // Enhanced formula analysis - detect meaningful formula changes
  const getFormulaChangeType = (cell: CellDiff) => {
    if (!hasFormulaChanges(cell)) return 'none'
    
    if (cell.type === 'added') return 'formula-added'
    if (cell.type === 'removed') return 'formula-removed'
    
    // For changed cells, analyze the type of change
    if (cell.type === 'changed') {
      const oldFormula = cell.oldFormula || ''
      const newFormula = cell.newFormula || ''
      
      if (oldFormula && newFormula) {
        // Check if it's a reference change, function change, or value change
        if (oldFormula.includes('=') && newFormula.includes('=')) {
          // Both are formulas - check for significant changes
          const oldRefs = oldFormula.match(/[A-Z]+\d+/g) || []
          const newRefs = newFormula.match(/[A-Z]+\d+/g) || []
          
          if (JSON.stringify(oldRefs.sort()) !== JSON.stringify(newRefs.sort())) {
            return 'reference-changed'
          }
          
          // Check for function changes
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

  // Calculate the impact of formula changes on values
  const getValueImpact = (cell: CellDiff) => {
    if (cell.type !== 'changed' || !cell.oldFormula || !cell.newFormula) return null
    
    const oldValue = cell.oldValue
    const newValue = cell.newValue
    
    if (oldValue === null || newValue === null) return null
    
    // Try to calculate percentage change for numeric values
    if (typeof oldValue === 'number' && typeof newValue === 'number') {
      if (oldValue === 0) return newValue === 0 ? 'no-change' : 'infinite-change'
      
      const percentChange = ((newValue - oldValue) / Math.abs(oldValue)) * 100
      if (Math.abs(percentChange) < 0.01) return 'minimal-change'
      if (percentChange > 0) return 'increased'
      if (percentChange < 0) return 'decreased'
    }
    
    // For non-numeric or mixed types, check if values are different
    if (oldValue !== newValue) return 'value-changed'
    
    return 'no-change'
  }

  // Get all cells for the selected sheet with their types
  const allCells = useMemo(() => {
    if (!selectedSheetData) return []
    
    return [
      ...selectedSheetData.addedCells.map(cell => ({ ...cell, type: 'added' as const })),
      ...selectedSheetData.removedCells.map(cell => ({ ...cell, type: 'removed' as const })),
      ...selectedSheetData.changedCells.map(cell => ({ ...cell, type: 'changed' as const }))
    ]
  }, [selectedSheetData])

  // Apply filters and search
  const filteredCells = useMemo(() => {
    if (!allCells.length) return []

    return allCells.filter(cell => {
      // Filter by change type
      if (changeTypeFilter !== 'all' && cell.type !== changeTypeFilter) {
        return false
      }

      // Filter by formula changes
      if (formulaChangeFilter !== 'all') {
        const hasFormulaChange = hasFormulaChanges(cell)
        if (formulaChangeFilter === 'formula-changed' && !hasFormulaChange) {
          return false
        }
        if (formulaChangeFilter === 'formula-unchanged' && hasFormulaChange) {
          return false
        }
      }

      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const addressMatch = cell.address.toLowerCase().includes(searchLower)
        const oldValueMatch = String(cell.oldValue || '').toLowerCase().includes(searchLower)
        const newValueMatch = String(cell.newValue || '').toLowerCase().includes(searchLower)
        const oldFormulaMatch = (cell.oldFormula || '').toLowerCase().includes(searchLower)
        const newFormulaMatch = (cell.newFormula || '').toLowerCase().includes(searchLower)
        
        if (!addressMatch && !oldValueMatch && !newValueMatch && !oldFormulaMatch && !newFormulaMatch) {
          return false
        }
      }

      return true
    })
  }, [allCells, changeTypeFilter, formulaChangeFilter, searchTerm])

  // Apply sorting
  const sortedCells = useMemo(() => {
    if (!filteredCells.length) return []

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
          aValue = String(a.oldValue || '')
          bValue = String(b.oldValue || '')
          break
        case 'newValue':
          aValue = String(a.newValue || '')
          bValue = String(b.newValue || '')
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

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

  // Calculate enhanced formula change statistics
  const formulaStats = useMemo(() => {
    if (!allCells.length) return { 
      total: 0, 
      changed: 0, 
      added: 0, 
      removed: 0,
      referenceChanged: 0,
      functionChanged: 0,
      valueImpact: { increased: 0, decreased: 0, noChange: 0 }
    }
    
    let total = 0
    let changed = 0
    let added = 0
    let removed = 0
    let referenceChanged = 0
    let functionChanged = 0
    const valueImpact = { increased: 0, decreased: 0, noChange: 0 }
    
    allCells.forEach(cell => {
      if (cell.oldFormula || cell.newFormula) {
        total++
        const changeType = getFormulaChangeType(cell)
        const impact = getValueImpact(cell)
        
        if (cell.type === 'added' && cell.newFormula) added++
        else if (cell.type === 'removed' && cell.oldFormula) removed++
        else if (cell.type === 'changed' && changeType !== 'none') {
          changed++
          if (changeType === 'reference-changed') referenceChanged++
          if (changeType === 'function-changed') functionChanged++
        }
        
        if (impact) {
          if (impact === 'increased') valueImpact.increased++
          else if (impact === 'decreased') valueImpact.decreased++
          else if (impact === 'no-change') valueImpact.noChange++
        }
      }
    })
    
    return { 
      total, 
      changed, 
      added, 
      removed, 
      referenceChanged, 
      functionChanged, 
      valueImpact 
    }
  }, [allCells])

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
            
            {/* Enhanced Formula Statistics */}
            {showFormulas && formulaStats.total > 0 && (
              <div className="mt-3 p-4 bg-blue-50 rounded-lg">
                <h5 className="text-sm font-medium text-blue-900 mb-3">Formula Changes Analysis</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-blue-800">
                  <div>
                    <div className="font-semibold">Total Formulas</div>
                    <div className="text-lg">{formulaStats.total}</div>
                  </div>
                  <div>
                    <div className="font-semibold">Changed</div>
                    <div className="text-lg">{formulaStats.changed}</div>
                  </div>
                  <div>
                    <div className="font-semibold">Added</div>
                    <div className="text-lg">{formulaStats.added}</div>
                  </div>
                  <div>
                    <div className="font-semibold">Removed</div>
                    <div className="text-lg">{formulaStats.removed}</div>
                  </div>
                </div>
                
                {formulaStats.referenceChanged > 0 || formulaStats.functionChanged > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="text-xs font-medium text-blue-700 mb-2">Change Types:</div>
                    <div className="flex space-x-4 text-xs text-blue-600">
                      {formulaStats.referenceChanged > 0 && (
                        <span>🔗 References: {formulaStats.referenceChanged}</span>
                      )}
                      {formulaStats.functionChanged > 0 && (
                        <span>⚙️ Functions: {formulaStats.functionChanged}</span>
                      )}
                    </div>
                  </div>
                )}
                
                {formulaStats.valueImpact.increased > 0 || formulaStats.valueImpact.decreased > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="text-xs font-medium text-blue-700 mb-2">Value Impact:</div>
                    <div className="flex space-x-4 text-xs text-blue-600">
                      {formulaStats.valueImpact.increased > 0 && (
                        <span>📈 Increased: {formulaStats.valueImpact.increased}</span>
                      )}
                      {formulaStats.valueImpact.decreased > 0 && (
                        <span>📉 Decreased: {formulaStats.valueImpact.decreased}</span>
                      )}
                      {formulaStats.valueImpact.noChange > 0 && (
                        <span>➡️ No Change: {formulaStats.valueImpact.noChange}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Filters and Search */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Change Type Filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Change Type:</label>
                <select
                  value={changeTypeFilter}
                  onChange={(e) => setChangeTypeFilter(e.target.value as ChangeType)}
                  className="filter-control"
                >
                  <option value="all">All Changes</option>
                  <option value="added">Added Only</option>
                  <option value="removed">Removed Only</option>
                  <option value="changed">Changed Only</option>
                </select>
              </div>

              {/* Formula Change Filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Formula Changes:</label>
                <select
                  value={formulaChangeFilter}
                  onChange={(e) => setFormulaChangeFilter(e.target.value as any)}
                  className="filter-control"
                >
                  <option value="all">All Changes</option>
                  <option value="formula-changed">Formula Changed</option>
                  <option value="formula-unchanged">Formula Unchanged</option>
                </select>
              </div>

              {/* Search */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Search:</label>
                <input
                  type="text"
                  placeholder="Search cells, values, formulas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input w-64"
                />
              </div>

              {/* Results Count */}
              <div className="text-sm text-gray-600">
                Showing {filteredCells.length} of {allCells.length} changes
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    { field: 'address', label: 'Cell' },
                    { field: 'type', label: 'Type' },
                    { field: 'row', label: 'Row' },
                    { field: 'col', label: 'Col' },
                    { field: 'oldValue', label: 'Old Value' },
                    { field: 'newValue', label: 'New Value' },
                    ...(showFormulas ? [
                      { field: 'oldFormula', label: 'Old Formula' },
                      { field: 'newFormula', label: 'New Formula' }
                    ] : [])
                  ].map(({ field, label }) => (
                    <th 
                      key={field}
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sortable-header"
                      onClick={() => handleSort(field as SortField)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{label}</span>
                        <span className="text-gray-400">{getSortIcon(field as SortField)}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedCells.map((cell, index) => {
                  const formulaChangeType = getFormulaChangeType(cell)
                  const valueImpact = getValueImpact(cell)
                  
                  return (
                    <tr key={`${cell.address}-${index}`} className={`${getCellClass(cell)} hover:bg-gray-50`}>
                      <td className="px-3 py-2 text-sm font-mono text-gray-900">
                        {cell.address}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <div className="space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            cell.type === 'added' ? 'bg-green-100 text-green-800' :
                            cell.type === 'removed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {cell.type}
                          </span>
                          {formulaChangeType !== 'none' && (
                            <div className="text-xs text-gray-600">
                              {formulaChangeType === 'reference-changed' && '🔗 Ref Changed'}
                              {formulaChangeType === 'function-changed' && '⚙️ Func Changed'}
                              {formulaChangeType === 'formula-modified' && '📝 Modified'}
                              {formulaChangeType === 'formula-added' && '➕ Added'}
                              {formulaChangeType === 'formula-removed' && '➖ Removed'}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {cell.row}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {getColumnLetter(cell.col)}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        <div className="space-y-1">
                          <div>{cell.type === 'removed' || cell.type === 'changed' 
                            ? formatCellValue(cell.oldValue)
                            : '-'
                          }</div>
                          {valueImpact && (
                            <div className="text-xs text-gray-500">
                              {valueImpact === 'increased' && '📈'}
                              {valueImpact === 'decreased' && '📉'}
                              {valueImpact === 'no-change' && '➡️'}
                              {valueImpact === 'minimal-change' && '➡️'}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        <div className="space-y-1">
                          <div>{cell.type === 'added' || cell.type === 'changed'
                            ? formatCellValue(cell.newValue)
                            : '-'
                          }</div>
                          {valueImpact && (
                            <div className="text-xs text-gray-500">
                              {valueImpact === 'increased' && '📈'}
                              {valueImpact === 'decreased' && '📉'}
                              {valueImpact === 'no-change' && '➡️'}
                              {valueImpact === 'minimal-change' && '➡️'}
                            </div>
                          )}
                        </div>
                      </td>
                      {showFormulas && (
                        <>
                          <td className="px-3 py-2 text-sm font-mono text-gray-600">
                            <div className="space-y-1">
                              <div className="text-xs text-gray-500">Old:</div>
                              <div className="bg-gray-100 p-1 rounded text-xs">
                                {cell.oldFormula || '-'}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-sm font-mono text-gray-600">
                            <div className="space-y-1">
                              <div className="text-xs text-gray-500">New:</div>
                              <div className="bg-gray-100 p-1 rounded text-xs">
                                {cell.newFormula || '-'}
                              </div>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {sortedCells.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">
              {filteredCells.length === 0 && allCells.length > 0 ? (
                <p>No changes match the current filters</p>
              ) : (
                <p>No changes found in this sheet</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
