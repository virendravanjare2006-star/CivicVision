import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import HazardMap from './pages/HazardMap';
import HazardList from './pages/HazardList';
import Detection from './pages/Detection';
import ReportHazard from './pages/ReportHazard';
import Login from './pages/Login';
import { api } from './services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    api.getCurrentUser()
      .then((response) => setUser(response.user))
      .catch((error) => {
        if (error.status !== 401) {
          console.error('Unable to verify the current session:', error);
        }
      })
      .finally(() => setAuthReady(true));
  }, []);

  const handleLogout = async () => {
    setAuthError('');
    try {
      await api.logout();
      setUser(null);
    } catch (error) {
      setAuthError(`Sign out failed: ${error.message}`);
    }
  };

  if (!authReady) {
    return <div className="flex h-screen items-center justify-center bg-[#0b132b] text-slate-300">Checking your session...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login onAuthenticated={setUser} />}
        />
        <Route
          path="*"
          element={user ? (
            <div className="flex h-screen bg-[#0b132b] text-slate-100 overflow-hidden font-sans">
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Navbar user={user} onLogout={handleLogout} authError={authError} />
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
          ) : <Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
