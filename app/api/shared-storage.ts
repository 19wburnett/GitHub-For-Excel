import { ExcelData } from '../../types'

// In-memory storage for uploaded files (in production, use Redis or database)
export const fileStorage = new Map<string, ExcelData>()

// Clean up old files (older than 1 hour)
export function cleanupOldFiles() {
  const oneHourAgo = Date.now() - (60 * 60 * 1000)
  
  for (const [fileId, fileData] of fileStorage.entries()) {
    const uploadTime = new Date(fileData.uploadedAt).getTime()
    if (uploadTime < oneHourAgo) {
      fileStorage.delete(fileId)
      console.log(`Cleaned up old file: ${fileId}`)
    }
  }
}

// Run cleanup every 30 minutes
setInterval(cleanupOldFiles, 30 * 60 * 1000)
