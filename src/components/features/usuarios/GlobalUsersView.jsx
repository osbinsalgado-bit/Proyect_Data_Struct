import { useState, useEffect } from 'react';
import { db } from '../../../config/firebase';
import { 
  collection, query, where, onSnapshot, doc, getDocs,
  addDoc, deleteDoc, Timestamp 
} from 'firebase/firestore';
import { 
  Search, UserPlus, Trash2, ShieldCheck, Clock, 
  X, Check, AlertCircle, Mail, Calendar, Users, Bell,
  Building, Layout, ChevronDown, Globe, Fingerprint, Key, MessageSquare
} from 'lucide-react';
import { sendBrandedEmail } from '../../../services/emailService';

// --- Ayuda para tiempo restante ---
const formatTimeRemaining = (expirationTimestamp) => {
  if (!expirationTimestamp) return 'N/A';
  const now = new Date();
  const expires = expirationTimestamp.toDate();
  const diff = expires.getTime() - now.getTime();
  if (diff <= 0) return 'Expirado';
  const minutes = Math.floor(diff / 1000 / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} día${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''}`;
  return `${minutes} min`;
};

export default function GlobalUsersView({ inst, temaColor, currentUser }) {
  const instId = inst?.id; 
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('todos');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);

  // NUEVO: Para vincular la aprobación con la solicitud
  const [pendingRequest, setPendingRequest] = useState(null);

  const [newUser, setNewUser] = useState({ 
    nombre: '', email: '', rol: 'docente', duracion: '1d',
    sedeId: '', labId: ''
  });

  // --- CARGA DE DATOS ---
  useEffect(() => {
    if (!instId) return;

    const qUsers = query(collection(db, "usuarios"), where("institucionId", "==", instId));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      let lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // --- LÓGICA DE FILTRADO JERÁRQUICO ---
      if (currentUser && currentUser.rol !== 'admin_institucion') {
        lista = lista.filter(u => {
          // 1. NUNCA ver al Admin Maestro
          if (u.rol === 'admin_institucion') return false;

          // 2. Ver otros coordinadores de su misma sede (para referencia)
          const comparteSede = u.sedesAsignadas?.some(sId => currentUser?.sedesAsignadas?.includes(sId));
          if (u.rol === 'coordinador' && comparteSede) return true;

          // 3. Ver docentes/temporales asignados a sus laboratorios
          if (u.rol === 'docente' || u.rol === 'temporal') {
            const comparteLabOrSede = u.laboratoriosAsignados?.some(lId => currentUser?.laboratoriosAsignados?.includes(lId)) || 
                                      u.sedesAsignadas?.some(sId => currentUser?.sedesAsignadas?.includes(sId));
            return comparteLabOrSede;
          }

          return false;
        });
      }
      
      setUsers(lista);
      setLoading(false);
    });

    const qReqs = query(collection(db, "solicitudes"), where("institucionId", "==", instId), where("status", "==", "pendiente"));
    const unsubReqs = onSnapshot(qReqs, (snap) => setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    const fetchData = async () => {
        const sSnap = await getDocs(query(collection(db, "sedes"), where("institucionId", "==", instId)));
        setSedes(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        const lSnap = await getDocs(query(collection(db, "laboratorios"), where("institucionId", "==", instId)));
        setLabs(lSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchData();

    return () => { unsubUsers(); unsubReqs(); };
  }, [instId, currentUser]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const selectedSede = sedes.find(s => s.id === newUser.sedeId);
      const sedeNombre = selectedSede?.nombre || '';
      const selectedLab = labs.find(l => l.id === newUser.labId);
      const labNombre = selectedLab?.nombre || '';

      let expiraEn = null;
      if (newUser.rol === 'temporal') {
        const expirationDate = new Date();
        if (newUser.duracion === '8h') expirationDate.setHours(expirationDate.getHours() + 8);
        else if (newUser.duracion === '1d') expirationDate.setDate(expirationDate.getDate() + 1);
        else if (newUser.duracion === '3d') expirationDate.setDate(expirationDate.getDate() + 3);
        else if (newUser.duracion === '1w') expirationDate.setDate(expirationDate.getDate() + 7);
        expiraEn = expirationDate;
      }

      // 1. Guardar Usuario
      await addDoc(collection(db, "usuarios"), {
        nombre: newUser.nombre,
        email: newUser.email,
        rol: newUser.rol,
        institucionId: instId,
        status: 'pendiente',
        fechaCreacion: Timestamp.fromDate(new Date()),
        sedesAsignadas: [newUser.sedeId],
        laboratoriosAsignados: newUser.rol === 'coordinador' ? ['todos'] : [newUser.labId],
        expiraEn: expiraEn ? Timestamp.fromDate(expiraEn) : null
      });

      // 2. Si venía de una solicitud, borrarla
      if (pendingRequest) {
        await deleteDoc(doc(db, "solicitudes", pendingRequest.id));
      }
      
      const activationLink = `${window.location.origin}/establecer-contrasena?email=${encodeURIComponent(newUser.email)}&instId=${instId}`;
      await sendBrandedEmail(newUser.email, `Invitación - ${inst.nombre}`, inst, `<h2>¡Hola!</h2><p>Has sido invitado a ${inst.nombre}. <a href="${activationLink}">Activa aquí</a></p>`);

      setShowAddModal(false);
      setPendingRequest(null);
      setNewUser({ nombre: '', email: '', rol: 'docente', duracion: '1d', sedeId: '', labId: '' });
    } catch (err) { alert(err.message); }
  };

  const stats = {
    total: users.length,
    coords: users.filter(u => u.rol === 'coordinador').length,
    docentes: users.filter(u => u.rol === 'docente' && u.status === 'activo').length,
    pending: users.filter(u => u.status === 'pendiente').length,
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && (filterRole === 'todos' || u.rol === filterRole);
  });

  const handleDeleteUser = async (user) => {
    // REGLA DE ELIMINACIÓN: 
    // 1. Admin puede eliminar a todos menos a sí mismo.
    // 2. Coordinador solo puede eliminar Docentes/Temporales (No a otros coordinadores) 
    const isAdmin = currentUser?.rol === 'admin_institucion';
    const canDelete = (isAdmin && user.id !== currentUser.id) || (!isAdmin && (user.rol === 'docente' || user.rol === 'temporal'));
    
    if (!canDelete) {
      alert("No tienes permiso para eliminar este usuario.");
      return;
    }
    
    if (window.confirm(`¿Seguro que deseas eliminar a ${user.nombre}?`)) {
        try {
            await deleteDoc(doc(db, "usuarios", user.id));
            alert("Usuario eliminado");
        } catch (err) {
            alert("Error al eliminar: " + err.message);
        }
    }
};

  if (loading || !instId) return <div className="p-20 text-center text-slate-300 font-black animate-pulse">CARGANDO NÚCLEO...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700 pb-20">
      
      {/* HEADER (Tu diseño original) */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-800 italic uppercase leading-none tracking-tighter">Usuarios</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Control Maestro de Accesos</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setShowRequestsModal(true)} className="relative p-4 bg-slate-50 rounded-2xl">
            <Bell size={22} className="text-slate-400" />
            {requests.length > 0 && <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-4 border-white">{requests.length}</span>}
          </button>
          <button onClick={() => { setPendingRequest(null); setShowAddModal(true); }} className="flex items-center px-8 py-4 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl" style={{ backgroundColor: temaColor }}>
            <UserPlus size={18} className="mr-3" /> Invitar Miembro
          </button>
        </div>
      </div>

      {/* STATS (Tu diseño original) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Miembros', value: stats.total, icon: Users, color: temaColor },
          { label: 'Coordinadores', value: stats.coords, icon: ShieldCheck, color: '#6366f1' },
          { label: 'Docentes (Activos)', value: stats.docentes, icon: Globe, color: '#10b981' },
          { label: 'Pendientes Activar', value: stats.pending, icon: Clock, color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="p-3 w-fit rounded-2xl mb-4" style={{ backgroundColor: `${s.color}10`, color: s.color }}><s.icon size={20}/></div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{s.label}</p>
            <h3 className="text-4xl font-black text-slate-800 mt-2">{s.value}</h3>
          </div>
        ))}
      </div>

      {/* TABLA (Tu diseño original + Arreglo de N/A) */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
           <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-inner">
              {['todos', 'coordinador', 'docente', 'temporal'].map(r => (
                <button key={r} onClick={() => setFilterRole(r)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterRole === r ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`} style={filterRole === r ? { backgroundColor: temaColor } : {}}>{r}</button>
              ))}
           </div>
           <div className="relative w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input type="text" placeholder="Buscar..." className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none text-xs font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
           </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-4 text-[9px] font-black uppercase text-slate-400 tracking-widest">Miembro</th>
              <th className="px-8 py-4 text-[9px] font-black uppercase text-slate-400 tracking-widest">Rol</th>
              <th className="px-8 py-4 text-[9px] font-black uppercase text-slate-400 tracking-widest">Sede / Laboratorio</th>
              <th className="px-8 py-4 text-[9px] font-black uppercase text-slate-400 tracking-widest">Estado</th>
              <th className="px-8 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredUsers.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="p-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center font-black text-slate-300">{u.nombre?.charAt(0)}</div>
                    <div><p className="text-base font-black text-slate-800 leading-none mb-1">{u.nombre}</p><p className="text-xs font-bold text-slate-400">{u.email}</p></div>
                  </div>
                </td>
                <td className="p-8"><span className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase text-slate-500">{u.rol}</span></td>
                <td className="p-8">
                  {/* FIX: Se agregó el .toString() para asegurar coincidencia de IDs */}
                  <p className="text-sm font-bold text-slate-800 leading-none">
                    {sedes.find(s => s.id.toString() === u.sedesAsignadas?.[0]?.toString())?.nombre || 'Sede N/A'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {u.rol !== 'coordinador' ? (labs.find(l => l.id.toString() === u.laboratoriosAsignados?.[0]?.toString())?.nombre || 'Lab N/A') : 'Todos los Labs'}
                  </p>
                </td>
                <td className="p-8">
                  <span className={`flex items-center text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full w-fit ${u.status === 'pendiente' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                    {u.status === 'pendiente' ? 'Invitación Enviada' : 'Cuenta Activa'}
                  </span>
                </td>
                <td className="p-8 text-right">
                   {(((currentUser?.rol === 'admin_institucion') && u.id !== currentUser?.id) || ((currentUser?.rol !== 'admin_institucion') && (u.rol === 'docente' || u.rol === 'temporal'))) && (
                     <button onClick={() => handleDeleteUser(u)} className="p-3.5 text-red-300 hover:text-red-500 rounded-xl"><Trash2 size={18}/></button>
                   )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAL INVITACIÓN (Ajustado para aprobar) --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-4xl rounded-[3.5rem] shadow-2xl overflow-hidden">
             <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 italic uppercase leading-none">Configurar Acceso</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                      {pendingRequest ? `Aprobando solicitud de: ${pendingRequest.email}` : 'Nueva Invitación'}
                    </p>
                </div>
                <button onClick={() => { setShowAddModal(false); setPendingRequest(null); }} className="p-3 text-slate-400"><X size={24}/></button>
             </div>
             
             <form onSubmit={handleAddUser} className="p-10 grid grid-cols-2 gap-10">
                <div className="space-y-6">
                    {/* SECCIÓN DEL COMENTARIO EN EL MODAL DE INVITACIÓN */}
                    {pendingRequest && (
                      <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 mb-4 animate-in fade-in">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center"><MessageSquare size={12} className="mr-2"/> Motivo de la solicitud:</p>
                        <p className="text-sm italic font-medium text-blue-900">"{pendingRequest.comentario}"</p>
                      </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Nombre</label>
                        <input required type="text" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={newUser.nombre} onChange={e => setNewUser({...newUser, nombre: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Email</label>
                        <input required type="email" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} disabled={!!pendingRequest} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Rol</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['docente', 'coordinador', 'temporal'].map(r => (
                                <button key={r} type="button" onClick={() => setNewUser({...newUser, rol: r})} className={`py-3 rounded-xl text-[9px] font-black uppercase border-2 ${newUser.rol === r ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'}`}>{r}</button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-4">Sede</label>
                        <select required className="w-full p-4 bg-white border border-slate-100 rounded-2xl outline-none font-black text-xs" value={newUser.sedeId} onChange={e => setNewUser({...newUser, sedeId: e.target.value})}>
                            <option value="">Seleccionar Sede</option>
                            {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                    </div>
                    {(newUser.rol === 'docente' || newUser.rol === 'temporal') && (
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-4">Laboratorio</label>
                            <select required className="w-full p-4 bg-white border border-slate-100 rounded-2xl outline-none font-black text-xs" value={newUser.labId} onChange={e => setNewUser({...newUser, labId: e.target.value})}>
                                <option value="">Seleccionar Lab</option>
                                {labs.filter(l => l.sedeId === newUser.sedeId).map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                            </select>
                        </div>
                    )}
                    {newUser.rol === 'temporal' && (
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-4 text-amber-600">Duración</label>
                            <select className="w-full p-4 bg-amber-50 border border-amber-200 rounded-2xl outline-none font-black text-xs" value={newUser.duracion} onChange={e => setNewUser({...newUser, duracion: e.target.value})}>
                                <option value="8h">8 Horas</option>
                                <option value="1d">1 Día</option>
                                <option value="1w">1 Semana</option>
                            </select>
                        </div>
                    )}
                    <button type="submit" className="w-full py-5 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl" style={{ backgroundColor: temaColor }}>Confirmar e Invitar</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* --- MODAL PETICIONES (Ajustado para ver comentario) --- */}
      {showRequestsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden">
             <div className="p-10 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-800 italic uppercase">Peticiones de Acceso</h3>
                <button onClick={() => setShowRequestsModal(false)} className="p-3 text-slate-400"><X size={24}/></button>
             </div>
             <div className="p-10 max-h-[60vh] overflow-y-auto space-y-4">
                {requests.length === 0 ? (
                  <div className="text-center py-20 text-slate-300 font-bold uppercase text-[10px]">No hay solicitudes</div>
                ) : requests.map(req => (
                  <div key={req.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-5">
                            <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-300"><Mail size={24}/></div>
                            <p className="text-base font-black text-slate-800 leading-none">{req.email}</p>
                        </div>
                        <div className="flex space-x-3">
                            <button 
                              onClick={() => { setPendingRequest(req); setNewUser({...newUser, email: req.email}); setShowRequestsModal(false); setShowAddModal(true); }} 
                              className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest"
                            >
                              Atender
                            </button>
                            <button onClick={async () => await deleteDoc(doc(db, "solicitudes", req.id))} className="p-3 text-red-400"><X size={20}/></button>
                        </div>
                     </div>
                     {/* VISUALIZACIÓN DEL COMENTARIO EN LA LISTA */}
                     <div className="bg-white p-4 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Mensaje del usuario:</p>
                        <p className="text-xs italic text-slate-600 font-medium">"{req.comentario}"</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

    </div>
  );
}