import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Windows Management Dashboard',
  description: 'Control and manage Windows PCs remotely',
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
          <header className="bg-blue-600 text-white p-4 shadow-lg">
            <h1 className="text-2xl font-bold">Windows Management Dashboard</h1>
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}