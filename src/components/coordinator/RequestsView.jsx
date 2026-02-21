import { useState, useEffect } from 'react';
import { Mail, Clock, ShieldCheck, X, Loader2 } from 'lucide-react';
import { db, auth } from '../../config/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function RequestsView({ institucionId, sedeId }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [selectedTime, setSelectedTime] = useState(24); 
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    if (!institucionId) return;
    const q = query(collection(db, "solicitudes"), where("institucionId", "==", institucionId), where("status", "==", "pendiente"));
    return onSnapshot(q, (snap) => setSolicitudes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [institucionId]);

  const handleAction = async (sol, tipo) => {
    setLoadingId(sol.id);
    try {
      if (tipo === 'rechazar') {
        await deleteDoc(doc(db, "solicitudes", sol.id));
        return;
      }

      const expiresAt = tipo === 'temporal' ? Timestamp.fromDate(new Date(Date.now() + selectedTime * 60 * 60 * 1000)) : null;

      // 1. Crear en Firestore (El ID del documento es el ID de la solicitud por ahora)
      await setDoc(doc(db, "usuarios", sol.id), {
        email: sol.email,
        nombre: sol.email.split('@')[0],
        institucionId,
        sedesAsignadas: [sedeId],
        rol: tipo,
        status: 'activo',
        fechaCreacion: Timestamp.now(),
        expiresAt
      });

      // 2. ENVIAR CORREO DE CONFIGURACIÓN (Auth)
      // Nota: Esto asume que el usuario ya existe en Auth o se creará.
      // await sendPasswordResetEmail(auth, sol.email);

      await deleteDoc(doc(db, "solicitudes", sol.id));
      alert("Usuario autorizado. Se ha enviado la invitación por correo.");
    } catch (err) { console.error(err); } 
    finally { setLoadingId(null); }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-black text-slate-800 italic">Solicitudes Pendientes</h3>
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-100 text-[10px] font-bold">
          <span className="px-2 text-slate-400">EXPIRACIÓN TEMP:</span>
          {[8, 24, 72, 168].map(v => (
            <button key={v} onClick={() => setSelectedTime(v)} className={`px-2 py-1 rounded-lg ${selectedTime === v ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
              {v}h
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {solicitudes.map(sol => (
          <div key={sol.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300"><Mail size={20}/></div>
              <div>
                <p className="font-bold text-slate-700 text-sm">{sol.email}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Solicitado: {new Date(sol.fechaSolicitud).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => handleAction(sol, 'rechazar')} className="p-2 text-slate-300 hover:text-red-500"><X size={18}/></button>
              <button onClick={() => handleAction(sol, 'temporal')} className="px-3 py-2 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-bold uppercase hover:bg-amber-100 flex items-center">
                <Clock size={14} className="mr-1"/> Temporal
              </button>
              <button onClick={() => handleAction(sol, 'docente')} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase hover:bg-blue-700 flex items-center shadow-lg shadow-blue-100">
                {loadingId === sol.id ? <Loader2 className="animate-spin w-3 h-3"/> : <><ShieldCheck size={14} className="mr-1"/> Aprobar</>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}