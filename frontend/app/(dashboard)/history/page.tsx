"use client";

import { useSession } from "@/hooks/useSession";
import { Session } from "@/lib/telemetry-types";
import Link from "next/link";
import { useState } from "react";

const HistoryPage = () => {
  const { sessions, loading, error, loadSessions } = useSession();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSessions = sessions.filter(session =>
    session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.track?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.car?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDuration = (startDate: Date, endDate?: Date) => {
    if (!endDate) return "In Progress";
    
    const duration = endDate.getTime() - startDate.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getSessionTypeColor = (sessionType?: string) => {
    switch (sessionType) {
      case 'practice': return 'text-blue-400';
      case 'qualifying': return 'text-yellow-400';
      case 'race': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">📊 Session History</h1>
        <button
          onClick={loadSessions}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded font-medium transition-colors"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900 border border-red-700 rounded text-red-200">
          {error}
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <input
          type="text"
          placeholder="Search sessions by name, player, track, or car..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Sessions List */}
      {loading && sessions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading sessions...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">
            {searchTerm ? "No sessions match your search." : "No recorded sessions found."}
          </p>
          <p className="text-gray-500 mt-2">
            Start recording sessions on the Live page to see them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-white truncate">
                  {session.name}
                </h3>
                <div className={`text-sm font-medium ${getSessionTypeColor(session.sessionType)}`}>
                  {session.sessionType || 'Custom'}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Player:</span>
                  <span className="text-white">{session.playerName}</span>
                </div>
                
                {session.track && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Track:</span>
                    <span className="text-white">{session.track}</span>
                  </div>
                )}
                
                {session.car && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Car:</span>
                    <span className="text-white">{session.car}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-400">Laps:</span>
                  <span className="text-white">{session.totalLaps}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white">
                    {formatDuration(session.createdAt, session.endedAt)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span className="text-white">{formatDate(session.createdAt)}</span>
                </div>

                {session.isActive && (
                  <div className="flex items-center space-x-2 mt-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-400 text-sm font-medium">Recording in Progress</span>
                  </div>
                )}
              </div>

              {!session.isActive && session.totalLaps > 0 && (
                <div className="mt-4">
                  <Link
                    href={`/history/session/${session.id}`}
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 rounded font-medium transition-colors"
                  >
                    View Analysis
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Statistics */}
      {sessions.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">📈 Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-400">Total Sessions</div>
              <div className="text-white font-bold text-xl">{sessions.length}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Total Laps</div>
              <div className="text-white font-bold text-xl">
                {sessions.reduce((acc, session) => acc + session.totalLaps, 0)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Completed Sessions</div>
              <div className="text-white font-bold text-xl">
                {sessions.filter(session => !session.isActive).length}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Active Sessions</div>
              <div className="text-white font-bold text-xl">
                {sessions.filter(session => session.isActive).length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
