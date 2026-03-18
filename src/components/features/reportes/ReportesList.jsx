import { useState, useEffect } from 'react';
import { db } from '../../../config/firebase';
import { 
  collection, query, where, onSnapshot, doc, 
  updateDoc, serverTimestamp 
} from 'firebase/firestore';
import { 
  AlertTriangle, Clock, CheckCircle2, MessageSquare, 
  User, Monitor, Calendar, X, CheckCircle, Loader2
} from 'lucide-react';

export default function ReportesList({ inst, user }) {
  const [reportes, setReportes] = useState([]);
  const [filtro, setFiltro] = useState('Pendiente');
  const [selectedRep, setSelectedRep] = useState(null);
  const [resComentario, setResComentario] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  const primaryColor = inst?.temaColorPrincipal || '#3b82f6';

  useEffect(() => {
    if (!inst?.id || !user) return;

    let q = query(collection(db, "reportes"), where("instId", "==", inst.id));

    // SI NO ES STAFF, SOLO VE SUS PROPIOS REPORTES (Por Email)
    const isStaff = user.rol === 'admin_institucion' || user.rol === 'coordinador';
    
    if (!isStaff) {
      q = query(q, where("usuarioEmail", "==", user.email));
    }

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // ORDENAMOS POR FECHA AQUÍ EN EL CLIENTE (Mismo resultado, sin errores)
      const ordenados = docs.sort((a, b) => {
        const fechaA = a.fecha?.seconds || 0;
        const fechaB = b.fecha?.seconds || 0;
        return fechaB - fechaA; // De más reciente a más antiguo
      });

      setReportes(ordenados);
    }, (error) => {
        console.error("Error en el listener:", error);
    });

    return () => unsub();
  }, [inst?.id, user]);

  const handleCambiarEstado = async (nuevoEstado) => {
    if (!selectedRep) return;
    setLoadingAction(true);

    try {
      // 1. Actualizar Reporte
      const reporteRef = doc(db, "reportes", selectedRep.id);
      await updateDoc(reporteRef, {
        estado: nuevoEstado,
        comentarioResolucion: resComentario || 'Sin observaciones adicionales.',
        tecnicoEmail: user.email,
        tecnicoNombre: user.nombre || 'Administrador',
        fechaResolucion: serverTimestamp()
      });

      // 2. Actualizar Computadora (para el mapa)
      const pcRef = doc(db, "computadoras", selectedRep.pcId);
      const estadoPc = nuevoEstado === 'Reparado' ? 'operativo' : 'revisando';
      await updateDoc(pcRef, { estado: estadoPc });

      // CERRAR MODAL - El onSnapshot refrescará la lista solo
      setSelectedRep(null);
      setResComentario('');
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Filtrado dinámico
  const filtrados = reportes.filter(r => {
    if (filtro === 'Todos') return true;
    return r.estado === filtro;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* SELECTOR DE FILTROS */}
      <div className="flex justify-between items-center bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">Bandeja Técnica</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
            Total en sistema: {reportes.length} incidentes
          </p>
        </div>

        <div className="flex bg-slate-100 p-2 rounded-full gap-2">
          {['Pendiente', 'En Revisión', 'Reparado', 'Todos'].map(f => (
            <button 
                key={f} 
                onClick={() => setFiltro(f)}
                className={`px-8 py-3 rounded-full text-[10px] font-black uppercase transition-all ${
                    filtro === f ? 'bg-white shadow-xl text-slate-900 scale-105' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              {f} ({reportes.filter(r => r.estado === f || f === 'Todos').length})
            </button>
          ))}
        </div>
      </div>

      {/* LISTA DE CARDS */}
      <div className="grid gap-4">
        {filtrados.length > 0 ? filtrados.map(rep => (
          <div 
            key={rep.id} 
            onClick={() => setSelectedRep(rep)}
            className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
          >
            {/* Barra lateral de color según estado */}
            <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                rep.estado === 'Pendiente' ? 'bg-red-500' : 
                rep.estado === 'En Revisión' ? 'bg-amber-500' : 'bg-green-500'
            }`}></div>

            <div className="flex items-center gap-8">
              <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center ${
                rep.estado === 'Pendiente' ? 'bg-red-50 text-red-500' : 
                rep.estado === 'En Revisión' ? 'bg-amber-50 text-amber-500' : 'bg-green-50 text-green-500'
              }`}>
                {rep.estado === 'Pendiente' ? <AlertTriangle size={32}/> : rep.estado === 'En Revisión' ? <Clock size={32}/> : <CheckCircle2 size={32}/>}
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-4">
                  <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{rep.pcCodigo}</h4>
                  <span className="px-3 py-1 bg-slate-900 text-white text-[8px] font-black uppercase rounded-lg tracking-widest">{rep.subTipo || 'General'}</span>
                </div>
                <p className="text-slate-500 font-bold text-sm italic line-clamp-1">"{rep.comentario}"</p>
                <div className="flex gap-4 pt-1">
                    <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-300 uppercase"><User size={12}/> {rep.usuario}</span>
                    <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-300 uppercase"><Calendar size={12}/> {rep.fecha?.toDate().toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
                <div className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase text-white shadow-lg ${
                    rep.estado === 'Pendiente' ? 'bg-red-500 shadow-red-100' : 
                    rep.estado === 'En Revisión' ? 'bg-amber-500 shadow-amber-100' : 'bg-green-500 shadow-green-100'
                }`}>
                    {rep.estado}
                </div>
                <p className="text-[8px] font-black text-slate-200 uppercase mt-3">Click para gestionar</p>
            </div>
          </div>
        )) : (
            <div className="py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-50">
                <p className="text-slate-300 font-black uppercase tracking-[0.5em] italic">No hay registros en esta sección</p>
            </div>
        )}
      </div>

      {/* MODAL DE GESTIÓN */}
      {selectedRep && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[500] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                
                <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">{selectedRep.pcCodigo}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gestión de Mantenimiento</p>
                    </div>
                    <button onClick={() => setSelectedRep(null)} className="p-4 bg-white rounded-3xl text-slate-300 hover:text-red-500 transition-all shadow-sm"><X size={24}/></button>
                </div>

                <div className="p-12 space-y-8">
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-3">Reporte del Usuario:</label>
                        <p className="text-slate-800 font-bold text-lg leading-relaxed italic">"{selectedRep.comentario}"</p>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-4">Notas Técnicas / Resolución</label>
                        <textarea 
                            className="w-full p-8 bg-slate-50 rounded-[2.5rem] font-bold text-slate-900 outline-none focus:ring-4 transition-all"
                            placeholder="Escribe qué acciones se tomaron..."
                            value={resComentario || selectedRep.comentarioResolucion || ''}
                            onChange={(e) => setResComentario(e.target.value)}
                        ></textarea>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button 
                            disabled={loadingAction}
                            onClick={() => handleCambiarEstado('En Revisión')}
                            className="flex-1 py-6 bg-amber-500 text-white rounded-[2rem] font-black text-xs uppercase shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                        >
                            {loadingAction ? <Loader2 className="animate-spin"/> : <Clock size={18}/>} Mover a Revisión
                        </button>
                        <button 
                            disabled={loadingAction}
                            onClick={() => handleCambiarEstado('Reparado')}
                            className="flex-1 py-6 bg-green-600 text-white rounded-[2rem] font-black text-xs uppercase shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                        >
                            {loadingAction ? <Loader2 className="animate-spin"/> : <CheckCircle size={18}/>} Marcar Reparado
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}