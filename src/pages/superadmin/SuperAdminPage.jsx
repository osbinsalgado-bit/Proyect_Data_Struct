import { useState, useEffect } from 'react';
import { auth, db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import SuperAdminLayout from '../../components/layouts/SuperAdminLayout';
import SedesView from '../../components/superadmin/SedesView';
import GlobalUsersView from '../../components/superadmin/GlobalUsersView';
import InstConfigView from '../../components/superadmin/InstConfigView';
import LaboratoriosView from '../../components/views/LaboratoriosView';

export default function SuperAdminPage() {
  const [data, setData] = useState({ user: null, inst: null });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [sedeSeleccionadaId, setSedeSeleccionadaId] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        const uDoc = await getDoc(doc(db, "usuarios", u.uid));
        const iDoc = await getDoc(doc(db, "instituciones", uDoc.data().institucionId));
        setData({ user: uDoc.data(), inst: { id: iDoc.id, ...iDoc.data() } });
      }
      setLoading(false);
    });
  }, []);

  const handleNavegarALabs = (sedeId) => {
    setSedeSeleccionadaId(sedeId);
    setActiveTab('labs');
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white font-black italic tracking-widest animate-pulse">CARGANDO NÚCLEO...</div>;

  return (
    <SuperAdminLayout user={data.user} inst={data.inst} activeTab={activeTab} setActiveTab={setActiveTab}>
      {data.inst && (
        <>
          {activeTab === 'dashboard' && <div className="p-20 text-center font-black text-slate-200 uppercase tracking-widest text-4xl italic">Ready for Action</div>}
          {activeTab === 'sedes' && <SedesView inst={data.inst} temaColor={data.inst.temaColor} onVerLaboratorios={handleNavegarALabs} />}
          {activeTab === 'labs' && <LaboratoriosView inst={data.inst} temaColor={data.inst.temaColor} sedeInicialId={sedeSeleccionadaId} />}
          {activeTab === 'usuarios' && <GlobalUsersView inst={data.inst} temaColor={data.inst.temaColor} />}
          {activeTab === 'config' && <InstConfigView inst={data.inst} temaColor={data.inst.temaColor} />}
        </>
      )}
    </SuperAdminLayout>
  );
}