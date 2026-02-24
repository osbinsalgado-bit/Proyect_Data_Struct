import { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, onSnapshot, doc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { MapPin, Plus, Trash2, Building2, X, ChevronRight, Map } from 'lucide-react';

export default function SedesView({ inst, temaColor, onVerLaboratorios }) {
  const instId = inst?.id; 
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [nuevaSede, setNuevaSede] = useState({ nombre: '', ubicacion: '' });
  const [coordinadores, setCoordinadores] = useState([]);

  useEffect(() => {
    if (!instId) return;
    const q = query(collection(db, "sedes"), where("institucionId", "==", instId));
    const unsub = onSnapshot(q, (snap) => {
      setSedes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [instId]);

  useEffect(() => {
    if (!instId) return;
    const q = query(collection(db, "usuarios"), where("institucionId", "==", instId), where("rol", "==", "coordinador"));
    const unsub = onSnapshot(q, (snap) => {
      setCoordinadores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [instId]);

  const handleCrearSede = async (e) => {
    e.preventDefault();
    if (!nuevaSede.nombre || !nuevaSede.ubicacion) return;
    try {
      await addDoc(collection(db, "sedes"), {
        nombre: nuevaSede.nombre,
        ubicacion: nuevaSede.ubicacion,
        institucionId: instId,
        coordinadoresIds: [],
        fechaCreacion: serverTimestamp()
      });
      setShowModal(false);
      setNuevaSede({ nombre: '', ubicacion: '' });
    } catch (err) { alert("Error al registrar: " + err.message); }
  };

  if (loading) return <div className="p-20 text-center animate-pulse font-black text-slate-300 uppercase tracking-widest">Sincronizando Sedes...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700 pb-20">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-800 italic uppercase leading-none tracking-tighter">Campus Globales</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Gestión de recintos físicos</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-8 py-4 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:scale-105 transition-all" style={{ backgroundColor: temaColor }}>
          <Plus size={18} className="mr-2 inline" /> Registrar Nueva Sede
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sedes.map(sede => (
          <div key={sede.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-500 border-b-[6px]" style={{ borderBottomColor: temaColor }}>
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="p-4 bg-slate-50 rounded-3xl text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all"><Building2 size={24} /></div>
                <button onClick={() => deleteDoc(doc(db, "sedes", sede.id))} className="p-2 text-red-100 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">{sede.nombre}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center mt-2 tracking-tighter"><MapPin size={12} className="mr-1" /> {sede.ubicacion}</p>
              </div>

              <div className="pt-4 border-t border-slate-50">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Equipo de Mando</p>
                <div className="flex flex-wrap gap-2">
                  {sede.coordinadoresIds?.length > 0 ? (
                    sede.coordinadoresIds.map(cid => {
                      const name = coordinadores.find(u => u.id === cid)?.nombre || "Cargando...";
                      return (
                        <span key={cid} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black text-slate-600 uppercase">
                          {name}
                        </span>
                      )
                    })
                  ) : (
                    <span className="text-[9px] font-black text-amber-500 bg-amber-50 px-3 py-1.5 rounded-xl uppercase italic">Sin Coordinador Asignado</span>
                  )}
                </div>
              </div>

              <button 
                onClick={() => onVerLaboratorios(sede.id)} 
                className="w-full py-4 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] transition-all flex justify-center items-center" 
                style={{ backgroundColor: `${temaColor}10`, color: temaColor }}
              >
                Ver Inventario de Sede <ChevronRight size={14} className="ml-1"/>
              </button>
            </div>
          </div>
        ))}
        <button onClick={() => setShowModal(true)} className="border-4 border-dashed border-slate-200 rounded-[3rem] p-10 flex flex-col items-center justify-center text-slate-300 hover:border-slate-400 hover:text-slate-400 transition-all">
           <Map size={40} className="mb-4" />
           <span className="font-black text-[10px] uppercase tracking-widest">Añadir Sede</span>
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl animate-in zoom-in duration-300">
             <div className="p-10 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-800 italic uppercase leading-none">Nueva Sede</h3>
                <button onClick={() => setShowModal(false)} className="p-2 bg-slate-50 rounded-xl"><X size={20} className="text-slate-400"/></button>
             </div>
             <form onSubmit={handleCrearSede} className="p-10 space-y-6">
                <input required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" placeholder="Nombre (Ej. Campus Central)" value={nuevaSede.nombre} onChange={e => setNuevaSede({...nuevaSede, nombre: e.target.value})} />
                <input required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" placeholder="Ubicación (Ej. San Pedro Sula)" value={nuevaSede.ubicacion} onChange={e => setNuevaSede({...nuevaSede, ubicacion: e.target.value})} />
                <button type="submit" className="w-full py-5 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl" style={{ backgroundColor: temaColor }}>Confirmar Registro</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}