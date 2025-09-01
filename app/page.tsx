'use client'

import { useState } from 'react'
import FileUpload from './components/FileUpload'
import ComparisonResults from './components/ComparisonResults'
import { ComparisonResult } from './types'

export default function Home() {
  const [file1, setFile1] = useState<{ fileId: string; fileName: string; fileUrl: string } | null>(null)
  const [file2, setFile2] = useState<{ fileId: string; fileName: string; fileUrl: string } | null>(null)
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null)
  const [isComparing, setIsComparing] = useState(false)
  const [comparisonError, setComparisonError] = useState<string | null>(null)

  const handleFile1Upload = (fileId: string, fileName: string, fileUrl: string) => {
    setFile1({ fileId, fileName, fileUrl })
    setComparisonResult(null) // Reset comparison result when a new file is uploaded
  }

  const handleFile2Upload = (fileId: string, fileName: string, fileUrl: string) => {
    setFile2({ fileId, fileName, fileUrl })
    setComparisonResult(null) // Reset comparison result when a new file is uploaded
  }

  const handleCompare = async () => {
    if (!file1 || !file2) {
      setComparisonError('Please upload both files before comparing.')
      return
    }

    setIsComparing(true)
    setComparisonError(null)
    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file1Id: file1.fileId, file2Id: file2.fileId }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to compare files')
      }

      const data = await response.json()
      setComparisonResult(data)
    } catch (error) {
      setComparisonError(error instanceof Error ? error.message : 'Failed to compare files')
    } finally {
      setIsComparing(false)
    }
  }

  return (
    <main className="container mx-auto py-10 space-y-8 px-2">
      <h1 className="text-3xl font-bold text-center mb-6">Excel Comparison Tool</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FileUpload 
          label="Upload First Excel File" 
          onFileUpload={handleFile1Upload} 
          uploadedFile={file1} 
        />
        <FileUpload 
          label="Upload Second Excel File" 
          onFileUpload={handleFile2Upload} 
          uploadedFile={file2} 
        />
      </div>
      <div className="flex justify-center mt-6">
        <button
          onClick={handleCompare}
          disabled={!file1 || !file2 || isComparing}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            !file1 || !file2 || isComparing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isComparing ? 'Comparing...' : 'Compare Files'}
        </button>
      </div>
      {comparisonError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800 text-center">
          {comparisonError}
        </div>
      )}
      {comparisonResult && <ComparisonResults result={comparisonResult} />}
    </main>
  )
}
