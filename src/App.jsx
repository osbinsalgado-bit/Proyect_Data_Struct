import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// REVISA QUE ESTAS RUTAS COINCIDAN CON TUS CARPETAS:
import Login from './pages/auth/Login';
import OnboardingPage from './pages/auth/OnboardingPage'; 
import DashboardPage from './pages/coordinator/CoordDashboard';
import SuperAdminPage from './pages/admin/AdminDashboard'; 
import SetPasswordPage from './pages/auth/SetPasswordPage';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider> {/* Envuelve aquí */}
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/admin-dashboard" element={<SuperAdminPage />} />
          <Route path="*" element={<Navigate to="/" />} />
          <Route path="/establecer-contrasena" element={<SetPasswordPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;