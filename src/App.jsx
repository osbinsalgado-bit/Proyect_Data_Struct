import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// REVISA QUE ESTAS RUTAS COINCIDAN CON TUS CARPETAS:
import Login from './pages/auth/Login';
import OnboardingPage from './pages/auth/OnboardingPage'; 
import DashboardPage from './pages/coordinator/DashboardPage';
import SuperAdminPage from './pages/superadmin/SuperAdminPage'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin-dashboard" element={<SuperAdminPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;