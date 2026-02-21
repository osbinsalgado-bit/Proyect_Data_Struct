import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import DashboardPage from './pages/coordinator/DashboardPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta de Login */}
        <Route path="/" element={<Login />} />

        {/* Ruta del Panel del Coordinador */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Redirección por si escriben cualquier otra cosa */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;