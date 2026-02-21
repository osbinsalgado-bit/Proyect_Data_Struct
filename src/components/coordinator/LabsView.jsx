import { useState, useEffect } from 'react';
import { Monitor, Plus, Settings } from 'lucide-react';
import { db } from '../../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function LabsView({ institucionId, sedeId }) {
  const [labs, setLabs] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "laboratorios"), where("sedeId", "==", sedeId));
    return onSnapshot(q, (snap) => {
      setLabs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [sedeId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">Gestión de Laboratorios</h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center shadow-lg shadow-blue-100">
          <Plus size={18} className="mr-2" /> Nuevo Laboratorio
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {labs.map(lab => (
          <div key={lab.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Monitor size={24} />
            </div>
            <h4 className="font-bold text-slate-800 text-lg">{lab.nombre}</h4>
            <p className="text-sm text-slate-400 font-medium">Capacidad: {lab.filasGrid * lab.columnasGrid} Equipos</p>
            <button className="mt-4 w-full py-2 bg-slate-50 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-100 flex justify-center items-center">
              <Settings size={14} className="mr-2" /> Gestionar Mapa
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}