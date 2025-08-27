import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Excel Compare App',
  description: 'Compare Excel files cell by cell with visual diffs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 text-center">
              Excel Compare
            </h1>
            <p className="text-gray-600 text-center mt-2">
              Upload two Excel files and compare them cell by cell
            </p>
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}
