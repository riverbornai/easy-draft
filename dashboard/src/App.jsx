import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect }         from 'react';
import axios                           from 'axios';
import Sidebar                         from './components/Sidebar.jsx';
import Dashboard                       from './pages/Dashboard.jsx';
import Eval                            from './pages/Eval.jsx';
import TraceLogs                       from './pages/TraceLogs.jsx';
import Runs                            from './pages/Runs.jsx';

export default function App() {
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    axios.get('/api/health')
      .then(() => setApiStatus('connected'))
      .catch(() => setApiStatus('offline'));
  }, []);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-white">
        <Sidebar apiStatus={apiStatus} />

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
      </div>
    </BrowserRouter>
  );
}
