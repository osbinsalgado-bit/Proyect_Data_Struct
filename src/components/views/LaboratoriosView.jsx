import { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, onSnapshot, doc, writeBatch, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Plus, Trash2, LayoutGrid, Monitor, X, ChevronRight, Building, Loader2, Cpu, Zap } from 'lucide-react';

export default function LaboratoriosView({ inst, temaColor }) {
  const instId = inst?.id;
  const [sedes, setSedes] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Estado extendido para creación masiva
  const [nuevoLab, setNuevoLab] = useState({
    nombre: '', sedeId: '', filas: 5, columnas: 6,
    so: 'Windows 11',
    soVersion: 'Pro 23H2',
    specs: { cpu: 'Core i7 13th Gen', ram: '16GB DDR5', disk: '512GB NVMe' },
    software: ['Office 2021', 'Chrome', 'Defender']
  });

  useEffect(() => {
    if (!instId) return;
    const qSedes = query(collection(db, "sedes"), where("institucionId", "==", instId));
    onSnapshot(qSedes, (snap) => setSedes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const qLabs = query(collection(db, "laboratorios"), where("institucionId", "==", instId));
    onSnapshot(qLabs, (snap) => {
      setLabs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [instId]);

  const handleCrearMasivo = async (e) => {
    e.preventDefault();
    if (!nuevoLab.sedeId) return alert("Debes asignar una sede obligatoria");
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const labRef = doc(collection(db, "laboratorios"));
      
      batch.set(labRef, {
        id: labRef.id, ...nuevoLab, institucionId: instId, fechaCreacion: serverTimestamp()
      });

      const total = nuevoLab.filas * nuevoLab.columnas;
      for (let i = 1; i <= total; i++) {
        const pcRef = doc(collection(db, "computadoras"));
        batch.set(pcRef, {
          codigo: `${nuevoLab.nombre.substring(0,3).toUpperCase()}-PC${i.toString().padStart(2, '0')}`,
          labId: labRef.id,
          sedeId: nuevoLab.sedeId,
          institucionId: instId,
          estado: 'operativo',
          os: { nombre: nuevoLab.so, version: nuevoLab.soVersion },
          hardware: nuevoLab.specs,
          softwareInstalled: nuevoLab.software,
          posicion: i,
          fechaRegistro: serverTimestamp()
        });
      }
      await batch.commit();
      setShowModal(false);
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-300 font-black">SINCRONIZANDO INVENTARIO...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-800 italic uppercase leading-none tracking-tighter">Laboratorios</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Despliegue Masivo de Tecnología</p>
        </div>
        {sedes.length > 0 ? (
          <button onClick={() => setShowModal(true)} className="px-8 py-4 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:scale-105 transition-all" style={{ backgroundColor: temaColor }}>
            <Plus size={18} className="mr-2 inline" /> Crear Aula Inteligente
          </button>
        ) : (
          <p className="text-xs font-black text-amber-500 bg-amber-50 p-4 rounded-2xl border border-amber-100">⚠ Crea una Sede primero para habilitar laboratorios</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {labs.map(lab => (
          <div key={lab.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-8 group hover:shadow-2xl transition-all duration-500">
             <div className="flex justify-between mb-6">
                <div className="p-4 bg-slate-50 rounded-3xl text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all"><LayoutGrid size={24}/></div>
                <button onClick={() => deleteDoc(doc(db, "laboratorios", lab.id))} className="text-red-100 hover:text-red-500"><Trash2 size={18}/></button>
             </div>
             <h3 className="text-xl font-black text-slate-800 italic uppercase">{lab.nombre}</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center mt-2"><Building size={12} className="mr-1 text-blue-500"/> {sedes.find(s => s.id === lab.sedeId)?.nombre}</p>
             
             <div className="mt-6 flex space-x-3">
                <div className="flex-1 p-3 bg-slate-50 rounded-xl text-center">
                   <p className="text-[8px] font-black text-slate-400 uppercase">Equipos</p>
                   <p className="text-lg font-black text-slate-800">{lab.filas * lab.columnas}</p>
                </div>
                <div className="flex-1 p-3 bg-slate-50 rounded-xl text-center">
                   <p className="text-[8px] font-black text-slate-400 uppercase">SO Base</p>
                   <p className="text-xs font-black text-slate-800 mt-1">{lab.so}</p>
                </div>
             </div>
             <button className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg hover:translate-x-2 transition-all">Explorar Mapa Visual <ChevronRight size={14} className="ml-1 inline"/></button>
          </div>
        ))}
      </div>

      {/* MODAL CONSTRUCTOR PRO */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-5xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
             <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                <h3 className="text-2xl font-black text-slate-800 italic uppercase">Constructor de Infraestructura</h3>
                <button onClick={() => setShowModal(false)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400"><X size={24}/></button>
             </div>
             <form onSubmit={handleCrearMasivo} className="p-10 grid grid-cols-1 md:grid-cols-3 gap-10">
                
                {/* Columna 1: Datos Básicos */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Nombre del Laboratorio</label>
                        <input required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold" placeholder="Ej. Laboratorio de IA" onChange={e => setNuevoLab({...nuevoLab, nombre: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Sede Obligatoria</label>
                        <select required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs" onChange={e => setNuevoLab({...nuevoLab, sedeId: e.target.value})}>
                            <option value="">Seleccionar Campus...</option>
                            {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" min="1" className="p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold" placeholder="Filas" onChange={e => setNuevoLab({...nuevoLab, filas: parseInt(e.target.value)})} />
                        <input type="number" min="1" className="p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold" placeholder="Columnas" onChange={e => setNuevoLab({...nuevoLab, columnas: parseInt(e.target.value)})} />
                    </div>
                </div>

                {/* Columna 2: Software & OS */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Sistema Operativo</label>
                        <select className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs" onChange={e => setNuevoLab({...nuevoLab, so: e.target.value})}>
                            <option>Windows 11</option>
                            <option>Windows 10</option>
                            <option>Ubuntu Linux</option>
                            <option>macOS Sequoia</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Lista de Software (Separado por comas)</label>
                        <textarea className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs h-32" placeholder="Office, AutoCAD, VS Code, Maya..." onChange={e => setNuevoLab({...nuevoLab, software: e.target.value.split(',')})} />
                    </div>
                </div>

                {/* Columna 3: Hardware & Confirmación */}
                <div className="space-y-6 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                    <div className="flex items-center space-x-3 mb-4"><Cpu className="text-blue-500" size={20}/><h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Specs de Computadoras</h4></div>
                    <input className="w-full p-4 bg-white rounded-xl text-xs font-bold shadow-sm" placeholder="Procesador (i7, Ryzen 7...)" onChange={e => setNuevoLab({...nuevoLab, specs: {...nuevoLab.specs, cpu: e.target.value}})} />
                    <input className="w-full p-4 bg-white rounded-xl text-xs font-bold shadow-sm" placeholder="Memoria RAM (16GB, 32GB...)" onChange={e => setNuevoLab({...nuevoLab, specs: {...nuevoLab.specs, ram: e.target.value}})} />
                    
                    <div className="pt-6 border-t border-slate-200 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Total PCs a Desplegar</p>
                        <h5 className="text-4xl font-black text-slate-800 my-2">{nuevoLab.filas * nuevoLab.columnas}</h5>
                        <button type="submit" className="w-full py-5 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl flex items-center justify-center" style={{ backgroundColor: temaColor }}>
                           <Zap size={16} className="mr-2" /> Desplegar Inventario
                        </button>
                    </div>
                </div>

             </form>
          </div>
        </div>
      )}
    </div>
  );
}