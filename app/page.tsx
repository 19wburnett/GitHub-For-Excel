'use client'

import { useState } from 'react'
import FileUpload from './components/FileUpload'
import ComparisonResults from './components/ComparisonResults'
import { ExcelData, ComparisonResult } from './types'

export default function Home() {
  const [file1Data, setFile1Data] = useState<ExcelData | null>(null)
  const [file2Data, setFile2Data] = useState<ExcelData | null>(null)
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null)
  const [isComparing, setIsComparing] = useState(false)

  const handleFile1Upload = (data: ExcelData) => {
    setFile1Data(data)
  }

  const handleFile2Upload = (data: ExcelData) => {
    setFile2Data(data)
  }

  const handleCompare = async () => {
    if (!file1Data || !file2Data) return

    setIsComparing(true)
    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file1: file1Data,
          file2: file2Data,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setComparisonResult(result)
      } else {
        console.error('Comparison failed')
      }
    } catch (error) {
      console.error('Error comparing files:', error)
    } finally {
      setIsComparing(false)
    }
  }

  const canCompare = file1Data && file2Data

  return (
    <main className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <FileUpload
          label="File 1 (Original)"
          onFileUpload={handleFile1Upload}
          fileData={file1Data}
        />
        <FileUpload
          label="File 2 (Modified)"
          onFileUpload={handleFile2Upload}
          fileData={file2Data}
        />
      </div>

      {canCompare && (
        <div className="text-center">
          <button
            onClick={handleCompare}
            disabled={isComparing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            {isComparing ? 'Comparing...' : 'Compare Files'}
          </button>
        </div>
      )}

      {comparisonResult && (
        <ComparisonResults result={comparisonResult} />
      )}
    </main>
  )
}
