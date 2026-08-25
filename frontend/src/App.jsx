import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect }         from 'react';
import axios                           from 'axios';
import Sidebar                         from './components/Sidebar.jsx';
import { Menu }                        from 'lucide-react';
import Dashboard                       from './pages/Dashboard.jsx';
import Eval                            from './pages/Eval.jsx';
import TraceLogs                       from './pages/TraceLogs.jsx';
import Runs                            from './pages/Runs.jsx';
import Login                           from './pages/Login.jsx';
 import ApiKeyModal                     from './components/ApiKeyModal.jsx';
import ProtectedRoute                  from './components/ProtectedRoute.jsx';
import { AuthProvider }                from './context/AuthContext.jsx';

function AppShell() {
  const [apiStatus, setApiStatus] = useState('checking');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isForceOpen, setIsForceOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    axios.get('/api/health')
      .then(() => setApiStatus('connected'))
      .catch(() => setApiStatus('offline'));

    // Check whether this account already has an API key saved
    axios.get('/api/user/keys')
      .then(({ data }) => {
        if (!data.hasOpenAIKey) {
          setIsModalOpen(true);
          setIsForceOpen(true);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen bg-white">
      {/* Mobile Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#0D2B22] border-b border-[#1A4435] flex items-center justify-between px-4 z-30 lg:hidden shadow-md">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="text-[#D4F53C] hover:text-white p-2 rounded-xl transition-colors focus:outline-none"
          title="Open menu"
        >
          <Menu size={24} />
        </button>
        <img
          src="/logo.png"
          alt="EasyDraft Logo"
          className="h-9 w-auto object-contain"
        />
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/20 border border-white/5">
          <div className="relative flex h-2 w-2">
            {apiStatus === 'connected' ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4F53C] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4F53C]"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            )}
          </div>
          <span className={`text-[10px] font-black uppercase tracking-wider ${
            apiStatus === 'connected' ? 'text-[#D4F53C]' : 'text-red-400'
          }`}>
            {apiStatus === 'connected' ? 'Live' : 'Offline'}
          </span>
        </div>
      </header>

      {/* Sidebar Backdrop Overlay on Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        apiStatus={apiStatus}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onManageKey={() => {
          setIsModalOpen(true);
          setIsForceOpen(false);
        }}
      />

      {/* Main — offset by sidebar width on desktop, padded on mobile */}
      <main className="lg:ml-64 flex-1 min-h-screen pt-16 lg:pt-0 min-w-0">
        <Routes>
          <Route path="/"           element={<Dashboard />}  />
          <Route path="/eval"       element={<Eval />}       />
          <Route path="/trace-logs" element={<TraceLogs />}  />
          <Route path="/runs"       element={<Runs />}       />
          <Route path="/runs/new"   element={<Runs />}       />
          <Route path="/runs/:id"   element={<Runs />}       />
        </Routes>
      </main>

      <ApiKeyModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsForceOpen(false);
        }}
        forceOpen={isForceOpen}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
