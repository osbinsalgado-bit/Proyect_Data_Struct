import { useState, useEffect } from 'react';
import { auth, db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import SuperAdminLayout from '../../components/layouts/SuperAdminLayout';
import SedesView from '../../components/features/sedes/SedesView';
import GlobalUsersView from '../../components/features/usuarios/GlobalUsersView';
import InstConfigView from '../../components/features/institucion/InstConfigView';
import LaboratoriosView from '../../components/features/laboratorios/LaboratoriosView';
import ReportesList from '../../components/features/reportes/ReportesList';
import DashboardView from '../../components/features/dashboard/DashboardView';

export default function SuperAdminPage() {
  const [data, setData] = useState({ user: null, inst: null });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [sedeSeleccionadaId, setSedeSeleccionadaId] = useState(null);
  const navigate = useNavigate();

  const primaryColor = data.inst?.temaColorPrincipal || '#3b82f6';

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const currentInstId = localStorage.getItem('institucionActualId');
          if (!currentInstId) {
             navigate("/");
             return;
          }

          const profileId = `${u.uid}_${currentInstId}`;
          const uDoc = await getDoc(doc(db, "usuarios", profileId));

          if (uDoc.exists()) {
            const userData = uDoc.data();
            const iDoc = await getDoc(doc(db, "instituciones", currentInstId));
            
            if (iDoc.exists()) {
              setData({ 
                user: { id: uDoc.id, ...userData }, 
                inst: { id: iDoc.id, ...iDoc.data() } 
              });
            }
          } else {
            navigate("/");
          }
        } catch (error) {
          console.error("Error cargando núcleo:", error);
        } finally {
          setLoading(false);
        }
      } else {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleNavegarALabs = (sedeId) => {
    setSedeSeleccionadaId(sedeId);
    setActiveTab('labs');
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="font-black italic tracking-widest animate-pulse uppercase text-xs">Sincronizando Núcleo Maestro...</p>
    </div>
  );

  return (
    <SuperAdminLayout user={data.user} inst={data.inst} activeTab={activeTab} setActiveTab={setActiveTab}>
      {data.inst && (
        <>
          {/* AHORA EL DASHBOARD ES LA VISTA POR DEFECTO */}
          {activeTab === 'dashboard' && <DashboardView inst={data.inst} user={data.user} />}
          
          {activeTab === 'sedes' && <SedesView inst={data.inst} temaColor={primaryColor} onVerLaboratorios={handleNavegarALabs} />}
          
          {activeTab === 'labs' && <LaboratoriosView />}

          {activeTab === 'reportes' && <ReportesList inst={data.inst} user={data.user} />}
          
          {activeTab === 'usuarios' && <GlobalUsersView inst={data.inst} temaColor={primaryColor} />}
          
          {activeTab === 'config' && <InstConfigView inst={data.inst} temaColor={primaryColor} />}
        </>
      )}
    </SuperAdminLayout>
  );
}