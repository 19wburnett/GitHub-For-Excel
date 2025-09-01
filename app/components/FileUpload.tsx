'use client'

import React, { useState, useRef } from 'react'
import { ExcelData } from '../types'

type FileUploadProps = {
  label: string
  onFileUpload: (fileId: string, fileName: string, fileUrl: string) => void
  uploadedFile?: { fileId: string; fileName: string; fileUrl: string } | null
}

export default function FileUpload({ label, onFileUpload, uploadedFile }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      uploadFile(file)
    } else {
      setError('Please upload an Excel file (.xlsx or .xls)')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      uploadFile(file)
    } else {
      setError('Please upload an Excel file (.xlsx or .xls)')
    }
  }

  const uploadFile = async (file: File) => {
    setIsLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to upload file')
      }

      const fileData = await response.json()
      // With Supabase, we get fileId, fileName, fileUrl instead of ExcelData with sheets
      onFileUpload(fileData.fileId, fileData.fileName, fileData.fileUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      {uploadedFile ? (
        <div className="mt-2 p-4 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
          Uploaded: {uploadedFile.fileName}
        </div>
      ) : (
        <div
          className={`mt-2 p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors duration-200 ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
          />
          {isLoading ? (
            <div className="text-blue-600">Uploading...</div>
          ) : (
            <div className="text-gray-500">
              Drag and drop an Excel file here or click to upload
            </div>
          )}
        </div>
      )}
      {error && !uploadedFile && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
          {error}
        </div>
      )}
    </div>
  )
}
