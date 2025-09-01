'use client'

import { useState } from 'react'
import FileUpload from './components/FileUpload'
import ComparisonResults from './components/ComparisonResults'
import { ExcelData, ComparisonResult } from './types'

export default function Home() {
  const [file1Data, setFile1Data] = useState<ExcelData | null>(null)
  const [file2Data, setFile2Data] = useState<ExcelData | null>(null)
  const [file1Id, setFile1Id] = useState<string | null>(null)
  const [file2Id, setFile2Id] = useState<string | null>(null)
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null)
  const [isComparing, setIsComparing] = useState(false)

  const handleFile1Upload = (data: ExcelData) => {
    setFile1Data(data)
  }

  const handleFile2Upload = (data: ExcelData) => {
    setFile2Data(data)
  }

  const handleFile1UploadSuccess = (uploadResult: any) => {
    setFile1Id(uploadResult.fileId)
    setFile1Data(uploadResult)
  }

  const handleFile2UploadSuccess = (uploadResult: any) => {
    setFile2Id(uploadResult.fileId)
    setFile2Data(uploadResult)
  }

  const handleCompare = async () => {
    if (!file1Id || !file2Id) return

    setIsComparing(true)
    try {
      console.log('Starting comparison with file IDs...')
      console.log('File 1 ID:', file1Id)
      console.log('File 2 ID:', file2Id)
      
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file1Id,
          file2Id,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Comparison successful:', result)
        setComparisonResult(result)
      } else {
        const errorText = await response.text()
        console.error('Comparison failed:', response.status, errorText)
        
        // Try to parse as JSON for better error display
        try {
          const errorData = JSON.parse(errorText)
          alert(`Comparison failed: ${errorData.error || 'Unknown error'}`)
        } catch {
          alert(`Comparison failed with status ${response.status}: ${errorText}`)
        }
      }
    } catch (error) {
      console.error('Error comparing files:', error)
      alert(`Error comparing files: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsComparing(false)
    }
  }

  const canCompare = file1Id && file2Id

  return (
    <main className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <FileUpload
          label="File 1 (Original)"
          onFileUpload={handleFile1Upload}
          fileData={file1Data}
          onUploadSuccess={handleFile1UploadSuccess}
        />
        <FileUpload
          label="File 2 (Modified)"
          onFileUpload={handleFile2Upload}
          fileData={file2Data}
          onUploadSuccess={handleFile2UploadSuccess}
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
