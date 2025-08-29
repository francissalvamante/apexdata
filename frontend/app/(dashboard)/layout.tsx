"use client";

import { useState } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-white"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0
   0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              <h1 className="text-2xl font-bold">🏎️ F1 Telemetry Dashboard</h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              {/* <a
                href="/live"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md font-medium transition-colors"
              >
                📡 Live Telemetry
              </a> */}
              <a
                href="/history"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md font-medium transition-colors"
              >
                📊 History
              </a>
              {/* <a
                href="/settings"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md font-medium transition-colors"
              >
                ⚙️ Settings
              </a> */}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div
            className="fixed top-0 left-0 w-64 h-full bg-gray-800 border-r
  border-gray-700"
          >
            <div className="p-4">
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0
   0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <nav className="mt-8 space-y-4">
                <a
                  href="/live"
                  className="block text-gray-300 hover:text-white px-3 py-2
  rounded-md font-medium transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  📡 Live Telemetry
                </a>
                <a
                  href="/history"
                  className="block text-gray-300 hover:text-white px-3 py-2
  rounded-md font-medium transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  📊 History
                </a>
                <a
                  href="/settings"
                  className="block text-gray-300 hover:text-white px-3 py-2
  rounded-md font-medium transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  ⚙️ Settings
                </a>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-12">
        <div className="container mx-auto px-4 py-4">
          <div className="text-center text-gray-400 text-sm">
            F1 Telemetry Dashboard - Real-time data from F1 25/24
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;
