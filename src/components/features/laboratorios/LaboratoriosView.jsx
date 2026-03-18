import { useState, useEffect } from 'react';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';
import { 
  collection, query, where, onSnapshot, doc, writeBatch, 
  serverTimestamp, deleteDoc 
} from 'firebase/firestore';
import { 
  Plus, Trash2, LayoutGrid, Monitor, X, ChevronRight, 
  Users, PlusCircle, Cpu, Tv, ListPlus, Save, Zap, Settings2,
  HardDrive, MousePointer2, MonitorPlay, Layers
} from 'lucide-react';
import LaboratorioMapa from './LaboratorioMapa'; 

export default function LaboratoriosView() {
  const { user, inst } = useAuth();
  const instId = inst?.id;
  const primaryColor = inst?.temaColorPrincipal || '#3b82f6';
  
  // Roles
  const isAdmin = user?.rol === 'admin_institucion' || user?.rol === 'admin';
  const isCoord = user?.rol === 'coordinador';
  const isStaff = isAdmin || isCoord;

  // Solo admin o coordinador pueden crear labs
  const puedeCrear = user?.rol === 'admin_institucion' || user?.rol === 'coordinador';

  const [sedes, setSedes] = useState([]);
  const [labs, setLabs] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeView, setActiveView] = useState('list'); 
  const [selectedLab, setSelectedLab] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [step, setStep] = useState(1);

  // ESTADO DEL CONSTRUCTOR DETALLADO
  const [nuevoLab, setNuevoLab] = useState({
    nombre: '', sedeId: '', filas: 5, columnas: 6,
    // Hardware
    cpu: { marca: '', modelo: '', so: 'Windows 11', procesador: '', ram: '16GB', disco: '512GB SSD' },
    monitor: { marca: '', modelo: '' },
    // Listas Dinámicas
    perifericos: [
        { id: 1, tipo: 'Mouse', marca: '', modelo: '' },
        { id: 2, tipo: 'Teclado', marca: '', modelo: '' }
    ],
    software: [],
    datashow: { marca: '', modelo: '' },
    currentSoftware: ''
  });

  useEffect(() => {
    if (!instId || !user) return;

    const qLabs = query(collection(db, "laboratorios"), where("institucionId", "==", instId));
    
    const unsubLabs = onSnapshot(qLabs, (snap) => {
      let allLabs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // FILTRO INTELIGENTE
      if (user.rol === 'admin_institucion' || user.rol === 'admin') {
        setLabs(allLabs); // Ve todo
      } else if (user.rol === 'coordinador') {
        // Solo laboratorios de sus sedes asignadas
        setLabs(allLabs.filter(l => user.sedesAsignadas?.includes(l.sedeId)));
      } else {
        // Docente/Temporal: Solo laboratorios donde su ID esté en la lista de asignados
        setLabs(allLabs.filter(l => user.laboratoriosAsignados?.includes(l.id)));
      }
      setLoading(false);
    });

    onSnapshot(query(collection(db, "sedes"), where("institucionId", "==", instId)), (snap) => setSedes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(query(collection(db, "usuarios"), where("institucionId", "==", instId)), (snap) => setUsuarios(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    return () => unsubLabs();
  }, [instId, user]);

  // Manejo de Listas
  const addSoftware = () => {
    if (nuevoLab.currentSoftware.trim()) {
        setNuevoLab({...nuevoLab, software: [...nuevoLab.software, nuevoLab.currentSoftware], currentSoftware: ''});
    }
  };

  const handleCrearMasivo = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const labRef = doc(collection(db, "laboratorios"));
      const total = nuevoLab.filas * nuevoLab.columnas;

      // Guardar el Lab
      batch.set(labRef, {
        ...nuevoLab,
        id: labRef.id,
        institucionId: instId,
        totalEquipos: total,
        fechaCreacion: serverTimestamp()
      });

      // Crear PCs individualmente
      for (let i = 1; i <= total; i++) {
        const pcRef = doc(collection(db, "computadoras"));
        batch.set(pcRef, {
          labId: labRef.id,
          institucionId: instId,
          codigo: `${nuevoLab.nombre}-PC${i.toString().padStart(2, '0')}`,
          posicion: { x: (i - 1) % nuevoLab.columnas, y: Math.floor((i - 1) / nuevoLab.columnas) },
          estado: 'operativo',
          hardware: nuevoLab.cpu,
          monitor: nuevoLab.monitor,
          perifericos: nuevoLab.perifericos,
          software: nuevoLab.software
        });
      }

      await batch.commit();
      setShowCreateModal(false);
      alert("Despliegue Masivo Completado");
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  if (activeView === 'map') return (
    <LaboratorioMapa 
      lab={selectedLab} 
      inst={inst} 
      user={user} 
      sedeNombre={sedes.find(s => s.id === selectedLab.sedeId)?.nombre} 
      onBack={() => setActiveView('list')} 
    />
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-700 pb-20">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-800 italic uppercase leading-none tracking-tighter">Laboratorios</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{isStaff ? 'Panel de Administración' : 'Vista de Usuario'}</p>
        </div>
        {isStaff && (
          <button onClick={() => { setStep(1); setShowCreateModal(true); }} className="px-8 py-4 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:scale-105 transition-all" style={{ backgroundColor: primaryColor }}>
            + Nuevo Despliegue
          </button>
        )}
      </div>

      {/* GRID DE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {labs.map((lab, index) => (
          <div 
            key={lab.id}
            className="bg-white rounded-[3rem] border border-slate-100 shadow-sm flex flex-col group hover:shadow-2xl transition-all duration-500 border-b-[6px] animate-in fade-in zoom-in duration-500" 
            style={{ 
              borderBottomColor: primaryColor,
              animationDelay: `${index * 100}ms`
            }}
          >
            <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                    <div className="p-4 bg-slate-50 rounded-3xl text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all">
                        <Monitor size={24}/>
                    </div>
                    {isStaff && <button onClick={() => deleteDoc(doc(db, "laboratorios", lab.id))} className="text-slate-100 hover:text-red-500"><Trash2 size={20}/></button>}
                </div>

                <h3 className="text-xl font-black text-slate-800 uppercase italic leading-none">{lab.nombre}</h3>
                
                {/* INFO EXTERNA REQUERIDA */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase">Estaciones</p>
                        <p className="text-lg font-black text-slate-800">{lab.totalEquipos}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase">S.O. Instalado</p>
                        <p className="text-[10px] font-black text-slate-800 uppercase truncate mt-1">{lab.cpu?.so}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {isStaff && (
                        <button onClick={() => { setSelectedLab(lab); setShowAccessModal(true); }} className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-[9px] uppercase hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                            <Users size={14}/> Accesos
                        </button>
                    )}
                    <button onClick={() => { setSelectedLab(lab); setActiveView('map'); }} className="flex-1 py-4 text-white rounded-2xl font-black text-[9px] uppercase shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2" style={{ backgroundColor: primaryColor }}>
                        <LayoutGrid size={14}/> Modo Escenario
                    </button>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL CONSTRUCTOR (6 NIVELES) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in border-[10px] border-white/20">
             <div className="flex border-b border-slate-50 bg-slate-50/50">
                {[1,2,3,4,5,6].map(n => (
                    <div key={n} className={`flex-1 p-6 text-center transition-all ${step === n ? 'bg-white border-b-4' : 'opacity-30'}`} style={step === n ? { borderColor: primaryColor } : {}}>
                        <p className="text-[8px] font-black uppercase text-slate-400">Nivel {n}</p>
                    </div>
                ))}
                <button onClick={() => setShowCreateModal(false)} className="p-6 text-slate-300 hover:text-red-500"><X size={24}/></button>
             </div>

             <div className="p-12 space-y-8 max-h-[60vh] overflow-y-auto">
                {step === 1 && (
                    <div className="grid grid-cols-2 gap-10 animate-in slide-in-from-right-4">
                        <div className="space-y-6">
                            <h4 className="text-2xl font-black text-slate-800 uppercase italic">General</h4>
                            <input className="w-full p-5 bg-slate-50 rounded-2xl font-bold" placeholder="Nombre del Lab" onChange={e => setNuevoLab({...nuevoLab, nombre: e.target.value})} />
                            <select className="w-full p-5 bg-slate-50 rounded-2xl font-bold" onChange={e => setNuevoLab({...nuevoLab, sedeId: e.target.value})}>
                                <option value="">Seleccionar Sede</option>
                                {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                            </select>
                        </div>
                        <div className="bg-slate-50 rounded-[3rem] p-10 flex flex-col items-center justify-center border-2 border-dashed border-slate-200">
                             <div className="flex items-center gap-4">
                                <input type="number" className="w-20 p-4 bg-white rounded-2xl text-center font-black" value={nuevoLab.filas} onChange={e => setNuevoLab({...nuevoLab, filas: e.target.value})} />
                                <span className="font-black text-slate-200">X</span>
                                <input type="number" className="w-20 p-4 bg-white rounded-2xl text-center font-black" value={nuevoLab.columnas} onChange={e => setNuevoLab({...nuevoLab, columnas: e.target.value})} />
                             </div>
                             <p className="mt-6 text-3xl font-black" style={{ color: primaryColor }}>{nuevoLab.filas * nuevoLab.columnas} <span className="text-xs text-slate-400">PCs</span></p>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <h4 className="text-2xl font-black text-slate-800 uppercase italic">Especificaciones CPU</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <input className="p-5 bg-slate-50 rounded-2xl font-bold" placeholder="Marca" onChange={e => setNuevoLab({...nuevoLab, cpu: {...nuevoLab.cpu, marca: e.target.value}})} />
                            <input className="p-5 bg-slate-50 rounded-2xl font-bold" placeholder="Modelo" onChange={e => setNuevoLab({...nuevoLab, cpu: {...nuevoLab.cpu, modelo: e.target.value}})} />
                            <input className="p-5 bg-slate-50 rounded-2xl font-bold" placeholder="Procesador (Ej: Core i7)" onChange={e => setNuevoLab({...nuevoLab, cpu: {...nuevoLab.cpu, procesador: e.target.value}})} />
                            <input className="p-5 bg-slate-50 rounded-2xl font-bold" placeholder="S.O. (Ej: Windows 11)" onChange={e => setNuevoLab({...nuevoLab, cpu: {...nuevoLab.cpu, so: e.target.value}})} />
                            <input className="p-5 bg-slate-50 rounded-2xl font-bold" placeholder="RAM" onChange={e => setNuevoLab({...nuevoLab, cpu: {...nuevoLab.cpu, ram: e.target.value}})} />
                            <input className="p-5 bg-slate-50 rounded-2xl font-bold" placeholder="Almacenamiento" onChange={e => setNuevoLab({...nuevoLab, cpu: {...nuevoLab.cpu, disco: e.target.value}})} />
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <h4 className="text-2xl font-black text-slate-800 uppercase italic">Monitor</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <input className="p-5 bg-slate-50 rounded-2xl font-bold" placeholder="Marca Monitor" onChange={e => setNuevoLab({...nuevoLab, monitor: {...nuevoLab.monitor, marca: e.target.value}})} />
                            <input className="p-5 bg-slate-50 rounded-2xl font-bold" placeholder="Modelo Monitor" onChange={e => setNuevoLab({...nuevoLab, monitor: {...nuevoLab.monitor, modelo: e.target.value}})} />
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <h4 className="text-2xl font-black text-slate-800 uppercase italic">Periféricos</h4>
                        {nuevoLab.perifericos.map((p, i) => (
                            <div key={p.id} className="grid grid-cols-3 gap-4 p-5 bg-slate-50 rounded-2xl">
                                <span className="font-black text-slate-400 uppercase text-[10px]">{p.tipo}</span>
                                <input className="bg-white p-3 rounded-xl text-xs font-bold" placeholder="Marca" onChange={e => { let n = [...nuevoLab.perifericos]; n[i].marca = e.target.value; setNuevoLab({...nuevoLab, perifericos: n}); }} />
                                <input className="bg-white p-3 rounded-xl text-xs font-bold" placeholder="Modelo" onChange={e => { let n = [...nuevoLab.perifericos]; n[i].modelo = e.target.value; setNuevoLab({...nuevoLab, perifericos: n}); }} />
                            </div>
                        ))}
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 text-center">
                        <Tv size={48} className="mx-auto text-amber-500 mb-4" />
                        <h4 className="text-2xl font-black text-slate-800 uppercase italic">DataShow / Proyector</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <input className="p-5 bg-slate-50 rounded-2xl font-bold" placeholder="Marca" onChange={e => setNuevoLab({...nuevoLab, datashow: {...nuevoLab.datashow, marca: e.target.value}})} />
                            <input className="p-5 bg-slate-50 rounded-2xl font-bold" placeholder="Modelo" onChange={e => setNuevoLab({...nuevoLab, datashow: {...nuevoLab.datashow, modelo: e.target.value}})} />
                        </div>
                    </div>
                )}

                {step === 6 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <h4 className="text-2xl font-black text-slate-800 uppercase italic">Software Base</h4>
                        <div className="flex gap-4">
                            <input className="flex-1 p-5 bg-slate-50 rounded-2xl font-bold" placeholder="Nombre del Programa" value={nuevoLab.currentSoftware} onChange={e => setNuevoLab({...nuevoLab, currentSoftware: e.target.value})} />
                            <button onClick={addSoftware} className="px-10 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px]">Añadir</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {nuevoLab.software.map(s => <span key={s} className="px-6 py-2 bg-slate-100 rounded-full font-black text-[10px] uppercase text-slate-600 border border-slate-200">{s}</span>)}
                        </div>
                        <button onClick={handleCrearMasivo} className="w-full py-7 text-white rounded-[2.5rem] font-black uppercase text-xs shadow-2xl mt-10" style={{ backgroundColor: primaryColor }}>
                           <Zap size={18} className="inline mr-2 text-amber-300" /> Iniciar Despliegue Atómico
                        </button>
                    </div>
                )}

                <div className="flex justify-between pt-10">
                    {step > 1 && <button onClick={() => setStep(step - 1)} className="px-10 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase">Anterior</button>}
                    <div className="flex-1"></div>
                    {step < 6 && <button onClick={() => setStep(step + 1)} className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl">Siguiente Nivel</button>}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* MODAL ACCESOS (Búsqueda Jerárquica) */}
      {showAccessModal && selectedLab && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase italic leading-none tracking-tighter">{selectedLab.nombre}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Personal con Autorización</p>
                    </div>
                    <button onClick={() => setShowAccessModal(false)} className="p-3 bg-white rounded-2xl shadow-sm hover:text-red-500 transition-colors"><X size={24}/></button>
                </div>

                <div className="p-10 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {usuarios
                      .filter(u => {
                        // 1. Es el Admin de la Institución
                        if (u.rol === 'admin_institucion' || u.rol === 'admin') return true;
                        
                        // 2. Es Coordinador y tiene asignada la SEDE de este laboratorio
                        if (u.rol === 'coordinador' && u.sedesAsignadas?.includes(selectedLab.sedeId)) return true;
                        
                        // 3. Es Docente/Temporal y tiene asignado este LABORATOTIO específicamente
                        if (u.laboratoriosAsignados?.includes(selectedLab.id)) return true;

                        return false;
                      })
                      .sort((a, b) => {
                        // Ordenar para que el Admin salga primero, luego coordinadores
                        const rolesOrder = { 'admin_institucion': 1, 'admin': 1, 'coordinador': 2, 'docente': 3, 'temporal': 4 };
                        return (rolesOrder[a.rol] || 99) - (rolesOrder[b.rol] || 99);
                      })
                      .map(u => (
                        <div key={u.id} className="group p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg" 
                                     style={{ backgroundColor: u.rol === 'admin_institucion' ? '#000' : (u.rol === 'coordinador' ? primaryColor : '#94a3b8') }}>
                                    {u.nombre?.charAt(0) || u.email?.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-800 leading-none mb-1">{u.nombre || 'Usuario SGL'}</p>
                                    <p className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{u.email}</p>
                                </div>
                            </div>
                            
                            <div className="text-right">
                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 ${
                                    u.rol.includes('admin') ? 'bg-slate-900 text-white border-slate-900' : 
                                    u.rol === 'coordinador' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                    'bg-white text-slate-400 border-slate-100'
                                }`}>
                                    {u.rol === 'admin_institucion' ? 'Master' : u.rol}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="p-8 bg-slate-50/50 text-center">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Seguridad por Roles Activa</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}