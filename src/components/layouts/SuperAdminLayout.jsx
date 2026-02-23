import { useState, useEffect } from 'react';
import { LayoutDashboard, MapPin, Users, Settings, LogOut, Bell } from 'lucide-react';
import { auth, db } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function SuperAdminLayout({ children, user, inst, activeTab, setActiveTab }) {
  // El color que viene de la base de datos (ej: #2563eb)
  const temaColor = inst?.temaColor || '#0f172a';

  const menuItems = [
    { id: 'sedes', label: 'Sedes', icon: MapPin },
    { id: 'usuarios', label: 'Coordinadores', icon: Users },
    { id: 'config', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* SIDEBAR DINÁMICO */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl">
        <div className="p-8 text-center border-b border-slate-800">
          <img src={inst?.logoUrl} alt="Logo" className="h-12 mx-auto mb-4 object-contain" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Panel Super Admin</h2>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center p-4 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest ${
                activeTab === item.id 
                ? 'text-white shadow-lg shadow-black/20' 
                : 'text-slate-500 hover:bg-slate-800'
              }`}
              // APLICAMOS EL COLOR DE LA INSTITUCIÓN SOLO AL BOTÓN ACTIVO
              style={activeTab === item.id ? { backgroundColor: temaColor } : {}}
            >
              <item.icon size={18} className="mr-3" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={() => signOut(auth)} className="w-full flex items-center p-4 text-red-400 hover:bg-red-500/10 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all">
            <LogOut size={18} className="mr-3" /> Salir
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10">
          <h1 className="text-sm font-black text-slate-400 uppercase tracking-widest">
            {inst?.nombre} <span className="mx-2 text-slate-200">|</span> 
            <span className="text-slate-800 italic">{activeTab}</span>
          </h1>
          
          <div className="flex items-center space-x-4 border-l pl-6">
            <div className="text-right">
              <p className="text-xs font-black text-slate-800">{user?.nombre}</p>
              <p className="text-[9px] font-bold uppercase tracking-tighter" style={{ color: temaColor }}>Dueño de Institución</p>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: temaColor }}>
              {user?.nombre?.charAt(0)}
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-10 bg-slate-50/50">
          {children}
        </section>
      </main>
    </div>
  );
}