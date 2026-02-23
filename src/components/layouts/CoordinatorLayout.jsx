import { useState } from 'react';
import { LayoutDashboard, UserPlus, Monitor, Users, FileBarChart, LogOut, MapPin } from 'lucide-react';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';

export default function CoordinatorLayout({ children, user, sedeNombre, activeTab, setActiveTab }) {
  const [isOpen, setIsOpen] = useState(true);
  const temaColor = user?.temaColor || '#2563eb';

  const menu = [
    { id: 'dash', label: 'Panel', icon: LayoutDashboard },
    { id: 'solicitudes', label: 'Solicitudes', icon: UserPlus },
    { id: 'labs', label: 'Laboratorios', icon: Monitor },
    { id: 'usuarios', label: 'Activos', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className={`${isOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all flex flex-col`}>
        <div className="p-6 h-24 flex items-center justify-center">
          <img src={user?.logoUrl} alt="Logo" className="max-h-full object-contain" />
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menu.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center p-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
                activeTab === item.id ? 'text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'
              }`}
              style={activeTab === item.id ? { backgroundColor: temaColor } : {}}>
              <item.icon size={18} />
              {isOpen && <span className="ml-4">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t">
          <button onClick={() => signOut(auth)} className="w-full flex items-center p-3 text-red-500 hover:bg-red-50 rounded-2xl font-black text-xs uppercase tracking-widest">
            <LogOut size={18} />
            {isOpen && <span className="ml-4">Salir</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-hidden flex flex-col">
        <header className="h-20 bg-white border-b flex items-center justify-between px-8">
          <div className="flex items-center space-x-3">
            <MapPin size={18} style={{ color: temaColor }} />
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gestión Sede</p>
              <h2 className="text-slate-800 font-black italic uppercase tracking-tighter">{sedeNombre}</h2>
            </div>
          </div>
          <div className="flex items-center space-x-4 border-l pl-6">
            <div className="text-right">
              <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">{user?.nombre}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: temaColor }}>Coordinador</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black" style={{ backgroundColor: temaColor }}>
              {user?.nombre?.charAt(0)}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50">{children}</div>
      </main>
    </div>
  );
}