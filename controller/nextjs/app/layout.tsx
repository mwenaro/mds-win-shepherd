import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MdsWinShepherd - Windows System Management',
  description: 'Your trusted Windows System Shepherd for remote PC control and monitoring',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen">
        <div className="min-h-screen flex flex-col">
          <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
            <h1 className="text-2xl font-bold">🐑 MdsWinShepherd</h1>
            <p className="text-blue-100 text-sm">Your Windows System Shepherd</p>
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}