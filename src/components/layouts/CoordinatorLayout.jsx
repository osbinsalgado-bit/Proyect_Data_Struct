import { useState } from 'react';
import { LayoutDashboard, UserPlus, Monitor, Users, FileBarChart, LogOut, Bell, Menu, X, MapPin } from 'lucide-react';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';

export default function CoordinatorLayout({ children, user, sedeNombre, activeTab, setActiveTab }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dash', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'solicitudes', label: 'Solicitudes', icon: UserPlus },
    { id: 'labs', label: 'Laboratorios', icon: Monitor },
    { id: 'usuarios', label: 'Usuarios Activos', icon: Users },
    { id: 'reportes', label: 'Reportes', icon: FileBarChart },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col`}>
        <div className="p-6 flex items-center justify-center">
          {/* LOGO DINÁMICO DE LA INSTITUCIÓN */}
          {isSidebarOpen ? (
            <img src={user?.logoUrl} alt="Logo Inst" className="h-12 object-contain" />
          ) : (
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              {user?.nombre?.charAt(0)}
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center p-3 rounded-xl transition-all ${
                activeTab === item.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <item.icon size={20} />
              {isSidebarOpen && <span className="ml-3 font-semibold text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t">
          <button onClick={() => signOut(auth)} className="w-full flex items-center p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-sm">
            <LogOut size={20} />
            {isSidebarOpen && <span className="ml-3">Salir</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8">
          <div className="flex items-center space-x-3">
            <MapPin className="text-blue-600 w-5 h-5" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sede</p>
              <p className="text-slate-700 font-bold text-base">{sedeNombre}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 pl-4 border-l">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">{user?.nombre}</p>
              <p className="text-[10px] text-blue-600 font-bold uppercase">Coordinador</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
              {user?.nombre?.charAt(0)}
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8">
          {children}
        </section>
      </main>
    </div>
  );
}