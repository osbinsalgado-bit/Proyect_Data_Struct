import { useState, useEffect } from 'react';
import { Clock, Trash2, User } from 'lucide-react';
import { db } from '../../config/firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';

export default function ActiveUsersView({ institucionId, sedeId }) {
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    if (!institucionId || !sedeId) return;
    const q = query(collection(db, "usuarios"), where("institucionId", "==", institucionId), where("sedesAsignadas", "array-contains", sedeId));
    return onSnapshot(q, (snap) => {
      setUsuarios(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.rol !== 'admin_institucion' && u.rol !== 'coordinador'));
    });
  }, [institucionId, sedeId]);

  const getRestante = (expiresAt) => {
    if (!expiresAt) return <span className="text-blue-600 font-black">PERMANENTE</span>;
    const diff = expiresAt.toDate() - new Date();
    if (diff <= 0) return <span className="text-red-500 font-black">EXPIRADO</span>;
    const horas = Math.floor(diff / (1000 * 60 * 60));
    return <span className="text-amber-600">{horas}h restantes</span>;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden max-w-5xl mx-auto">
      <div className="p-6 border-b border-slate-50 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Usuarios con Acceso Activo</h3>
        <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold">{usuarios.length} Total</span>
      </div>
      <table className="w-full text-left">
        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <tr>
            <th className="p-4">Usuario / Email</th>
            <th className="p-4">Tipo de Acceso</th>
            <th className="p-4">Tiempo Restante</th>
            <th className="p-4 text-right">Acción</th>
          </tr>
        </thead>
        <tbody className="text-xs">
          {usuarios.map(u => (
            <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
              <td className="p-4 flex items-center space-x-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400"><User size={16}/></div>
                <span className="font-bold text-slate-700">{u.email}</span>
              </td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded-md font-bold uppercase text-[9px] ${u.rol === 'docente' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                  {u.rol}
                </span>
              </td>
              <td className="p-4 font-bold">{getRestante(u.expiresAt)}</td>
              <td className="p-4 text-right">
                <button onClick={() => deleteDoc(doc(db, "usuarios", u.id))} className="text-slate-300 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}