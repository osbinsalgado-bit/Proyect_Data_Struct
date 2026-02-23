import { useState, useEffect } from 'react';
import { auth, db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import SuperAdminLayout from '../../components/layouts/SuperAdminLayout';
import SedesView from '../../components/superadmin/SedesView';
import GlobalUsersView from '../../components/superadmin/GlobalUsersView';
import InstConfigView from '../../components/superadmin/InstConfigView';

export default function SuperAdminPage() {
  const [data, setData] = useState({ user: null, inst: null });
  const [activeTab, setActiveTab] = useState('sedes');
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white font-black italic tracking-widest animate-pulse">CARGANDO NÚCLEO...</div>;

  return (
    <SuperAdminLayout user={data.user} inst={data.inst} activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'sedes' && <SedesView instId={data.inst.id} temaColor={data.inst.temaColor} />}
      {activeTab === 'usuarios' && <GlobalUsersView instId={data.inst.id} temaColor={data.inst.temaColor} />}
      {activeTab === 'config' && <InstConfigView inst={data.inst} />}
    </SuperAdminLayout>
  );
}