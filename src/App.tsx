import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AuctionSetup from './pages/AuctionSetup';
import AuctioneerWorkspace from './pages/AuctioneerWorkspace';
import CaptainWorkspace from './pages/CaptainWorkspace';
import StreamerView from './pages/StreamerView';
import SpectatorView from './pages/SpectatorView';
import Reports from './pages/Reports';
import Invitations from './pages/Invitations';
import ProjectorView from './pages/ProjectorView';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const currentUser = useStore(s => s.currentUser);
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/auction/:id/setup" element={<ProtectedRoute><AuctionSetup /></ProtectedRoute>} />
        <Route path="/auction/:id/auctioneer" element={<ProtectedRoute><AuctioneerWorkspace /></ProtectedRoute>} />
        <Route path="/auction/:id/captain" element={<ProtectedRoute><CaptainWorkspace /></ProtectedRoute>} />
        <Route path="/auction/:id/streamer" element={<ProtectedRoute><StreamerView /></ProtectedRoute>} />
        <Route path="/auction/:id/spectator" element={<SpectatorView />} />
        <Route path="/auction/:id/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/auction/:id/invitations" element={<ProtectedRoute><Invitations /></ProtectedRoute>} />
        <Route path="/auction/:id/projector" element={<ProjectorView />} />
        <Route path="/invite/:token" element={<ProtectedRoute><InviteAccept /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

function InviteAccept() {
  const token = window.location.pathname.split('/invite/')[1];
  const acceptInvitation = useStore(s => s.acceptInvitation);
  const currentUser = useStore(s => s.currentUser);
  const [result, setResult] = React.useState<{ success: boolean; error?: string } | null>(null);

  React.useEffect(() => {
    if (token && currentUser) {
      const res = acceptInvitation(token, currentUser.id);
      setResult(res);
    }
  }, [token, currentUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Invitation</h2>
        {result?.success ? (
          <div>
            <p className="text-green-600 font-medium mb-4">✓ Invitation accepted successfully!</p>
            <a href="/dashboard" className="text-blue-600 hover:underline">Go to Dashboard</a>
          </div>
        ) : result?.error ? (
          <p className="text-red-600">{result.error}</p>
        ) : (
          <p className="text-slate-500">Processing invitation...</p>
        )}
      </div>
    </div>
  );
}
