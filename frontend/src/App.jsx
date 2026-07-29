import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect }         from 'react';
import axios                           from 'axios';
import Sidebar                         from './components/Sidebar.jsx';
import Dashboard                       from './pages/Dashboard.jsx';
import Eval                            from './pages/Eval.jsx';
import TraceLogs                       from './pages/TraceLogs.jsx';
import Runs                            from './pages/Runs.jsx';
 import ApiKeyModal                     from './components/ApiKeyModal.jsx';

export default function App() {
  const [apiStatus, setApiStatus] = useState('checking');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isForceOpen, setIsForceOpen] = useState(false);

  useEffect(() => {
    axios.get('/api/health')
      .then(() => setApiStatus('connected'))
      .catch(() => setApiStatus('offline'));

    // Check if API key exists on load
    const key = localStorage.getItem('openai_api_key');
    if (!key) {
      setIsModalOpen(true);
      setIsForceOpen(true);
    }
  }, []);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-white">
        <Sidebar 
          apiStatus={apiStatus} 
          onManageKey={() => {
            setIsModalOpen(true);
            setIsForceOpen(false);
          }}
        />

        {/* Main — offset by sidebar width */}
        <main className="ml-64 flex-1 min-h-screen">
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
            const key = localStorage.getItem('openai_api_key');
            if (key) {
              setIsModalOpen(false);
              setIsForceOpen(false);
            }
          }}
          forceOpen={isForceOpen}
        />
      </div>
    </BrowserRouter>
  );
}
