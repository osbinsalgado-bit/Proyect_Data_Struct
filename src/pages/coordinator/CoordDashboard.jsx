import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// IMPORTAMOS AMBOS
import CoordinatorLayout from '../../components/layouts/CoordinatorLayout';
import MainLayout from '../../components/layouts/MainLayout';

// Vistas
import DashboardView from '../../components/features/dashboard/DashboardView';
import SedesView from '../../components/features/sedes/SedesView';
import LaboratoriosView from '../../components/features/laboratorios/LaboratoriosView';
import ReportesList from '../../components/features/reportes/ReportesList';
import GlobalUsersView from '../../components/features/usuarios/GlobalUsersView';

export default function AppDashboard() {
  const [data, setData] = useState({ user: null, inst: null, sede: null });
  const [activeTab, setActiveTab] = useState('labs'); // Por defecto a labs por seguridad
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        const instId = localStorage.getItem('institucionActualId');
        const sedeId = localStorage.getItem('sedeActualId');
        
        const profileId = `${u.uid}_${instId}`;
        const uDoc = await getDoc(doc(db, "usuarios", profileId));
        const iDoc = await getDoc(doc(db, "instituciones", instId));
        const sDoc = sedeId ? await getDoc(doc(db, "sedes", sedeId)) : null;

        if (uDoc.exists() && iDoc.exists()) {
          const userData = uDoc.data();
          
          // Lógica de inicio: Coordinador va a Dashboard, Docente a Labs
          const esStaff = userData.rol === 'admin_institucion' || userData.rol === 'coordinador';
          setActiveTab(esStaff ? 'dashboard' : 'labs');

          setData({ 
            user: { id: uDoc.id, ...userData }, 
            inst: { id: iDoc.id, ...iDoc.data() },
            sede: sDoc?.exists() ? { id: sDoc.id, ...sDoc.data() } : null
          });
        } else { navigate("/"); }
        setLoading(false);
      } else { navigate("/"); }
    });
  }, []);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando Acceso...</p>
    </div>
  );

  const rol = data.user?.rol;
  const esStaff = rol === 'admin_institucion' || rol === 'coordinador';

  return (
    <MainLayout 
      user={data.user} 
      inst={data.inst} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      sedeNombre={data.sede?.nombre}
    >
      <div className="animate-in fade-in duration-500">
        
        {/* 1. Dashboard solo para Staff */}
        {esStaff && activeTab === 'dashboard' && <DashboardView inst={data.inst} user={data.user} />}
        
        {/* 2. Sedes solo para Staff */}
        {esStaff && activeTab === 'sedes' && <SedesView inst={data.inst} soloLectura={true} />}

        {/* 3. Laboratorios: PARA TODOS (pero el componente interno filtra los datos) */}
        {activeTab === 'labs' && <LaboratoriosView />}

        {/* 4. Reportes: PARA TODOS (el componente filtra si son propios o de la sede) */}
        {activeTab === 'reportes' && (
          <ReportesList inst={data.inst} user={data.user} />
        )}

        {/* 5. Usuarios solo para Staff */}
        {esStaff && activeTab === 'usuarios' && (
          <GlobalUsersView 
            inst={data.inst} 
            temaColor={data.inst?.temaColorPrincipal || '#3b82f6'}
            currentUser={data.user}
          />
        )}
        
      </div>
    </MainLayout>
  );
}