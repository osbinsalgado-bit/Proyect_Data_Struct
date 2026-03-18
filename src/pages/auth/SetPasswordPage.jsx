import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../../config/firebase'; // Ajusta la ruta a tu config
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, setDoc, doc, deleteDoc,  serverTimestamp  } from 'firebase/firestore';
import { 
  Lock, CheckCircle2, Loader2, Sparkles, ShieldCheck, 
  ArrowRight, AlertCircle, Fingerprint 
} from 'lucide-react';

export default function SetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Estados de datos
  const [email] = useState(searchParams.get('email') || '');
  const [instId] = useState(searchParams.get('instId') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // 1. Verificar que la invitación sea válida al cargar
  useEffect(() => {
    const verifyInvitation = async () => {
      if (!email || !instId) {
        setError('El enlace de invitación es inválido o está incompleto.');
        setVerifying(false);
        return;
      }

      try {
        const q = query(
          collection(db, "usuarios"), 
          where("email", "==", email),
          where("institucionId", "==", instId),
          where("status", "==", "pendiente")
        );
        const snap = await getDocs(q);

        if (snap.empty) {
          setError('Esta invitación ya fue utilizada o no existe en nuestro sistema.');
        }
      } catch (err) {
        setError('Error al verificar la invitación. Intenta más tarde.');
      } finally {
        setVerifying(false);
      }
    };

    verifyInvitation();
  }, [email, instId]);

  // 2. Proceso de activación
  const handleActivate = async (e) => {
  e.preventDefault();
  setError('');
  
  // Validar que las contraseñas coincidan
  if (password !== confirmPassword) {
    setError('Las contraseñas no coinciden. Por favor intenta de nuevo.');
    return;
  }

  if (password.length < 6) {
    setError('La contraseña debe tener al menos 6 caracteres.');
    return;
  }

  setLoading(true);

  try {
    let uid;
    const emailLimpio = email.trim().toLowerCase();

    // 1. Intentamos crear el usuario
    try {
      const userCred = await createUserWithEmailAndPassword(auth, emailLimpio, password);
      uid = userCred.user.uid;
    } catch (authError) {
      // 2. Si ya existe, simplemente intentamos iniciar sesión para verificar que es él
      if (authError.code === 'auth/email-already-in-use') {
        const loginCred = await signInWithEmailAndPassword(auth, emailLimpio, password);
        uid = loginCred.user.uid;
      } else { throw authError; }
    }

    // 3. Activamos el perfil específico para ESTA institución
    const q = query(
      collection(db, "usuarios"), 
      where("email", "==", emailLimpio),
      where("institucionId", "==", instId),
      where("status", "==", "pendiente")
    );
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      const oldDoc = snap.docs[0];
      // Creamos el nuevo perfil con el UID real de Auth
      // Usamos un ID de documento único: UID_INSTITUCIONID
      await setDoc(doc(db, "usuarios", `${uid}_${instId}`), {
        ...oldDoc.data(),
        uid: uid,
        status: 'activo',
        ultimaConexion: serverTimestamp()
      });

      // Borramos el doc pendiente anterior
      await deleteDoc(oldDoc.ref);
    }

    setSuccess(true);
    setTimeout(() => { navigate('/login'); }, 2500);

  } catch (err) {
    setError("Error: " + (err.code === 'auth/wrong-password' ? "La contraseña no coincide con tu cuenta existente de SGL." : err.message));
  } finally {
    setLoading(false);
  }
};

  if (verifying) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="text-blue-500 animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      
      {/* Fondo dinámico igual al Onboarding */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="max-w-md w-full bg-white rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] p-10 z-10 relative border border-white/20 animate-in zoom-in duration-500">
        
        {success ? (
          <div className="text-center py-10 space-y-6">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl animate-bounce">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">¡Cuenta Activada!</h2>
            <p className="text-slate-500 font-bold text-sm">Tu acceso ha sido configurado correctamente. Redirigiendo...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <div className="p-4 bg-slate-50 rounded-3xl w-fit mx-auto mb-6 border border-slate-100 shadow-sm">
                <ShieldCheck size={32} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 uppercase italic leading-none tracking-tighter">Activar Acceso</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">{email}</p>
            </div>

            {error ? (
              <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex items-start space-x-4 mb-8">
                <AlertCircle className="text-red-500 shrink-0" size={20} />
                <p className="text-xs font-bold text-red-600 leading-relaxed">{error}</p>
              </div>
            ) : (
              <form onSubmit={handleActivate} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-5 tracking-widest">Nueva Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      required 
                      type="password" 
                      className="w-full pl-14 p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:bg-white transition-all" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-5 tracking-widest">Confirmar Contraseña</label>
                  <div className="relative">
                    <Fingerprint className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      required 
                      type="password" 
                      className="w-full pl-14 p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:bg-white transition-all" 
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  disabled={loading}
                  className="w-full mt-6 bg-slate-950 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl flex justify-center items-center hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <>ACTIVAR AHORA <ArrowRight className="ml-3" size={18} /></>}
                </button>
              </form>
            )}
          </>
        )}

        <div className="mt-10 flex items-center justify-center space-x-2 opacity-30">
          <Sparkles size={14} />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Security Core Active</span>
        </div>
      </div>
    </div>
  );
}