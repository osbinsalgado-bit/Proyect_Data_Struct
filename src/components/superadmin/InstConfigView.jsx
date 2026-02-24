import { useState } from 'react';
import { db, storage, auth } from '../../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updatePassword } from 'firebase/auth';
import { Palette, CheckCircle, RefreshCcw, Upload, Lock, Mail, ImageIcon, Layout } from 'lucide-react';

export default function InstConfigView({ inst, temaColor }) {
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(inst.logoUrl);
  const [pass, setPass] = useState('');

  const [form, setForm] = useState({
    temaColor: inst.temaColor || '#3b82f6',
    temaInterfaz: inst.temaInterfaz || '#ffffff', // SEGUNDO COLOR
    emailSoporte: inst.emailSoporte || '',
  });

  const handleSave = async (field, value) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "instituciones", inst.id), { [field]: value });
      alert("Ajuste actualizado");
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-20">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* CAJITA 1: LOGOTIPO */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl"><ImageIcon size={20}/></div>
            <h3 className="font-black text-slate-800 uppercase italic">Identidad Visual</h3>
          </div>
          <div className="flex flex-col items-center">
             <div onClick={() => document.getElementById('l-up').click()} className="w-32 h-32 border-4 border-dashed border-slate-100 rounded-[2.5rem] flex items-center justify-center cursor-pointer hover:border-blue-400 overflow-hidden">
                {logoPreview ? <img src={logoPreview} className="p-4 object-contain" /> : <Upload className="text-slate-300" />}
             </div>
             <input type="file" id="l-up" hidden onChange={(e) => {setLogoFile(e.target.files[0]); setLogoPreview(URL.createObjectURL(e.target.files[0]));}} />
             <button onClick={async () => {
                const r = ref(storage, `logos/${inst.id}`);
                await uploadBytes(r, logoFile);
                const url = await getDownloadURL(r);
                handleSave('logoUrl', url);
             }} className="mt-6 px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase">Subir Nuevo Logo</button>
          </div>
        </div>

        {/* CAJITA 2: TEMAS DUALES */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl"><Palette size={20}/></div>
            <h3 className="font-black text-slate-800 uppercase italic">Paleta de Colores</h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Color Primario</label>
                <input type="color" value={form.temaColor} onChange={e => setForm({...form, temaColor: e.target.value})} className="w-full h-16 rounded-2xl cursor-pointer" />
            </div>
            <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Color Interfaz</label>
                <input type="color" value={form.temaInterfaz} onChange={e => setForm({...form, temaInterfaz: e.target.value})} className="w-full h-16 rounded-2xl cursor-pointer" />
            </div>
          </div>
          <button onClick={() => {handleSave('temaColor', form.temaColor); handleSave('temaInterfaz', form.temaInterfaz);}} className="w-full py-4 text-white rounded-2xl font-black text-[10px] uppercase" style={{ backgroundColor: temaColor }}>Aplicar Temas</button>
        </div>

        {/* CAJITA 3: SEGURIDAD */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-red-50 text-red-500 rounded-2xl"><Lock size={20}/></div>
            <h3 className="font-black text-slate-800 uppercase italic">Seguridad Administrativa</h3>
          </div>
          <input type="password" placeholder="Nueva Contraseña Maestra" value={pass} onChange={e => setPass(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" />
          <button onClick={async () => { await updatePassword(auth.currentUser, pass); alert("Password cambiado"); }} className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase">Actualizar Credenciales</button>
        </div>

        {/* CAJITA 4: CONFIGURACIÓN SAAS */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl"><Mail size={20}/></div>
            <h3 className="font-black text-slate-800 uppercase italic">Canales de Comunicación</h3>
          </div>
          <div className="space-y-4">
             <input type="email" value={form.emailSoporte} onChange={e => setForm({...form, emailSoporte: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold" />
             <button onClick={() => handleSave('emailSoporte', form.emailSoporte)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase">Guardar Correo</button>
          </div>
        </div>
      </div>
    </div>
  );
}