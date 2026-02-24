import { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { 
  collection, query, where, onSnapshot, doc, getDocs,
  addDoc, deleteDoc, updateDoc, serverTimestamp 
} from 'firebase/firestore';
import { 
  Search, UserPlus, Trash2, ShieldCheck, Clock, 
  X, Check, AlertCircle, Mail, Calendar, Users, Bell,
  Building, Layout, ChevronDown, Globe, Fingerprint
} from 'lucide-react';
import { sendBrandedEmail } from '../../services/emailService';

export default function GlobalUsersView({ inst, temaColor }) {
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

  const [newUser, setNewUser] = useState({ 
    nombre: '', email: '', rol: 'docente', duracion: '24h',
    sedePrincipal: '', labAsignado: '' 
  });

  // --- 1. CARGA DE DATOS REALES ---
  useEffect(() => {
    if (!instId) return;

    // Usuarios
    const qUsers = query(collection(db, "usuarios"), where("institucionId", "==", instId));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    // Solicitudes
    const qReqs = query(collection(db, "solicitudes"), where("institucionId", "==", instId), where("status", "==", "pendiente"));
    const unsubReqs = onSnapshot(qReqs, (snap) => setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    // Sedes y Labs (Estructura real)
    const fetchData = async () => {
        const sSnap = await getDocs(query(collection(db, "sedes"), where("institucionId", "==", instId)));
        setSedes(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        const lSnap = await getDocs(query(collection(db, "laboratorios"), where("institucionId", "==", instId)));
        setLabs(lSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchData();

    return () => { unsubUsers(); unsubReqs(); };
  }, [instId]);

  // --- 2. ACCIONES (REPARADAS) ---
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      // Definir qué tipo de acceso tiene según el rol
      const accessDetails = newUser.rol === 'coordinador' 
        ? `Acceso Maestro a Sede: ${newUser.sedePrincipal}`
        : `Acceso a Sede: ${newUser.sedePrincipal}, Laboratorio: ${newUser.labAsignado}`;

      await addDoc(collection(db, "usuarios"), {
        nombre: newUser.nombre,
        email: newUser.email,
        rol: newUser.rol,
        institucionId: instId,
        status: 'activo',
        fechaCreacion: serverTimestamp(),
        sedesAsignadas: [newUser.sedePrincipal],
        laboratoriosAsignados: newUser.rol === 'coordinador' ? ['todos'] : [newUser.labAsignado],
        expiraEn: newUser.rol === 'temporal' ? newUser.duracion : null
      });
      
      await sendBrandedEmail(newUser.email, `Invitación a ${inst.nombre}`, inst, `
        <p>Hola <b>${newUser.nombre}</b>,</p>
        <p>Has sido invitado a colaborar con el rol de <b>${newUser.rol.toUpperCase()}</b>.</p>
        <div style="background:#f3f4f6; padding:20px; border-radius:12px; margin:20px 0; border-left: 4px solid ${temaColor}">
            <p style="margin:0; font-size:12px; color:#666;">AUTORIZACIÓN DE ACCESO:</p>
            <p style="margin:5px 0 0 0; font-weight:bold;">${accessDetails}</p>
        </div>
        <p>Configura tu contraseña en el enlace de abajo para activar tu cuenta:</p>
        <a href="${window.location.origin}/reset-password" style="background:${temaColor}; color:white; padding:12px 30px; text-decoration:none; border-radius:10px; display:inline-block; font-weight:bold;">Activar mi Cuenta</a>
      `);

      setShowAddModal(false);
      setNewUser({ nombre: '', email: '', rol: 'docente', duracion: '24h', sedePrincipal: '', labAsignado: '' });
    } catch (err) { alert("Error: " + err.message); }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`¿Seguro que deseas eliminar a ${user.nombre}? Se le enviará un correo notificando su baja.`)) return;
    try {
      await deleteDoc(doc(db, "usuarios", user.id));
      await sendBrandedEmail(user.email, `Baja de Sistema - ${inst.nombre}`, inst, `
        <p>Hola ${user.nombre},</p>
        <p>Te informamos que tu acceso a la plataforma de <b>${inst.nombre}</b> ha sido revocado.</p>
      `);
    } catch (err) { console.error(err); }
  };

  const stats = {
    total: users.length,
    coords: users.filter(u => u.rol === 'coordinador').length,
    docentes: users.filter(u => u.rol === 'docente').length,
    temps: users.filter(u => u.rol === 'temporal').length,
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && (filterRole === 'todos' || u.rol === filterRole);
  });

  if (!instId) return <div className="p-20 text-center text-slate-300 font-black animate-pulse">CARGANDO NÚCLEO...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER BAR */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-800 italic uppercase leading-none tracking-tighter">Usuarios</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 tracking-tighter">Gestión de Privilegios y Accesos</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setShowRequestsModal(true)} className="relative p-4 bg-slate-50 rounded-2xl hover:bg-white border border-transparent hover:border-slate-200 transition-all">
            <Bell size={22} className="text-slate-400" />
            {requests.length > 0 && <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-4 border-white">{requests.length}</span>}
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center px-8 py-4 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all" style={{ backgroundColor: temaColor }}>
            <UserPlus size={18} className="mr-3" /> Invitar Miembro
          </button>
        </div>
      </div>

      {/* STATS REALES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Registrados', value: stats.total, icon: Users, color: temaColor },
          { label: 'Coordinadores', value: stats.coords, icon: ShieldCheck, color: '#6366f1' },
          { label: 'Docentes', value: stats.docentes, icon: Globe, color: '#10b981' },
          { label: 'Temporales', value: stats.temps, icon: Clock, color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-md transition-all relative overflow-hidden">
            <div className="p-3 w-fit rounded-2xl mb-4" style={{ backgroundColor: `${s.color}10`, color: s.color }}><s.icon size={20}/></div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">{s.label}</p>
            <h3 className="text-4xl font-black text-slate-800 mt-2">{s.value}</h3>
          </div>
        ))}
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
           <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-inner">
              {['todos', 'coordinador', 'docente', 'temporal'].map(r => (
                <button key={r} onClick={() => setFilterRole(r)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterRole === r ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`} style={filterRole === r ? { backgroundColor: filterRole === r ? temaColor : '' } : {}}>{r}</button>
              ))}
           </div>
           <div className="relative w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input type="text" placeholder="Buscar usuario..." className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none text-xs font-bold focus:ring-4 transition-all" style={{ '--tw-ring-color': `${temaColor}10` }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
           </div>
        </div>

        <table className="w-full text-left">
          <tbody className="divide-y divide-slate-50">
            {filteredUsers.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="p-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center font-black text-slate-300 shadow-sm group-hover:scale-110 transition-transform">{u.nombre?.charAt(0)}</div>
                    <div>
                      <p className="text-base font-black text-slate-800 leading-none mb-1">{u.nombre}</p>
                      <p className="text-xs font-bold text-slate-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-8">
                  <span className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500">{u.rol}</span>
                </td>
                <td className="p-8 text-right">
                   <button onClick={() => handleDeleteUser(u)} className="p-3.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAL INVITACIÓN (2 COLUMNAS) --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-4xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
             <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-2xl text-white shadow-lg shadow-blue-200" style={{ backgroundColor: temaColor }}><UserPlus size={24}/></div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 italic uppercase leading-none">Invitar Miembro</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configuración de Privilegios</p>
                    </div>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-800 transition-all"><X size={24}/></button>
             </div>
             
             <form onSubmit={handleAddUser} className="p-10 grid grid-cols-2 gap-10">
                {/* Columna 1: Info Personal */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Nombre Completo</label>
                        <div className="relative">
                            <Fingerprint className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input required type="text" className="w-full pl-14 p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" placeholder="Ej. Carlos Mendez" value={newUser.nombre} onChange={e => setNewUser({...newUser, nombre: e.target.value})} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Email Oficial</label>
                        <div className="relative">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input required type="email" className="w-full pl-14 p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" placeholder="user@institucion.edu" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Rol en la Plataforma</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['docente', 'coordinador', 'temporal'].map(r => (
                                <button key={r} type="button" onClick={() => setNewUser({...newUser, rol: r})} className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-tighter border-2 transition-all ${newUser.rol === r ? 'border-slate-800 bg-slate-900 text-white shadow-lg' : 'border-slate-100 text-slate-400 bg-slate-50 hover:border-slate-200'}`}>{r}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Columna 2: Permisos de Ubicación */}
                <div className="space-y-6 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col justify-center">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-4 tracking-tighter">Sede de Trabajo</label>
                        <select required className="w-full p-4 bg-white border border-slate-100 rounded-2xl outline-none font-black text-xs cursor-pointer" value={newUser.sedePrincipal} onChange={e => setNewUser({...newUser, sedePrincipal: e.target.value})}>
                            <option value="">Seleccionar Sede</option>
                            {sedes.map(s => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
                        </select>
                    </div>

                    {(newUser.rol === 'docente' || newUser.rol === 'temporal') && (
                        <div className="space-y-2 animate-in fade-in zoom-in">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-4 tracking-tighter">Laboratorio Autorizado</label>
                            <select required className="w-full p-4 bg-white border border-slate-100 rounded-2xl outline-none font-black text-xs cursor-pointer" value={newUser.labAsignado} onChange={e => setNewUser({...newUser, labAsignado: e.target.value})}>
                                <option value="">Seleccionar Lab</option>
                                {labs.filter(l => l.sedeId === sedes.find(s => s.nombre === newUser.sedePrincipal)?.id).map(l => (
                                    <option key={l.id} value={l.nombre}>{l.nombre}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {newUser.rol === 'temporal' && (
                        <div className="space-y-2 animate-in fade-in zoom-in">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-4 tracking-tighter text-amber-600">Tiempo de Expiración</label>
                            <select className="w-full p-4 bg-amber-50 border border-amber-200 rounded-2xl outline-none font-black text-xs text-amber-900" value={newUser.duracion} onChange={e => setNewUser({...newUser, duracion: e.target.value})}>
                                <option value="8h">8 Horas</option>
                                <option value="24h">24 Horas</option>
                                <option value="3d">3 Días</option>
                            </select>
                        </div>
                    )}

                    <button type="submit" className="w-full py-5 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:scale-105 active:scale-95 transition-all mt-4 shadow-blue-200" style={{ backgroundColor: temaColor }}>Finalizar e Invitar</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* --- MODAL SOLICITUDES (COMPLETO) --- */}
      {showRequestsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
             <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 italic uppercase leading-none tracking-tighter">Bandeja de Solicitudes</h3>
                  <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest tracking-tighter">Personas que intentan unirse a tu red</p>
                </div>
                <button onClick={() => setShowRequestsModal(false)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400"><X size={24}/></button>
             </div>
             <div className="p-10 max-h-[60vh] overflow-y-auto space-y-4">
                {requests.length === 0 ? (
                  <div className="text-center py-20 text-slate-300 font-bold uppercase text-[10px] tracking-[0.4em] italic">No hay peticiones de acceso</div>
                ) : requests.map(req => (
                  <div key={req.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all">
                     <div className="flex items-center space-x-5">
                        <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-300 group-hover:text-blue-500 transition-colors"><Mail size={24}/></div>
                        <div>
                           <p className="text-base font-black text-slate-800 leading-none">{req.email}</p>
                           <p className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-widest flex items-center"><Clock size={12} className="mr-1"/> Solicitado Recientemente</p>
                        </div>
                     </div>
                     <div className="flex space-x-3">
                        <button onClick={() => { setShowRequestsModal(false); setShowAddModal(true); setNewUser({...newUser, email: req.email}); }} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all">Gestionar</button>
                        <button onClick={async () => await deleteDoc(doc(db, "solicitudes", req.id))} className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-all"><X size={20}/></button>
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