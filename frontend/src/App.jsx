import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import HazardMap from './pages/HazardMap';
import HazardList from './pages/HazardList';
import Detection from './pages/Detection';
import ReportHazard from './pages/ReportHazard';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-[#0b132b] text-slate-100 overflow-hidden font-sans">
        {/* Persistent Smart City Sidebar */}
        <Sidebar />

        {/* Main Content Workspace */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/map" element={<HazardMap />} />
              <Route path="/hazards" element={<HazardList />} />
              <Route path="/detection" element={<Detection />} />
              <Route path="/report" element={<ReportHazard />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
