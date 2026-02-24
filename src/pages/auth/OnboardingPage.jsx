import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth, storage } from '../../config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  Upload, Loader2, ArrowRight, X, Mail, MapPin, Crown, 
  ArrowLeft, Monitor, Sparkles, Cpu, QrCode,
  Lock, Zap, CheckCircle2, Globe, Star
} from 'lucide-react';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState('trial'); 

  const [formData, setFormData] = useState({
    nombre: '', sedePrincipal: '', emailSoporte: '', dominios: [], currentDominio: '',
    tema: { principal: '#3b82f6', interfaz: '#ffffff' },
    logoFile: null, logoPreview: null
  });

  const [adminData, setAdminData] = useState({ email: '', password: '' });

  const addDominio = () => {
    const d = formData.currentDominio.trim().toLowerCase();
    if (d && d.includes('.') && !formData.dominios.includes(d)) {
      setFormData({ ...formData, dominios: [...formData.dominios, d], currentDominio: '' });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setFormData({ ...formData, logoFile: file, logoPreview: URL.createObjectURL(file) });
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      let logoUrl = "";
      // 1. Subida del logo a Storage
      if (formData.logoFile) {
        const storageRef = ref(storage, `logos/${formData.nombre}-${Date.now()}`);
        await uploadBytes(storageRef, formData.logoFile);
        logoUrl = await getDownloadURL(storageRef);
      }

      // Generar el ID de la institución (ej: unitec-honduras)
      const instId = formData.nombre.toLowerCase().trim().replace(/\s+/g, '-');

      // 2. GUARDADO EN FIRESTORE (Mapeo exacto según tu captura)
      await setDoc(doc(db, "instituciones", instId), {
        nombre: formData.nombre,
        dominioPermitido: formData.dominios, // <--- CAMBIADO: Ahora coincide con tu DB
        logoUrl: logoUrl,
        planSuscripcion: plan,               // <--- CAMBIADO: Coincide con tu captura
        temaColor: formData.tema.principal,   // <--- CAMBIADO: Coincide con tu captura
        temaOscuro: false,                   // <--- AGREGADO: Según tu captura
        estado: "activo",                    // <--- AGREGADO: Según tu captura
        emailSoporte: formData.emailSoporte,
        sedePrincipal: formData.sedePrincipal,
        fechaRegistro: serverTimestamp(),
      });

      // 3. Crear Usuario Administrador
      const userCred = await createUserWithEmailAndPassword(auth, adminData.email, adminData.password);
      await setDoc(doc(db, "usuarios", userCred.user.uid), {
        email: adminData.email,
        nombre: "Administrador Central",
        rol: "admin_institucion",
        institucionId: instId,
        fechaCreacion: serverTimestamp()
      });

      // 4. Redirección lógica
      if (plan === 'premium') {
        // Sustituir por tu link real de Stripe
        window.location.href = "https://buy.stripe.com/test_tu_link_aqui";
      } else {
        navigate("/admin-dashboard");
      }

    } catch (error) { 
      console.error(error);
      alert("Error en el registro: " + error.message); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      
      {/* FONDO DINÁMICO (Mismo del Login) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <button 
        onClick={() => navigate("/")}
        className="absolute top-8 left-8 flex items-center space-x-2 text-slate-500 hover:text-white transition-all font-black text-[10px] tracking-[0.3em] uppercase z-50 group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span>Cancelar Registro</span>
      </button>

      {/* Contenedor Principal */}
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden z-10 relative border border-white/20">
        
        {/* PANEL IZQUIERDO: VISUALIZADOR */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 relative transition-all duration-700 border-r border-slate-100 overflow-hidden" 
             style={{ backgroundColor: formData.tema.interfaz }}>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-12 opacity-30">
               <Monitor size={20} style={{ color: formData.tema.principal }} />
               <span className="font-black text-[10px] tracking-[0.3em] uppercase">Visualización Live</span>
            </div>

            {/* Mockup Card */}
            <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 transform hover:scale-[1.02] transition-all">
               <div className="flex justify-between items-start mb-8">
                 {formData.logoPreview ? (
                   <img src={formData.logoPreview} className="h-10 object-contain animate-in zoom-in" />
                 ) : (
                   <div className="h-10 w-28 bg-slate-50 rounded-xl animate-pulse" />
                 )}
                 <div className="flex flex-col items-end">
                    <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">SaaS Online</span>
                    </div>
                    {plan === 'premium' && <Star size={14} className="text-amber-400 mt-2 fill-current animate-bounce" />}
                 </div>
               </div>

               <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 leading-tight tracking-tighter">{formData.nombre || 'Nombre de la Institución'}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 flex items-center tracking-widest">
                      <MapPin size={12} className="mr-1.5" /> {formData.sedePrincipal || 'Ubicación Sede'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 opacity-50">
                    <div className="p-4 bg-slate-50 rounded-[1.8rem] flex flex-col items-center border border-slate-100">
                       <Cpu size={20} className="text-slate-300 mb-2" />
                       <span className="text-[8px] font-black text-slate-400 uppercase">Hardware</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-[1.8rem] flex flex-col items-center border border-slate-100">
                       <QrCode size={20} className="text-slate-300 mb-2" />
                       <span className="text-[8px] font-black text-slate-400 uppercase">Scan QR</span>
                    </div>
                  </div>
                  <button className="w-full py-5 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl" 
                          style={{ backgroundColor: formData.tema.principal, borderRadius: '1.5rem' }}>
                    Reportar Fallo
                  </button>
               </div>
            </div>
          </div>

          {/* CAPSULA DE ESTADO MODERNA */}
          <div className="relative group">
            <div className={`absolute -inset-1 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 ${plan === 'premium' ? 'bg-amber-400' : 'bg-blue-600'}`}></div>
            <div className="relative bg-slate-950/90 backdrop-blur-xl text-white p-7 rounded-[2.2rem] flex items-center justify-between border border-white/10 shadow-2xl">
               <div className="flex items-center space-x-5">
                  <div className={`p-4 rounded-2xl transition-all duration-500 ${plan === 'premium' ? 'bg-amber-400 text-amber-950 shadow-[0_0_25px_rgba(251,191,36,0.4)]' : 'bg-blue-600 text-white shadow-[0_0_25px_rgba(37,99,235,0.4)]'}`}>
                      {plan === 'premium' ? <Crown size={24} fill="currentColor" /> : <Zap size={24} fill="currentColor" />}
                  </div>
                  <div>
                      <p className="text-[9px] font-black uppercase opacity-40 mb-1 tracking-[0.2em]">Deployment Status</p>
                      <p className="text-xl font-black italic tracking-tighter uppercase leading-none">
                          {plan === 'premium' ? 'Master Cloud' : 'Trial Mode'}
                      </p>
                  </div>
               </div>
               <Sparkles className={`${plan === 'premium' ? 'text-amber-400' : 'text-blue-500'} animate-pulse`} size={28} />
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: PASOS */}
        <div className="lg:col-span-7 p-8 lg:p-16 bg-white overflow-y-auto max-h-[90vh] custom-scrollbar">
          
          <div className="flex justify-between items-center mb-14">
            <h2 className="text-4xl font-black text-slate-800 uppercase italic leading-none tracking-tighter">Configuración</h2>
            <div className="flex space-x-2">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className={`h-2 rounded-full transition-all duration-700 ${step === s ? 'bg-blue-600 w-14' : 'bg-slate-100 w-4'}`} />
              ))}
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-5 tracking-widest">Nombre Institución</label>
                  <input type="text" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none font-bold" placeholder="Ej: Universidad del Norte" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-5 tracking-widest">Sede / Campus</label>
                  <input type="text" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none font-bold" placeholder="Ej: Campus Central" value={formData.sedePrincipal} onChange={e => setFormData({...formData, sedePrincipal: e.target.value})} />
                </div>
              </div>
              
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-5 tracking-widest">Email de Soporte Oficial</label>
                <input type="email" name="email" id="onboarding-email" autoComplete="email" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none font-bold" placeholder="soporte@institucion.edu" value={formData.emailSoporte} onChange={e => setFormData({...formData, emailSoporte: e.target.value})} />
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-5 tracking-widest">Dominios Oficiales</label>
                <div className="flex space-x-3">
                  <input type="text" className="flex-1 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none font-bold" placeholder="ejemplo.edu" value={formData.currentDominio} onChange={e => setFormData({...formData, currentDominio: e.target.value})} />
                  <button onClick={addDominio} className="px-10 bg-slate-950 text-white rounded-[1.8rem] font-black text-xs hover:bg-blue-600 transition-all active:scale-95 shadow-xl">+</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {formData.dominios.map(d => (
                    <span key={d} className="flex items-center px-6 py-3 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest animate-in zoom-in">
                      {d} <X size={14} className="ml-3 cursor-pointer hover:text-red-400" onClick={() => setFormData({...formData, dominios: formData.dominios.filter(x => x !== d)})} />
                    </span>
                  ))}
                </div>
              </div>

              <button onClick={() => setStep(2)} className="w-full mt-10 bg-slate-950 text-white py-7 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl flex justify-center items-center hover:bg-blue-600 transition-all">
                SIGUIENTE PASO <ArrowRight className="ml-3" size={20} />
              </button>
            </div>
          )}

          {/* STEP 2: BRANDING */}
          {step === 2 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-10">
              <div className="flex items-center space-x-10 bg-slate-50 p-10 rounded-[3.5rem] border border-slate-100">
                <div onClick={() => document.getElementById('logo-f').click()} className="w-32 h-32 bg-white border-4 border-dashed border-slate-200 rounded-[2.5rem] flex items-center justify-center cursor-pointer hover:border-blue-400 transition-all overflow-hidden shadow-xl group">
                  {formData.logoPreview ? <img src={formData.logoPreview} className="p-4 object-contain" /> : <Upload className="text-slate-300 group-hover:text-blue-500 group-hover:scale-110 transition-all" size={40} />}
                </div>
                <input id="logo-f" type="file" hidden accept="image/*" onChange={handleFileChange} />
                <div className="space-y-2">
                   <h4 className="font-black text-slate-800 text-xl italic uppercase tracking-tighter leading-none">Logo Oficial</h4>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Identidad visual para reportes <br/> y paneles de control.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-5">Color Institucional</label>
                   <div className="flex items-center space-x-6 p-4 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <input type="color" className="w-16 h-16 bg-transparent cursor-pointer rounded-2xl border-0 overflow-hidden" value={formData.tema.principal} 
                             onChange={e => setFormData({...formData, tema: {...formData.tema, principal: e.target.value}})} />
                      <span className="text-sm font-mono font-bold text-slate-500 uppercase">{formData.tema.principal}</span>
                   </div>
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-5">Fondo de Interfaz</label>
                   <div className="flex items-center space-x-6 p-4 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <input type="color" className="w-16 h-16 bg-transparent cursor-pointer rounded-2xl border-0" value={formData.tema.interfaz} 
                             onChange={e => setFormData({...formData, tema: {...formData.tema, interfaz: e.target.value}})} />
                      <span className="text-sm font-mono font-bold text-slate-500 uppercase">{formData.tema.interfaz}</span>
                   </div>
                </div>
              </div>

              <div className="flex space-x-6 mt-12">
                <button onClick={() => setStep(1)} className="w-1/3 py-6 font-black text-slate-400 text-[11px] tracking-[0.4em] uppercase">Atrás</button>
                <button onClick={() => setStep(3)} className="flex-1 bg-slate-950 text-white py-7 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-blue-600 transition-all">Siguiente</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div onClick={() => setPlan('trial')} className={`group p-10 rounded-[3.5rem] border-4 cursor-pointer transition-all ${plan === 'trial' ? 'border-blue-600 bg-blue-50' : 'border-slate-50 opacity-40 hover:opacity-100'}`}>
                 <div className="flex justify-between items-center mb-6">
                    <div className="p-5 bg-white rounded-3xl shadow-xl"><Globe className="text-slate-400" size={24} /></div>
                    <div className="text-right">
                       <span className="text-4xl font-black text-slate-800">$0</span>
                       <p className="text-[11px] uppercase text-slate-400 font-black">Free Trial</p>
                    </div>
                 </div>
                 <h3 className="font-black text-2xl text-slate-800 uppercase italic leading-none">30 Días de Prueba</h3>
                 <p className="text-xs text-slate-500 font-bold mt-4 italic">Acceso completo para que configures todos tus laboratorios.</p>
              </div>

              <div onClick={() => setPlan('premium')} className={`group p-10 rounded-[3.5rem] border-4 cursor-pointer transition-all relative overflow-hidden ${plan === 'premium' ? 'border-amber-400 bg-amber-50 shadow-[0_0_50px_rgba(251,191,36,0.1)]' : 'border-slate-50 opacity-40 hover:opacity-100'}`}>
                 {plan === 'premium' && <div className="absolute top-0 right-0 bg-amber-400 text-amber-900 px-12 py-3 rounded-bl-[2.5rem] font-black text-[10px] uppercase">Master SaaS</div>}
                 <div className="flex justify-between items-center mb-6">
                    <div className={`p-5 rounded-3xl shadow-2xl transition-all duration-500 ${plan === 'premium' ? 'bg-amber-400 text-amber-900' : 'bg-slate-100 text-slate-300'}`}>
                        <Crown size={24} fill={plan === 'premium' ? 'currentColor' : 'none'} />
                    </div>
                    <div className="text-right">
                       <span className="text-4xl font-black text-slate-800">$12 <span className="text-sm line-through text-slate-300 font-bold">$24</span></span>
                       <p className="text-[11px] uppercase text-amber-600 font-black tracking-widest mt-1">Suscripción Anual</p>
                    </div>
                 </div>
                 <h3 className="font-black text-2xl text-slate-800 uppercase italic leading-none">Plan Profesional</h3>
                 <div className="grid grid-cols-2 gap-2 mt-6">
                    <p className="text-[10px] text-slate-600 font-bold"><CheckCircle2 className="inline w-3 h-3 text-emerald-500 mr-2" /> Sedes Ilimitadas</p>
                    <p className="text-[10px] text-slate-600 font-bold"><CheckCircle2 className="inline w-3 h-3 text-emerald-500 mr-2" /> Soporte Priority</p>
                 </div>
              </div>

              <div className="flex space-x-6 mt-12">
                <button onClick={() => setStep(2)} className="w-1/3 py-6 font-black text-slate-400 uppercase tracking-widest">Atrás</button>
                <button onClick={() => setStep(4)} className="flex-1 bg-slate-950 text-white py-7 rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all">Configurar Admin</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <input type="email" name="email" id="admin-email" autoComplete="email" required className="w-full p-7 bg-slate-50 border border-slate-100 rounded-[2.5rem] outline-none font-bold" placeholder="admin@institucion.edu" onChange={e => setAdminData({...adminData, email: e.target.value})} />
              <input type="password" name="password" id="admin-password" autoComplete="new-password" required className="w-full p-7 bg-slate-50 border border-slate-100 rounded-[2.5rem] outline-none font-bold" placeholder="Contraseña Maestra" onChange={e => setAdminData({...adminData, password: e.target.value})} />
              
              <div className="p-8 bg-blue-50 rounded-[3rem] border border-blue-100 flex items-center space-x-6 group overflow-hidden relative">
                 <div className="p-4 bg-blue-600 text-white rounded-3xl shadow-2xl group-hover:scale-110 transition-transform"><Sparkles size={28} /></div>
                 <div>
                    <h4 className="font-black text-blue-900 text-sm uppercase italic">Confirmación</h4>
                    <p className="text-[11px] text-blue-700 font-bold leading-relaxed mt-1 tracking-tight">Desplegaremos el núcleo inmediatamente.</p>
                 </div>
              </div>

              <div className="flex space-x-6 mt-12">
                <button onClick={() => setStep(3)} className="w-1/3 py-6 font-black text-slate-400 uppercase tracking-widest">Atrás</button>
                <button onClick={handleFinish} disabled={loading} className="flex-1 bg-blue-600 text-white py-7 rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-700 transition-all active:scale-95">
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : "DESPLEGAR NÚCLEO"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <div className="absolute bottom-10 flex items-center space-x-4 opacity-40">
         <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
         <p className="text-white text-[10px] font-black tracking-[0.5em] uppercase italic">System Core: Encryption Active</p>
      </div>

    </div>
  );
}