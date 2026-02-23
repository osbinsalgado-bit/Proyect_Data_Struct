import { useState, useEffect } from 'react';
import { 
  Mail, Lock, ArrowRight, Building2, MapPin, Loader2, 
  AlertCircle, CheckCircle2, UserPlus, ChevronRight, RefreshCcw,
  Search, Globe, ShieldCheck, Zap, BarChart3, Smartphone, PlusCircle
} from 'lucide-react';
import { db, auth } from '../../config/firebase'; 
import { 
  collection, query, where, getDocs, doc, getDoc, 
  addDoc, updateDoc, serverTimestamp 
} from 'firebase/firestore';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { sendBrandedEmail } from '../../services/emailService';

export default function Login() {
  // Estados de Interfaz
  const [view, setView] = useState('landing'); // landing, login, register-info
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Estados de Formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados de Data
  const [instsEncontradas, setInstsEncontradas] = useState([]);
  const [instSeleccionada, setInstSeleccionada] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [sedesDetalles, setSedesDetalles] = useState([]);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);

  // Beneficios dinámicos
  const benefits = [
    { icon: <ShieldCheck />, title: "Control Total", desc: "Gestiona quién entra a tus laboratorios en tiempo real." },
    { icon: <Zap />, title: "Configuración Instantánea", desc: "Crea 30 computadoras en la base de datos con un solo clic." },
    { icon: <Smartphone />, title: "Reportes con QR", desc: "Tus docentes reportan fallos escaneando la CPU desde la App." },
    { icon: <BarChart3 />, title: "Analítica SaaS", desc: "Gráficas de equipos dañados vs operativos por cada sede." }
  ];

  const [activeBenefit, setActiveBenefit] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBenefit((prev) => (prev + 1) % benefits.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

// --- PASO 1: VALIDAR DOMINIO (ARRAY VERSION) ---
const handleCheckEmail = async (e) => {
  e.preventDefault();
  setLoading(true); setError('');
    
  try {
    const dominio = email.split('@')[1];
    if (!dominio) throw new Error("Email inválido");

    // USAR 'array-contains' porque ahora es un arreglo en Firebase
    const q = query(
      collection(db, "instituciones"), 
      where("dominioPermitido", "array-contains", dominio)
    );

    const snap = await getDocs(q);

      if (snap.empty) {
        setStep(1.2); // No encontrada -> Sugerir registro
        setLoading(false);
        return;
      }

      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setInstsEncontradas(lista);

      if (lista.length > 1) {
        setStep(1.5);
      } else {
        handleSelectInstitucion(lista[0]);
      }
    } catch (err) {
      setError("Error al buscar institución. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInstitucion = async (inst) => {
    setLoading(true); setInstSeleccionada(inst);
    try {
      const qUser = query(collection(db, "usuarios"), where("email", "==", email), where("institucionId", "==", inst.id));
      const userSnap = await getDocs(qUser);
      if (!userSnap.empty) setUserProfile({ id: userSnap.docs[0].id, ...userSnap.docs[0].data() });
      else setUserProfile(null);
      setStep(2);
    } catch (err) { setError("Error al validar perfil."); }
    finally { setLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await updateDoc(doc(db, "usuarios", cred.user.uid), { fechaUltimoAcceso: serverTimestamp() });
      
      if (userProfile?.rol === "admin_institucion") window.location.href = "/admin-dashboard";
      else handleCheckSedes(userProfile?.sedesAsignadas);
    } catch (err) { setError("Credenciales incorrectas."); }
    finally { setLoading(false); }
  };

  const handleCheckSedes = async (idsSedes) => {
    if (!idsSedes || idsSedes.length === 0) {
      setError("No tienes sedes asignadas.");
      setLoading(false); return;
    }
    if (idsSedes.length === 1) {
      localStorage.setItem('sedeActualId', idsSedes[0]);
      window.location.href = "/dashboard";
    } else {
      const detalles = [];
      for (const id of idsSedes) {
        const sDoc = await getDoc(doc(db, "sedes", id));
        if (sDoc.exists()) detalles.push({ id: sDoc.id, ...sDoc.data() });
      }
      setSedesDetalles(detalles); setStep(3); setLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    setLoading(true);
    try {
      // Obtener el email del coordinador de la institución
      const coordinadorQ = query(
        collection(db, "usuarios"),
        where("institucionId", "==", instSeleccionada.id),
        where("rol", "==", "coordinador")
      );
      const coordinadorSnap = await getDocs(coordinadorQ);
      
      if (coordinadorSnap.empty) {
        setError("No hay coordinador asignado a esta institución.");
        setLoading(false);
        return;
      }

      const coordinadorEmail = coordinadorSnap.docs[0].data().email;

      // Crear solicitud en Firestore
      await addDoc(collection(db, "solicitudes"), {
        email,
        institucionId: instSeleccionada.id,
        status: "pendiente",
        fechaSolicitud: serverTimestamp()
      });

      // Enviar email al coordinador
      await sendBrandedEmail(
        coordinadorEmail, 
        `Nueva Solicitud de Acceso - ${instSeleccionada.nombre}`, 
        instSeleccionada, 
        `<p>Un nuevo usuario con el correo <b>${email}</b> ha solicitado acceso a tus laboratorios.</p>
         <p>Por favor, ingresa al panel para aprobar o rechazar la solicitud.</p>`
      );

      setSolicitudEnviada(true);
      setSuccessMsg("Solicitud enviada correctamente. El coordinador reviará tu acceso pronto.");
    } catch (err) {
      setError("No se pudo enviar la solicitud.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Círculos decorativos de fondo */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white/5 backdrop-blur-lg rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden z-10">
        
        {/* PANEL IZQUIERDO: MARKETING & VENTAJAS */}
        <div className="hidden lg:flex flex-col justify-center p-12 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative">
          <div className="relative z-10">
            <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-4xl font-black mb-4 leading-tight text-white">
              Lleva tus laboratorios al <span className="text-blue-200 underline decoration-blue-400">siguiente nivel.</span>
            </h2>
            <p className="text-blue-100 text-lg mb-12">MINS – Multi-Institution Network System es la plataforma SaaS líder para instituciones educativas modernas.</p>
            
            <div className="space-y-6">
              {benefits.map((b, i) => (
                <div key={i} className={`flex items-start space-x-4 transition-all duration-500 ${activeBenefit === i ? 'opacity-100 translate-x-2' : 'opacity-40 scale-95'}`}>
                  <div className="p-2 bg-white/10 rounded-lg">{b.icon}</div>
                  <div>
                    <h4 className="font-bold">{b.title}</h4>
                    <p className="text-sm text-blue-100">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Gráfico de fondo decorativo */}
          <div className="absolute bottom-0 right-0 opacity-10 p-4">
             <Zap size={200} />
          </div>
        </div>

        {/* PANEL DERECHO: INTERFAZ DINÁMICA */}
        <div className="bg-white p-8 lg:p-12 flex flex-col justify-center relative">
          
          {/* Botón Volver (Solo si no está en landing) */}
          {view !== 'landing' && (
            <button 
              onClick={() => { setView('landing'); setStep(1); }}
              className="absolute top-8 left-8 text-slate-400 hover:text-blue-600 flex items-center text-xs font-bold uppercase tracking-widest transition-colors"
            >
              <ArrowRight className="rotate-180 mr-2 w-4 h-4" /> Volver
            </button>
          )}

          <div className="max-w-sm mx-auto w-full">
            {/* LOGO DINÁMICO SEGÚN PASO */}
            <div className="text-center mb-10">
              {step > 1 && instSeleccionada ? (
                <div className="animate-in slide-in-from-top-4 duration-500">
                  <img src={instSeleccionada.logoUrl} className="h-16 mx-auto mb-4 drop-shadow-md object-contain" alt="Logo" />
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{instSeleccionada.nombre}</h3>
                </div>
              ) : (
                <div className="animate-in fade-in zoom-in duration-500">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl rotate-3">
                    <Zap className="text-white w-8 h-8" fill="currentColor" />
                  </div>
                  <h1 className="text-3xl font-black text-slate-800">MINS</h1>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Multi-Institution Network System</p>
                </div>
              )}
            </div>

            {/* VISTA 1: LANDING / SELECTOR */}
            {view === 'landing' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button 
                  onClick={() => setView('login')}
                  className="w-full group flex items-center justify-between p-6 bg-slate-900 text-white rounded-[2rem] hover:bg-blue-600 transition-all shadow-xl shadow-slate-200"
                >
                  <div className="text-left">
                    <span className="block font-black text-lg">Ingresar</span>
                    <span className="text-xs text-slate-400 group-hover:text-blue-100">Accede a tu institución</span>
                  </div>
                  <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                </button>

                <button 
                  onClick={() => setView('register-info')}
                  className="w-full group flex items-center justify-between p-6 bg-white border-2 border-slate-100 text-slate-800 rounded-[2rem] hover:border-blue-500 transition-all"
                >
                  <div className="text-left">
                    <span className="block font-black text-lg">Registrar Institución</span>
                    <span className="text-xs text-slate-400">Prueba gratuita de 30 días</span>
                  </div>
                  <PlusCircle className="text-blue-600 w-6 h-6" />
                </button>
              </div>
            )}

            {/* VISTA 2: INFORMACIÓN DE REGISTRO */}
            {view === 'register-info' && (
              <div className="space-y-6 animate-in zoom-in duration-300">
                 <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                    <h4 className="font-black text-blue-900 mb-2 italic">¿Por qué unir tu institución?</h4>
                    <ul className="text-xs space-y-3 text-blue-800 font-medium">
                      <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-blue-500"/> Unifica todas tus sedes en una sola cuenta.</li>
                      <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-blue-500"/> Inventario automatizado con etiquetas QR.</li>
                      <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-blue-500"/> Soporte multi-rol para docentes y técnicos.</li>
                    </ul>
                 </div>
                 <button 
                  onClick={() => window.location.href = "/onboarding"}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex justify-center items-center"
                 >
                   Empezar Prueba Gratuita <ArrowRight className="ml-2 w-5 h-5" />
                 </button>
              </div>
            )}

            {/* VISTA 3: FLUJO DE LOGIN (EXISTENTE) */}
            {view === 'login' && (
              <div className="animate-in fade-in duration-500">
                {step === 1 && (
                  <form onSubmit={handleCheckEmail} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
                      <input 
                        type="email" required value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="correo@institucion.edu"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <button disabled={loading} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl flex justify-center items-center group hover:bg-blue-600 transition-all shadow-lg">
                      {loading ? <Loader2 className="animate-spin" /> : <>Validar Dominio <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1" /></>}
                    </button>
                  </form>
                )}

                {step === 1.2 && (
                  <div className="text-center space-y-6 animate-in zoom-in">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto"><Globe /></div>
                    <h2 className="text-lg font-bold text-slate-800">Dominio no encontrado</h2>
                    <p className="text-sm text-slate-500">¿Deseas registrar a <b>{email.split('@')[1]}</b> como nueva institución?</p>
                    <button onClick={() => setView('register-info')} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold">Registrar Institución</button>
                  </div>
                )}

                {step === 1.5 && (
                  <div className="space-y-3 animate-in fade-in">
                    <p className="text-xs font-bold text-slate-400 uppercase text-center mb-2 tracking-widest">Instituciones detectadas</p>
                    {instsEncontradas.map(i => (
                      <button key={i.id} onClick={() => handleSelectInstitucion(i)} className="w-full flex items-center p-4 border rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all">
                        <img src={i.logoUrl} className="w-10 h-10 object-contain mr-4" />
                        <span className="font-bold text-slate-700 text-sm">{i.nombre}</span>
                      </button>
                    ))}
                  </div>
                )}

                {step === 2 && (
                  <div className="animate-in slide-in-from-right-4 duration-500">
                    {userProfile ? (
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="relative">
                          <Lock className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
                          <input 
                            type="password" required autoFocus value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="Tu Contraseña"
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none"
                          />
                        </div>
                        <button disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-blue-700 transition-all">
                          {loading ? <Loader2 className="animate-spin mx-auto" /> : "Iniciar Sesión"}
                        </button>
                        <button type="button" onClick={() => setStep(1)} className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600">Cambiar Correo</button>
                      </form>
                    ) : (
                      <div className="text-center space-y-4">
                        {solicitudEnviada ? (
                          <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 animate-in zoom-in">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                            <h3 className="font-bold text-emerald-900">Solicitud Enviada</h3>
                            <p className="text-[11px] text-emerald-700 mt-2">Tu acceso está siendo revisado por el coordinador.</p>
                          </div>
                        ) : (
                          <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                            <p className="text-sm text-blue-800 font-medium mb-4">Correo no registrado en esta institución.</p>
                            <button onClick={handleRequestAccess} disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl flex justify-center items-center shadow-lg hover:bg-blue-700">
                              {loading ? <Loader2 className="animate-spin" /> : <><UserPlus className="mr-2 w-5 h-5" /> Solicitar Acceso</>}
                            </button>
                          </div>
                        )}
                        <button onClick={() => setStep(1)} className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600">Cambiar Correo</button>
                      </div>
                    )}
                  </div>
                )}

                {step === 3 && (
                   <div className="space-y-3 animate-in zoom-in duration-500">
                    {sedesDetalles.map(s => (
                      <button key={s.id} onClick={() => entrarASede(s.id)} className="w-full flex items-center p-5 bg-white border border-slate-100 rounded-3xl hover:border-blue-500 hover:shadow-lg transition-all group">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mr-4 group-hover:bg-blue-600 group-hover:text-white transition-all"><MapPin size={20}/></div>
                        <div className="text-left"><h4 className="font-black text-slate-800 text-sm">{s.nombre}</h4><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Coordinador</p></div>
                      </button>
                    ))}
                   </div>
                )}
              </div>
            )}

            {/* MENSAJES DE ERROR/ÉXITO */}
            {error && <div className="mt-8 p-4 bg-red-50 text-red-700 text-[11px] font-bold rounded-2xl border-l-4 border-red-500 flex items-center animate-in fade-in"><AlertCircle className="w-4 h-4 mr-2" /> {error}</div>}
            {successMsg && <div className="mt-8 p-4 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-2xl border border-emerald-100 flex items-center animate-in slide-in-from-top-2"><CheckCircle2 className="w-4 h-4 mr-2" /> {successMsg}</div>}
          </div>

        </div>
      </div>
      
      {/* FOOTER */}
      <div className="absolute bottom-8 flex flex-col items-center space-y-2">
        <div className="flex space-x-4 text-white/30 text-[10px] font-bold uppercase tracking-[0.3em]">
          <span>Security Verified</span>
          <span>•</span>
          <span>Cloud Infrastructure</span>
          <span>•</span>
          <span>v3.0.4</span>
        </div>
        <p className="text-white/20 text-[9px] font-medium">MINS – Multi-Institution Network System &copy; 2026. Todos los derechos reservados.</p>
      </div>
    </div>
  );
}