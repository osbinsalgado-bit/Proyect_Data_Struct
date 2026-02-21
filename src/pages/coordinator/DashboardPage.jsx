import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

import CoordinatorLayout from '../../components/layouts/CoordinatorLayout';
import RequestsView from '../../components/coordinator/RequestsView';
import ActiveUsersView from '../../components/coordinator/ActiveUsersView';
import LabsView from '../../components/coordinator/LabsView';

export default function DashboardPage() {
  const [userProfile, setUserProfile] = useState(null);
  const [sedeInfo, setSedeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('solicitudes');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "usuarios", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            
            // Buscamos los datos de su institución para obtener el Logo
            const instDoc = await getDoc(doc(db, "instituciones", data.institucionId));
            const instData = instDoc.exists() ? instDoc.data() : {};

            setUserProfile({ ...data, logoUrl: instData.logoUrl });

            const activeSedeId = localStorage.getItem('sedeActualId');
            if (activeSedeId) {
              const sedeDoc = await getDoc(doc(db, "sedes", activeSedeId));
              if (sedeDoc.exists()) {
                setSedeInfo({ id: activeSedeId, ...sedeDoc.data() });
              }
            }
          } else { navigate("/"); }
        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
      } else { navigate("/"); }
    });
    return () => unsubscribe();
  }, [navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-slate-400 animate-pulse">Cargando MINS...</div>;

  return (
    <CoordinatorLayout 
      user={userProfile} 
      sedeNombre={sedeInfo?.nombre || "Sin Sede"}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      <div className="animate-in fade-in duration-500">
        
        {activeTab === 'dash' && (
          <div className="p-10 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
            <h2 className="text-xl font-black text-slate-800">Panel de Control</h2>
            <p className="text-slate-400 mt-2 text-sm">Próximamente: Gráficas de estado de equipos.</p>
          </div>
        )}

        {activeTab === 'solicitudes' && (
          <RequestsView institucionId={userProfile.institucionId} sedeId={sedeInfo?.id} />
        )}

        {activeTab === 'usuarios' && (
          <ActiveUsersView institucionId={userProfile.institucionId} sedeId={sedeInfo?.id} />
        )}

        {activeTab === 'labs' && (
          <LabsView institucionId={userProfile.institucionId} sedeId={sedeInfo?.id} />
        )}

      </div>
    </CoordinatorLayout>
  );
}