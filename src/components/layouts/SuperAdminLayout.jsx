import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, MapPin, Users, Settings, LogOut, 
  BarChart3, Microscope, Bell, Search, ChevronRight
} from 'lucide-react';

export default function SuperAdminLayout({ children, user, inst, activeTab, setActiveTab }) {
  const navigate = useNavigate();
  const temaColor = inst?.temaColor || '#3b82f6';

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/'); 
    } catch (error) {
      console.error("Error al salir:", error);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Resumen Global', icon: LayoutDashboard },
    { id: 'sedes', label: 'Gestión de Sedes', icon: MapPin },
    { id: 'labs', label: 'Laboratorios', icon: Microscope },
    { id: 'usuarios', label: 'Control de Usuarios', icon: Users },
    { id: 'config', label: 'Personalización', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-20">
        <div className="p-8 border-b border-slate-100 flex flex-col items-center">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-xl border border-slate-100 p-3 flex items-center justify-center mb-4 transition-transform hover:rotate-3">
            <img src={inst?.logoUrl} alt="Logo" className="max-h-full object-contain" />
          </div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">Master SaaS Control</h2>
          <p className="font-bold text-slate-800 text-sm truncate w-full text-center mt-1 px-4">{inst?.nombre}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                activeTab === item.id 
                ? 'shadow-lg shadow-slate-200 bg-white' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
              style={activeTab === item.id ? { borderLeft: `4px solid ${temaColor}` } : {}}
            >
              <div className="flex items-center">
                <item.icon size={18} className="mr-3" style={{ color: activeTab === item.id ? temaColor : 'currentColor' }} />
                <span className={`text-[11px] font-black uppercase tracking-widest ${activeTab === item.id ? 'text-slate-900' : ''}`}>
                  {item.label}
                </span>
              </div>
              {activeTab === item.id && <ChevronRight size={14} style={{ color: temaColor }} />}
            </button>
          ))}
        </nav>

        <div className="p-6">
          <button onClick={handleLogout} className="w-full flex items-center p-4 text-red-500 bg-red-50 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all shadow-sm">
            <LogOut size={16} className="mr-3" /> Salir del Sistema
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-10 shrink-0">
          <div className="relative w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input type="text" placeholder="Buscar en el núcleo..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs font-bold focus:ring-4 transition-all" style={{ '--tw-ring-color': `${temaColor}15` }} />
          </div>
          
          <div className="flex items-center space-x-4 border-l pl-6 border-slate-200">
            <div className="text-right">
              <p className="text-xs font-black text-slate-800 tracking-tight">{user?.nombre}</p>
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: temaColor }}>Master Admin</p>
            </div>
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg rotate-3" style={{ backgroundColor: temaColor }}>
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