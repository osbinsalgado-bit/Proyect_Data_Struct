import { useState } from 'react';
import { db } from '../../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Palette, CheckCircle, RefreshCcw } from 'lucide-react';

export default function InstConfigView({ inst }) {
  const [color, setColor] = useState(inst.temaColor);
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    setSaving(true);
    await updateDoc(doc(db, "instituciones", inst.id), { temaColor: color });
    setSaving(false);
    alert("Colores actualizados. Recarga para ver los cambios.");
  };

  return (
    <div className="max-w-2xl bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm animate-in fade-in">
      <div className="flex items-center space-x-4 mb-10">
        <div className="p-3 rounded-2xl" style={{ backgroundColor: `${color}15`, color: color }}>
          <Palette size={24} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Identidad Visual</h2>
      </div>

      <div className="space-y-8">
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-4">Color de Acento Principal</label>
          <div className="flex items-center space-x-6">
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-20 h-20 rounded-2xl cursor-pointer bg-transparent border-0" />
            <div>
              <p className="font-mono font-bold text-slate-700">{color.toUpperCase()}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Este color afectará botones y selecciones.</p>
            </div>
          </div>
        </div>

        <button onClick={handleUpdate} disabled={saving} style={{ backgroundColor: color }}
          className="w-full py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 flex justify-center items-center">
          {saving ? <RefreshCcw className="animate-spin mr-2" /> : <CheckCircle size={18} className="mr-2" />}
          Guardar Cambios de Branding
        </button>
      </div>
    </div>
  );
}