import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, MapPin, Users, LogOut, 
  Search, ChevronRight, Microscope, AlertCircle 
} from 'lucide-react';

export default function CoordinatorLayout({ children, user, inst, activeTab, setActiveTab, sedeNombre }) {
  const navigate = useNavigate();
  const primaryColor = inst?.temaColorPrincipal || '#3b82f6';

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/'); 
    } catch (error) {
      console.error("Error al salir:", error);
    }
  };

  // Menú filtrado para Coordinador
  const menuItems = [
    { id: 'dashboard', label: 'Resumen Sede', icon: LayoutDashboard },
    { id: 'sedes', label: 'Mi Sede', icon: MapPin },
    { id: 'labs', label: 'Laboratorios', icon: Microscope },
    { id: 'reportes', label: 'Gestión de Fallos', icon: AlertCircle },
    { id: 'usuarios', label: 'Personal / Docentes', icon: Users },
  ];

  return (
    <div className="min-h-screen flex font-sans text-slate-900 bg-white">
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-slate-100 flex flex-col z-20">
        <div className="p-8 border-b border-slate-50 flex flex-col items-center">
          <div className="w-full h-20 flex items-center justify-center mb-2">
            <img src={inst?.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain filter drop-shadow-sm" />
          </div>
          <h1 className="text-[10px] font-black text-slate-900 uppercase italic text-center leading-tight mb-4">
            {inst?.nombre}
          </h1>
          <h2 className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-300 text-center">Panel Coordinación</h2>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                activeTab === item.id ? 'bg-slate-50' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
              style={activeTab === item.id ? { borderRight: `4px solid ${primaryColor}` } : {}}
            >
              <div className="flex items-center">
                <item.icon size={18} className="mr-3" style={{ color: activeTab === item.id ? primaryColor : 'currentColor' }} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${activeTab === item.id ? 'text-slate-900' : ''}`}>
                  {item.label}
                </span>
              </div>
              {activeTab === item.id && <ChevronRight size={14} style={{ color: primaryColor }} />}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-50">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
            style={{ backgroundColor: `${primaryColor}10`, color: primaryColor, border: `1px solid ${primaryColor}20` }}
          >
            <LogOut size={16} className="mr-3" /> Salir del Sistema
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
        <header className="h-24 bg-white border-b border-slate-50 flex items-center justify-between px-12 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 text-slate-400">
               <MapPin size={18} style={{ color: primaryColor }}/>
            </div>
            <div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Sede Asignada</p>
                <h2 className="text-sm font-black text-slate-800 uppercase italic">{sedeNombre}</h2>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-xs font-black text-slate-800 leading-none">{user?.nombre}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{user?.rol}</p>
            </div>
            <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg rotate-3" 
                style={{ backgroundColor: primaryColor }}
            >
              {user?.nombre?.charAt(0)}
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-12 bg-slate-50/20">
          <div className="max-w-7xl mx-auto">{children}</div>
        </section>
      </main>
    </div>
  );
}