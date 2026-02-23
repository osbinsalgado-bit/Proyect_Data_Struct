import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth, storage } from '../../config/firebase';
import { collection, doc, setDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  Building2, Upload, Check, Palette, Globe, Shield, 
  Loader2, ArrowRight, X, Mail, MapPin, Crown, 
  ArrowLeft, Monitor, Smartphone, Sparkles, Cpu, QrCode
} from 'lucide-react';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState('trial');

  const [formData, setFormData] = useState({
    nombre: '', 
    sedePrincipal: '',
    emailSoporte: '',
    dominios: [], 
    currentDominio: '',
    tema: {
      principal: '#3b82f6',
      interfaz: '#ffffff',
    },
    logoFile: null,
    logoPreview: null
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
      if (formData.logoFile) {
        const storageRef = ref(storage, `logos/${formData.nombre}-${Date.now()}`);
        await uploadBytes(storageRef, formData.logoFile);
        logoUrl = await getDownloadURL(storageRef);
      }

      const instId = formData.nombre.toLowerCase().replace(/\s+/g, '-');

      await setDoc(doc(db, "instituciones", instId), {
        nombre: formData.nombre,
        sedePrincipal: formData.sedePrincipal,
        emailSoporte: formData.emailSoporte,
        dominioPermitido: formData.dominios,
        logoUrl,
        temaColor: formData.tema.principal,
        temaInterfaz: formData.tema.interfaz,
        plan,
        estado: "activo",
        fechaRegistro: serverTimestamp(),
      });

      const userCred = await createUserWithEmailAndPassword(auth, adminData.email, adminData.password);
      await setDoc(doc(db, "usuarios", userCred.user.uid), {
        email: adminData.email,
        nombre: "Administrador Central",
        rol: "admin_institucion",
        institucionId: instId,
        fechaCreacion: serverTimestamp()
      });

      navigate("/");
    } catch (error) { alert("Error: " + error.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 lg:p-10 font-sans relative overflow-hidden">
      
      {/* FONDO DINÁMICO MEJORADO */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <button 
        onClick={() => navigate("/")}
        className="absolute top-8 left-8 flex items-center space-x-2 text-slate-500 hover:text-white transition-all font-black text-[10px] tracking-[0.3em] uppercase z-50"
      >
        <ArrowLeft size={16} />
        <span>Volver</span>
      </button>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-[3rem] shadow-2xl overflow-hidden z-10 relative">
        
        {/* PANEL IZQUIERDO: MOCKUP REALISTA */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 relative transition-all duration-700 border-r border-slate-50" 
             style={{ backgroundColor: formData.tema.interfaz }}>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-10">
               <div className="p-2 bg-white shadow-lg rounded-xl">
                  <Monitor size={20} style={{ color: formData.tema.principal }} />
               </div>
               <span className="font-black text-slate-800 text-lg tracking-tighter uppercase italic opacity-30">Vista de Usuario</span>
            </div>

            {/* TARJETA DE ESTADO DE COMPUTADORA */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-5">
               <div className="flex justify-between items-start mb-6">
                 {formData.logoPreview ? (
                   <img src={formData.logoPreview} className="h-8 object-contain" />
                 ) : (
                   <div className="h-8 w-20 bg-slate-100 rounded-lg animate-pulse" />
                 )}
                 <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[9px] font-black text-emerald-600 uppercase">En Línea</span>
                 </div>
               </div>

               <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 leading-none">{formData.nombre || 'Institución Educativa'}</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{formData.sedePrincipal || 'Ubicación Sede'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center">
                       <Cpu size={20} className="text-slate-300 mb-2" />
                       <span className="text-[8px] font-bold text-slate-400">HARDWARE</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center">
                       <QrCode size={20} className="text-slate-300 mb-2" />
                       <span className="text-[8px] font-bold text-slate-400">SCAN QR</span>
                    </div>
                  </div>

                  <button className="w-full py-4 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg" 
                          style={{ backgroundColor: formData.tema.principal, borderRadius: '1.2rem' }}>
                    Reportar Fallo
                  </button>
               </div>
            </div>
          </div>

          <div className="bg-slate-950 text-white p-8 rounded-[2.5rem] flex items-center justify-between shadow-2xl">
             <div>
                <p className="text-[10px] font-black uppercase opacity-40 mb-1">Status Sistema</p>
                <p className="font-black italic text-xl">Cloud Active</p>
             </div>
             <Sparkles className="text-blue-500 animate-pulse" size={30} />
          </div>
        </div>

        {/* PANEL DERECHO: PASOS DE CONFIGURACIÓN */}
        <div className="lg:col-span-7 p-8 lg:p-16 bg-white overflow-y-auto max-h-[85vh] custom-scrollbar">
          
          <div className="flex justify-between items-center mb-12">
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Paso {step} de 4</p>
              <h2 className="text-3xl font-black text-slate-800 uppercase italic">Configuración</h2>
            </div>
            <div className="flex space-x-1">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className={`w-8 h-1.5 rounded-full transition-all duration-500 ${step === s ? 'bg-blue-600 w-12' : 'bg-slate-100'}`} />
              ))}
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-8 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nombre Institución</label>
                  <input type="text" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-blue-50 font-bold transition-all" placeholder="Ej: Instituto Tecnológico" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Sede / Ubicación</label>
                  <input type="text" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-bold" placeholder="Ej: Ciudad Central" value={formData.sedePrincipal} onChange={e => setFormData({...formData, sedePrincipal: e.target.value})} />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Email de Soporte</label>
                <input type="email" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-bold" placeholder="soporte@ejemplo.com" value={formData.emailSoporte} onChange={e => setFormData({...formData, emailSoporte: e.target.value})} />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Dominios Autorizados</label>
                <div className="flex space-x-3">
                  <input type="text" className="flex-1 p-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-bold" placeholder="ejemplo.edu" value={formData.currentDominio} onChange={e => setFormData({...formData, currentDominio: e.target.value})} />
                  <button onClick={addDominio} className="px-8 bg-slate-950 text-white rounded-3xl font-black text-xs hover:bg-blue-600 transition-all">+</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {formData.dominios.map(d => (
                    <span key={d} className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider">
                      {d} <X size={14} className="ml-2 cursor-pointer hover:text-red-400" onClick={() => setFormData({...formData, dominios: formData.dominios.filter(x => x !== d)})} />
                    </span>
                  ))}
                </div>
              </div>

              <button onClick={() => setStep(2)} className="w-full mt-10 bg-slate-950 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl flex justify-center items-center hover:bg-blue-600 transition-all">
                SIGUIENTE PASO <ArrowRight className="ml-3" size={18} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-10 animate-in fade-in">
              <div className="flex items-center space-x-8 bg-slate-50 p-8 rounded-[3rem] border border-slate-100">
                <div onClick={() => document.getElementById('logo-f').click()} className="w-28 h-28 bg-white border-4 border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center cursor-pointer hover:border-blue-400 transition-all overflow-hidden shadow-inner group">
                  {formData.logoPreview ? <img src={formData.logoPreview} className="p-4 object-contain" /> : <Upload className="text-slate-300 group-hover:text-blue-500" size={32} />}
                </div>
                <input id="logo-f" type="file" hidden accept="image/*" onChange={handleFileChange} />
                <div className="space-y-1">
                   <h4 className="font-black text-slate-800 text-base italic uppercase tracking-tighter leading-none">Identidad Visual</h4>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sube el logo de la institución.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Color Institucional</label>
                   <div className="flex items-center space-x-4">
                      <input type="color" className="w-16 h-16 bg-transparent cursor-pointer rounded-2xl border-0" value={formData.tema.principal} 
                             onChange={e => setFormData({...formData, tema: {...formData.tema, principal: e.target.value}})} />
                      <span className="text-xs font-mono font-bold text-slate-300 uppercase">{formData.tema.principal}</span>
                   </div>
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Color de Fondo</label>
                   <div className="flex items-center space-x-4">
                      <input type="color" className="w-16 h-16 bg-transparent cursor-pointer rounded-2xl border-0" value={formData.tema.interfaz} 
                             onChange={e => setFormData({...formData, tema: {...formData.tema, interfaz: e.target.value}})} />
                      <span className="text-xs font-mono font-bold text-slate-300 uppercase">{formData.tema.interfaz}</span>
                   </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-12">
                <button onClick={() => setStep(1)} className="w-1/3 py-5 font-black text-slate-400 text-[10px] tracking-[0.3em] uppercase">Atrás</button>
                <button onClick={() => setStep(3)} className="flex-1 bg-slate-950 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-blue-600 transition-all">Continuar</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div onClick={() => setPlan('trial')} className={`p-10 rounded-[3rem] border-4 cursor-pointer transition-all ${plan === 'trial' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-50 opacity-40 hover:opacity-100'}`}>
                 <div className="flex justify-between items-center mb-6">
                    <div className="p-4 bg-white rounded-3xl shadow-lg"><Globe className="text-slate-400" /></div>
                    <span className="text-3xl font-black text-slate-800">$0 <span className="text-[10px] uppercase text-slate-400 font-bold">/ Trial</span></span>
                 </div>
                 <h3 className="font-black text-xl text-slate-800 uppercase italic leading-none">Periodo de Prueba</h3>
                 <p className="text-xs text-slate-400 font-bold leading-relaxed mt-3">30 días de acceso total para implementar tus laboratorios sin cargos.</p>
              </div>

              <div onClick={() => setPlan('premium')} className={`p-10 rounded-[3rem] border-4 cursor-pointer transition-all relative overflow-hidden ${plan === 'premium' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-50 opacity-40 hover:opacity-100'}`}>
                 {plan === 'premium' && <div className="absolute top-0 right-0 bg-blue-600 text-white px-8 py-2 rounded-bl-[2rem] font-black text-[9px] uppercase tracking-widest">Plus+</div>}
                 <div className="flex justify-between items-center mb-6">
                    <div className="p-4 bg-blue-600 text-white rounded-3xl shadow-xl shadow-blue-100"><Crown /></div>
                    <span className="text-3xl font-black text-slate-800">$49 <span className="text-[10px] uppercase text-slate-400 font-bold">/ Mensual</span></span>
                 </div>
                 <h3 className="font-black text-xl text-slate-800 uppercase italic leading-none">Plan Master SaaS</h3>
                 <p className="text-xs text-slate-400 font-bold leading-relaxed mt-3">Sedes ilimitadas, reportes en tiempo real y soporte técnico prioritario.</p>
              </div>

              <div className="flex space-x-4 mt-12">
                <button onClick={() => setStep(2)} className="w-1/3 py-5 font-black text-slate-400 text-[10px] tracking-[0.3em] uppercase">Atrás</button>
                <button onClick={() => setStep(4)} className="flex-1 bg-slate-950 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-blue-600 transition-all">Suscripción</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in fade-in">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Email Administrador Central</label>
                <input type="email" required className="w-full p-6 bg-slate-50 rounded-[2rem] outline-none font-bold shadow-inner" placeholder="ejemplo@admin.com" onChange={e => setAdminData({...adminData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Contraseña de Acceso Maestro</label>
                <input type="password" required className="w-full p-6 bg-slate-50 rounded-[2rem] outline-none font-bold shadow-inner" placeholder="••••••••" onChange={e => setAdminData({...adminData, password: e.target.value})} />
              </div>

              <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 flex items-start space-x-6">
                 <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-200"><Sparkles size={24} /></div>
                 <div>
                    <h4 className="font-black text-emerald-900 text-sm uppercase italic">Entorno Preparado</h4>
                    <p className="text-[10px] text-emerald-700 font-bold leading-relaxed mt-1">Al confirmar, desplegaremos tu infraestructura personalizada para <b>{formData.nombre || 'tu institución'}</b> inmediatamente.</p>
                 </div>
              </div>

              <div className="flex space-x-4 mt-12">
                <button onClick={() => setStep(3)} className="w-1/3 py-5 font-black text-slate-400 text-[10px] tracking-[0.3em] uppercase">Atrás</button>
                <button onClick={handleFinish} disabled={loading} className="flex-1 bg-blue-600 text-white py-6 rounded-[2.2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-blue-200 flex justify-center items-center hover:scale-[1.02] transition-all active:scale-95">
                  {loading ? <Loader2 className="animate-spin" /> : "DESPLEGAR NÚCLEO"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <div className="absolute bottom-8 flex items-center space-x-4 opacity-30 pointer-events-none">
         <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
         <p className="text-white text-[9px] font-black tracking-[0.5em] uppercase italic">System Core: Encryption Active</p>
      </div>

    </div>
  );
}