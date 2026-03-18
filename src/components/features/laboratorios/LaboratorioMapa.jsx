import { useState, useEffect } from 'react';
import { db } from '../../../config/firebase';
import { 
  collection, query, where, onSnapshot, doc, updateDoc, 
  deleteDoc, serverTimestamp, addDoc 
} from 'firebase/firestore';
import { 
  ArrowLeft, Monitor, Trash2, X, Save, AlertCircle, 
  Tv, UserCheck, Send, Loader2, QrCode, Plus, Minus,
  Cpu, HardDrive, Mouse, Keyboard, Laptop, Printer
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import QRGenerator from './QRGenerator';

export default function LaboratorioMapa({ lab, inst, user, onBack, sedeNombre }) {
  const primaryColor = inst?.temaColorPrincipal || '#3b82f6';
  const isAdmin = user?.rol === 'admin_institucion' || user?.rol === 'coordinador';

  const [equipos, setEquipos] = useState([]);
  const [selectedPc, setSelectedPc] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showSingleQR, setShowSingleQR] = useState(null);
  
  // Estado para el reporte detallado
  const [reporte, setReporte] = useState({ 
    tipo: 'Hardware Dañado', 
    subTipo: 'Monitor', 
    comentario: '' 
  });

  useEffect(() => {
    const q = query(collection(db, "computadoras"), where("labId", "==", lab.id));
    const unsub = onSnapshot(q, (snap) => setEquipos(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [lab.id]);

  // Manejo de actualización individual
  const handleSaveIndividual = async () => {
    try {
      setLoading(true);
      const pcRef = doc(db, "computadoras", selectedPc.id);
      await updateDoc(pcRef, {
        ...selectedPc,
        ultimaModificacion: serverTimestamp()
      });
      setSelectedPc(null);
      alert("Estación Guardada");
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  const enviarReporte = async () => {
    setLoading(true);
    try {
        await addDoc(collection(db, "reportes"), {
            ...reporte,
            pcId: selectedPc.id,
            pcCodigo: selectedPc.codigo,
            labId: lab.id,
            instId: inst.id,
            usuario: user.email,
            estado: 'Pendiente',
            fecha: serverTimestamp()
        });
        // Marcar PC como dañada automáticamente
        await updateDoc(doc(db, "computadoras", selectedPc.id), { estado: 'dañado' });
        setShowReportModal(false);
        alert("Reporte enviado y PC marcada con fallo");
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-white z-[300] flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden font-sans">
      
      {/* HEADER DINÁMICO */}
      <div className="h-28 border-b border-slate-50 flex items-center justify-between px-12 bg-white">
        <button onClick={onBack} className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3 group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
            <span className="text-[10px] font-black uppercase tracking-widest">Panel de Labs</span>
        </button>
        <div className="text-center">
            <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{lab.nombre}</h3>
            <p className="text-[9px] font-black text-slate-400 uppercase mt-2 tracking-[0.2em]">Institución: {inst.nombre}</p>
        </div>
        <button onClick={() => setShowQR(true)} className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3 group hover:bg-slate-100 transition-colors">
            <Printer size={20} className="text-slate-600" /> 
            <span className="text-[10px] font-black uppercase tracking-widest">Imprimir Todos</span>
        </button>
      </div>

      <div className="flex-1 bg-slate-50/50 p-12 overflow-auto flex flex-col items-center">
        
        {/* ELEMENTOS EXTERNOS (DATASHOW Y DOCENTE) */}
        <div className="w-full max-w-5xl mb-12 flex justify-center gap-10">
            {/* DataShow */}
            <div className="w-64 p-6 bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-sm flex flex-col items-center relative group">
                <div className="absolute -top-1 left-10 right-10 h-1 bg-amber-400 rounded-full"></div>
                <Tv size={24} className="text-amber-500 mb-2" />
                <p className="text-[8px] font-black uppercase text-slate-400">Proyector / DataShow</p>
                <p className="text-[10px] font-black text-slate-900 uppercase mt-1 text-center">
                    {lab.datashow?.marca || 'S/D'} {lab.datashow?.modelo || ''}
                </p>
            </div>

            {/* PC Docente */}
            <div 
                className="w-64 p-6 bg-slate-900 text-white rounded-[2.5rem] shadow-xl flex flex-col items-center cursor-pointer hover:scale-105 transition-all"
                onClick={() => {
                    const pcDocente = equipos.find(e => e.esDocente);
                    if(pcDocente) setSelectedPc(pcDocente);
                    else alert("No se ha marcado una PC como 'Docente' en este lab.");
                }}
            >
                <UserCheck size={24} className="text-blue-400 mb-2" />
                <p className="text-[8px] font-black uppercase text-blue-200">Cátedra Docente</p>
                <p className="text-[10px] font-black uppercase mt-1">Ver Equipo Principal</p>
            </div>
        </div>

        {/* REJILLA DE COMPUTADORAS */}
        <div 
            className="grid gap-6 p-12 bg-white rounded-[4rem] shadow-2xl border border-slate-100"
            style={{ gridTemplateColumns: `repeat(${lab.columnas}, minmax(130px, 1fr))` }}
        >
            {Array.from({ length: lab.totalEquipos }).map((_, i) => {
                const x = i % lab.columnas;
                const y = Math.floor(i / lab.columnas);
                const pc = equipos.find(e => e.posicion?.x === x && e.posicion?.y === y);

                return (
                    <div 
                        key={i} 
                        onClick={() => pc && setSelectedPc(pc)}
                        className={`group relative aspect-square rounded-[2.5rem] border-2 transition-all flex flex-col items-center justify-center cursor-pointer ${
                            pc ? 'bg-white border-transparent shadow-sm hover:shadow-xl hover:-translate-y-1' 
                               : 'bg-slate-50 border-dashed border-slate-200 opacity-30 cursor-default'
                        }`}
                    >
                        {pc ? (
                            <>
                                <Monitor size={32} className={pc.estado === 'dañado' ? 'text-red-500 animate-pulse' : 'text-slate-300'}/>
                                <p className="text-[9px] font-black text-slate-900 uppercase mt-3 tracking-tighter">{pc.nombre || pc.codigo}</p>
                                <div className={`absolute top-4 right-4 w-3 h-3 rounded-full border-2 border-white ${pc.estado === 'operativo' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                {pc.esDocente && <div className="absolute bottom-2 bg-blue-500 text-[6px] px-2 py-0.5 rounded-full text-white font-black uppercase">Docente</div>}
                            </>
                        ) : <span className="text-[7px] font-black text-slate-300 uppercase italic">Libre</span>}
                    </div>
                );
            })}
        </div>
      </div>

      {/* SIDEBAR DE EDICIÓN Y DETALLE */}
      {selectedPc && (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl z-[350] p-12 flex flex-col animate-in slide-in-from-right-10 border-l border-slate-50 overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xl"><Monitor size={24}/></div>
                    <div>
                        <h4 className="text-2xl font-black text-slate-900 uppercase italic leading-none">{selectedPc.nombre || selectedPc.codigo}</h4>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Gestión de Estación</p>
                    </div>
                </div>
                <button onClick={() => setSelectedPc(null)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>

            <div className="space-y-8">
                {/* Identificación Manual */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-slate-50 rounded-2xl">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Nombre / ID Visual</label>
                        <input 
                            disabled={!isAdmin}
                            className="w-full bg-transparent font-black text-xs mt-1 outline-none text-blue-600" 
                            value={selectedPc.nombre || ''} 
                            placeholder="Ej: PC-01-DOC"
                            onChange={e => setSelectedPc({...selectedPc, nombre: e.target.value})} 
                        />
                    </div>
                    <div className="p-5 bg-slate-50 rounded-2xl">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Código Inventario</label>
                        <input 
                            disabled={!isAdmin}
                            className="w-full bg-transparent font-black text-xs mt-1 outline-none" 
                            value={selectedPc.codigo || ''} 
                            onChange={e => setSelectedPc({...selectedPc, codigo: e.target.value})} 
                        />
                    </div>
                </div>

                {/* QR Único (Solo Admin) */}
                {isAdmin && (
                    <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm">
                                <QrCode className="text-slate-900" size={24}/>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-900 uppercase italic">Identificador de Estación</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Acceso exclusivo mediante App SGL</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            {/* BOTÓN COPIAR URL */}
                            <button 
                                onClick={() => {
                                    const url = `https://sgl-app.web.app/pc/${selectedPc.id}`;
                                    navigator.clipboard.writeText(url);
                                    alert("Enlace copiado al portapapeles");
                                }}
                                className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase hover:bg-slate-900 hover:text-white transition-all"
                            >
                                Copiar Enlace
                            </button>

                            {/* BOTÓN VISUALIZAR QR */}
                            <button 
                                onClick={() => setShowSingleQR(selectedPc)}
                                className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-slate-200"
                            >
                                Visualizar QR
                            </button>
                        </div>
                    </div>
                )}

                {/* Hardware y SO */}
                <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><Cpu size={14}/> Configuración Técnica</h5>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <label className="text-[8px] font-black text-slate-400 uppercase">Sistema Operativo</label>
                            <input disabled={!isAdmin} className="w-full bg-transparent font-bold text-[11px] outline-none" value={selectedPc.hardware?.so || ''} onChange={e => setSelectedPc({...selectedPc, hardware: {...selectedPc.hardware, so: e.target.value}})} />
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <label className="text-[8px] font-black text-slate-400 uppercase">RAM / Disco</label>
                            <input disabled={!isAdmin} className="w-full bg-transparent font-bold text-[11px] outline-none" value={`${selectedPc.hardware?.ram || ''} / ${selectedPc.hardware?.disco || ''}`} />
                        </div>
                    </div>
                </div>

                {/* Periféricos (Manual) */}
                <div className="space-y-4">
                     <h5 className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><Mouse size={14}/> Periféricos</h5>
                     <div className="flex flex-wrap gap-2">
                        {['Mouse', 'Teclado', 'Cámara', 'Cables'].map(p => (
                            <button 
                                key={p}
                                disabled={!isAdmin}
                                onClick={() => {
                                    const actual = selectedPc.perifericos || [];
                                    const nuevos = actual.includes(p) ? actual.filter(x => x !== p) : [...actual, p];
                                    setSelectedPc({...selectedPc, perifericos: nuevos});
                                }}
                                className={`px-4 py-2 rounded-full text-[9px] font-black uppercase border-2 transition-all ${selectedPc.perifericos?.includes(p) ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                            >
                                {p}
                            </button>
                        ))}
                     </div>
                </div>

                {/* Botones de Acción Integrados */}
                <div className="pt-10 border-t border-slate-100 space-y-4">
                    
                    {/* 1. BOTÓN DE REPORTE (Visible para TODOS: Admin, Coord, Docente) */}
                    <button 
                        onClick={() => setShowReportModal(true)} 
                        className="w-full py-6 bg-red-500 text-white rounded-[2.2rem] font-black text-xs uppercase shadow-2xl flex items-center justify-center gap-3 hover:bg-red-600 transition-all active:scale-95"
                    >
                        <AlertCircle size={20}/> Reportar Fallo / Incidente
                    </button>
                    
                    {/* 2. BOTONES DE GESTIÓN (Solo visibles para Admin y Coordinador) */}
                    {isAdmin && (
                        <div className="flex gap-4">
                            {/* Guardar cambios técnicos */}
                            <button 
                                onClick={handleSaveIndividual} 
                                disabled={loading} 
                                className="flex-1 py-6 bg-slate-900 text-white rounded-[2.2rem] font-black text-xs uppercase shadow-xl flex items-center justify-center gap-2 hover:bg-black transition-all"
                            >
                                {loading ? <Loader2 className="animate-spin"/> : <Save size={18}/>} Guardar Edición
                            </button>
                            
                            {/* Cambiar rol a Docente/Cátedra */}
                            <button 
                                onClick={() => setSelectedPc({...selectedPc, esDocente: !selectedPc.esDocente})}
                                title="Marcar como PC de Cátedra"
                                className={`p-6 rounded-[2.2rem] border-2 transition-all ${selectedPc.esDocente ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-200' : 'bg-white text-slate-300 border-slate-100 hover:border-blue-200'}`}
                            >
                                <UserCheck size={24}/>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* MODAL DE REPORTE (IDÉNTICO A TU SOLICITUD) */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[400] flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-12 animate-in zoom-in">
                <div className="flex justify-between items-center mb-8">
                    <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Reportar Incidente</h4>
                    <button onClick={() => setShowReportModal(false)}><X/></button>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Categoría</label>
                        <select className="w-full p-5 bg-slate-50 rounded-2xl font-bold" onChange={e => setReporte({...reporte, tipo: e.target.value})}>
                            <option>Hardware (PC/Monitor)</option>
                            <option>Faltan Periféricos</option>
                            <option>Software / Actualización</option>
                            <option>No Enciende</option>
                        </select>
                    </div>
                    <textarea 
                        className="w-full p-5 bg-slate-50 rounded-2xl font-bold min-h-[150px] outline-none" 
                        placeholder="Escribe el comentario del fallo..." 
                        onChange={e => setReporte({...reporte, comentario: e.target.value})}
                    ></textarea>
                    <button onClick={enviarReporte} disabled={loading} className="w-full py-6 text-white rounded-[2rem] font-black text-xs uppercase shadow-2xl flex items-center justify-center gap-3" style={{ backgroundColor: primaryColor }}>
                        {loading ? <Loader2 className="animate-spin"/> : <Send size={18}/>} Enviar a Soporte
                    </button>
                </div>
            </div>
        </div>
      )}

      {showQR && <QRGenerator 
        lab={lab} 
        inst={inst} 
        pcs={equipos} 
        sedeNombre={sedeNombre || "Campus Principal"}
        onClose={() => setShowQR(false)} 
      />}

      {showSingleQR && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[600] flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-sm rounded-[4rem] shadow-2xl p-12 text-center animate-in zoom-in">
                <div className="flex justify-between items-center mb-8">
                    <h4 className="text-xl font-black uppercase italic tracking-tighter">QR de Estación</h4>
                    <button onClick={() => setShowSingleQR(null)} className="p-2 bg-slate-50 rounded-full text-slate-300 hover:text-red-500"><X/></button>
                </div>

                <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 mb-8 flex justify-center">
                    <QRCodeSVG 
                        value={`https://sgl-app.web.app/pc/${showSingleQR.id}`} 
                        size={200}
                        level="H"
                        includeMargin={true}
                    />
                </div>

                <div className="space-y-2">
                    <p className="text-lg font-black text-slate-900 uppercase italic">{showSingleQR.nombre || showSingleQR.codigo}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lab.nombre}</p>
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-[9px] font-bold text-blue-600 uppercase leading-relaxed">
                        Este QR requiere la App SGL instalada y una cuenta autorizada para visualizar los datos técnicos.
                    </p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}