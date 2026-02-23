import { useState, useEffect } from 'react';
import { Mail, Clock, ShieldCheck, X, Loader2, CheckCircle } from 'lucide-react';
import { db } from '../../config/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, Timestamp, addDoc, getDoc } from 'firebase/firestore';

export default function RequestsView({ institucionId, sedeId }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [instData, setInstData] = useState(null);
  const [selectedTime, setSelectedTime] = useState(24); 
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    if (!institucionId) return;
    // Cargar datos de la institución para el branding y correos
    getDoc(doc(db, "instituciones", institucionId)).then(d => setInstData(d.data()));

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

      // 1. Crear Usuario en Firestore
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

      // 2. Enviar Correo de Notificación (Branding Dinámico)
      await addDoc(collection(db, "mail"), {
        to: sol.email,
        message: {
          subject: `Acceso Autorizado - ${instData.nombre}`,
          html: `
            <div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px; border-radius: 15px;">
              <h2 style="color: ${instData.temaColor}">¡Hola! Tu acceso ha sido aprobado</h2>
              <p>Ahora puedes ingresar al sistema de laboratorios de <b>${instData.nombre}</b>.</p>
              <p>Si es tu primera vez, usa la opción de <b>"Olvidé mi contraseña"</b> en el login para crear tu clave.</p>
              <hr/>
              <small>Operado por MINS System</small>
            </div>
          `
        }
      });

      await deleteDoc(doc(db, "solicitudes", sol.id));
    } catch (err) { console.error(err); } 
    finally { setLoadingId(null); }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">Solicitudes de Acceso</h3>
        <div className="flex items-center bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Expiración:</span>
          {[8, 24, 168, 720].map(v => (
            <button key={v} onClick={() => setSelectedTime(v)} 
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${selectedTime === v ? 'text-white shadow-lg' : 'text-slate-400'}`}
              style={{ backgroundColor: selectedTime === v ? instData?.temaColor : 'transparent' }}>
              {v >= 168 ? `${v/168}S` : `${v}H`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {solicitudes.length === 0 && <div className="p-10 text-center text-slate-300 font-bold italic">No hay solicitudes pendientes</div>}
        {solicitudes.map(sol => (
          <div key={sol.id} className="bg-white p-6 rounded-[2rem] border border-slate-50 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-inner" style={{ backgroundColor: instData?.temaColor }}>
                <Mail size={20}/>
              </div>
              <div>
                <p className="font-black text-slate-700">{sol.email}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enviado: {new Date(sol.fechaSolicitud).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => handleAction(sol, 'rechazar')} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><X size={20}/></button>
              <button onClick={() => handleAction(sol, 'temporal')} className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase hover:bg-amber-100 transition-all">Temporal</button>
              <button onClick={() => handleAction(sol, 'docente')} 
                style={{ backgroundColor: instData?.temaColor }}
                className="px-6 py-2 text-white rounded-xl text-[10px] font-black uppercase shadow-lg transition-transform hover:scale-105">
                {loadingId === sol.id ? <Loader2 className="animate-spin w-4 h-4"/> : "Aprobar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}