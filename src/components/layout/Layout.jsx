import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileHeader from './MobileHeader'
import MobileNav from './MobileNav'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <MobileHeader />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 lg:pb-8">
            <div className="max-w-7xl mx-auto animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <MobileNav />
    </div>
  )
}
