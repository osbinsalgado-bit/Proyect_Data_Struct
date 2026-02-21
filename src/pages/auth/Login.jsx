import { useState } from 'react';
import { 
  Mail, Lock, ArrowRight, Building2, MapPin, Loader2, 
  AlertCircle, CheckCircle2, UserPlus, ChevronRight, RefreshCcw 
} from 'lucide-react';
import { db, auth } from '../../config/firebase'; 
import { 
  collection, query, where, getDocs, doc, getDoc, 
  addDoc, updateDoc, serverTimestamp 
} from 'firebase/firestore';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

export default function Login() {
  // Estados de Formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados de Flujo
  const [step, setStep] = useState(1); // 1: Email, 1.5: Select Inst, 2: Pass/Request, 3: Select Sede
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Estados de Data
  const [instsEncontradas, setInstsEncontradas] = useState([]);
  const [instSeleccionada, setInstSeleccionada] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [sedesDetalles, setSedesDetalles] = useState([]);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);

  // --- PASO 1: VALIDAR DOMINIO ---
  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    
    try {
      const dominio = email.split('@')[1];
      if (!dominio) throw new Error("Email inválido");

      const q = query(collection(db, "instituciones"), where("dominioPermitido", "==", dominio));
      const snap = await getDocs(q);

      if (snap.empty) {
        setError("Esta institución no está registrada en MINS.");
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
      setError("Error al buscar institución.");
    } finally {
      setLoading(false);
    }
  };

  // --- PASO 1.5: SELECCIONAR INSTITUCIÓN ---
  const handleSelectInstitucion = async (inst) => {
    setLoading(true);
    setInstSeleccionada(inst);
    setError('');

    try {
      const qUser = query(
        collection(db, "usuarios"), 
        where("email", "==", email), 
        where("institucionId", "==", inst.id)
      );
      const userSnap = await getDocs(qUser);

      if (!userSnap.empty) {
        setUserProfile({ id: userSnap.docs[0].id, ...userSnap.docs[0].data() });
      } else {
        setUserProfile(null);
      }
      setStep(2);
    } catch (err) {
      setError("Error al validar perfil de usuario.");
    } finally {
      setLoading(false);
    }
  };

  // --- PASO 2: INICIAR SESIÓN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      
      // Actualizar la fecha de último acceso en Firestore
      await updateDoc(doc(db, "usuarios", cred.user.uid), {
        fechaUltimoAcceso: serverTimestamp()
      });

      if (userProfile.rol === "admin_institucion") {
        window.location.href = "/admin-dashboard";
      } else {
        handleCheckSedes(userProfile.sedesAsignadas);
      }
    } catch (err) {
      setError("La contraseña no coincide con nuestros registros.");
    } finally {
      setLoading(false);
    }
  };

  // --- FUNCIONALIDAD EXTRA: RECUPERAR CONTRASEÑA ---
  const handleRecoverPassword = async () => {
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg("¡Enviado! Revisa tu correo para configurar tu contraseña.");
    } catch (err) {
      setError("No se pudo enviar el correo de recuperación.");
    } finally {
      setLoading(false);
    }
  };

  // --- SOLICITAR ACCESO ---
  const handleRequestAccess = async () => {
    setLoading(true);
    try {
      await addDoc(collection(db, "solicitudes"), {
        email,
        institucionId: instSeleccionada.id,
        status: "pendiente",
        fechaSolicitud: new Date().toISOString()
      });
      setSolicitudEnviada(true);
    } catch (err) {
      setError("No se pudo enviar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  // --- PASO 3: SELECCIÓN DE SEDE ---
  const handleCheckSedes = async (idsSedes) => {
    if (!idsSedes || idsSedes.length === 0) {
      setError("No tienes sedes asignadas. Contacta a tu administrador.");
      setLoading(false);
      return;
    }

    if (idsSedes.length === 1) {
      entrarASede(idsSedes[0]);
    } else {
      const detalles = [];
      for (const id of idsSedes) {
        const sDoc = await getDoc(doc(db, "sedes", id));
        if (sDoc.exists()) detalles.push({ id: sDoc.id, ...sDoc.data() });
      }
      setSedesDetalles(detalles);
      setStep(3);
      setLoading(false);
    }
  };

  const entrarASede = (sedeId) => {
    localStorage.setItem('sedeActualId', sedeId);
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-gradient-xy bg-gradient-to-br from-blue-700 via-slate-50 to-blue-400">
      
      <div className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-10 border border-white/50">
        
        {/* HEADER */}
        <div className="text-center mb-8">
          {step === 1 && (
            <div className="animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg rotate-3">
                <Building2 className="text-white w-8 h-8" />
              </div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">MINS</h1>
              <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-widest">Multi-Institution Network System</p>
            </div>
          )}

          {step > 1 && instSeleccionada && (
            <div className="animate-in slide-in-from-top duration-500">
              <img src={instSeleccionada.logoUrl} className="h-20 mx-auto mb-3 drop-shadow-sm" alt="Logo" />
              <h2 className="text-xl font-bold text-slate-800">{instSeleccionada.nombre}</h2>
              <div className="mt-2 inline-flex items-center text-[10px] uppercase font-bold text-emerald-600 bg-emerald-100/50 px-3 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Dominio Verificado
              </div>
            </div>
          )}
        </div>

        {/* CONTENIDO SEGÚN PASO */}
        {step === 1 && (
          <form onSubmit={handleCheckEmail} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <input 
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="correo@institucion.edu"
              className="w-full pl-6 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
            />
            <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl transition-all flex justify-center items-center group">
              {loading ? <Loader2 className="animate-spin" /> : <>Continuar <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1" /></>}
            </button>
          </form>
        )}

        {step === 1.5 && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <p className="text-sm text-slate-500 text-center mb-4 italic">Selecciona tu institución:</p>
            {instsEncontradas.map(i => (
              <button 
                key={i.id} onClick={() => handleSelectInstitucion(i)}
                className="w-full flex items-center p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-500 transition-all group"
              >
                <img src={i.logoUrl} className="w-12 h-12 rounded-xl object-contain bg-slate-50 p-1 mr-4" alt="" />
                <span className="font-bold text-slate-700 group-hover:text-blue-600 text-left leading-tight">{i.nombre}</span>
                <ChevronRight className="ml-auto text-slate-300" />
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="animate-in slide-in-from-right duration-500">
            {userProfile ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                   <Lock className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
                   <input 
                    type="password" required autoFocus value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none"
                  />
                </div>
                <button disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl">
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : "Ingresar"}
                </button>
                <button 
                  type="button" onClick={handleRecoverPassword}
                  className="w-full text-xs font-bold text-blue-600 flex justify-center items-center hover:underline"
                >
                  <RefreshCcw className="w-3 h-3 mr-1" /> ¿Olvidaste tu clave o es tu primera vez?
                </button>
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
                    <p className="text-sm text-blue-800 font-medium mb-4">"Correo no registrado en esta sede."</p>
                    <button onClick={handleRequestAccess} disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl flex justify-center items-center shadow-lg">
                      {loading ? <Loader2 className="animate-spin" /> : <><UserPlus className="mr-2 w-5 h-5" /> Solicitar Acceso</>}
                    </button>
                  </div>
                )}
              </div>
            )}
            <button onClick={() => setStep(1)} className="w-full mt-6 text-[10px] text-slate-400 font-black uppercase tracking-widest hover:text-blue-600">Cambiar correo</button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in zoom-in duration-500 text-center">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Selecciona Sede de Trabajo</p>
            <div className="grid grid-cols-1 gap-3">
              {sedesDetalles.map(s => (
                <button 
                  key={s.id} onClick={() => entrarASede(s.id)}
                  className="flex items-center p-5 bg-white border border-slate-100 rounded-3xl hover:border-blue-500 hover:shadow-lg transition-all group"
                >
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mr-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-black text-slate-800">{s.nombre}</h4>
                    <p className="text-[9px] text-slate-400 font-bold">ACCESO COORDINADOR</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MENSAJES DE ESTADO */}
        {successMsg && <div className="mt-6 p-4 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-2xl border border-emerald-100 flex items-center animate-in slide-in-from-top-2"><CheckCircle2 className="w-4 h-4 mr-2" /> {successMsg}</div>}
        {error && <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-[11px] font-bold rounded-r-2xl flex items-center animate-in fade-in"><AlertCircle className="w-4 h-4 mr-2" /> {error}</div>}

      </div>
      
      {/* FOOTER */}
      <p className="absolute bottom-8 text-white/50 text-[10px] font-black tracking-widest uppercase">
        MINS – Multi-Institution Network System &copy; 2026 • Sistema de Gestión Autorizado
      </p>

    </div>
  );
}