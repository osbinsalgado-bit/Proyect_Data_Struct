import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, MapPin, Users, Settings, LogOut, 
  Search, ChevronRight, Microscope, AlertCircle // Importamos AlertCircle para reportes
} from 'lucide-react';

export default function SuperAdminLayout({ children, user, inst, activeTab, setActiveTab }) {
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

  const menuItems = [
    { id: 'dashboard', label: 'Resumen Global', icon: LayoutDashboard },
    { id: 'sedes', label: 'Gestión de Campus', icon: MapPin },
    { id: 'labs', label: 'Laboratorios', icon: Microscope },
    { id: 'reportes', label: 'Bandeja de Fallos', icon: AlertCircle }, // NUEVA OPCIÓN
    { id: 'usuarios', label: 'Control de Usuarios', icon: Users },
    { id: 'config', label: 'Personalización', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex font-sans text-slate-900 bg-white">
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-slate-100 flex flex-col z-20">
        
        {/* LOGO E INFORMACIÓN INSTITUCIONAL */}
        <div className="p-8 border-b border-slate-50 flex flex-col items-center">
          <div className="w-full h-24 flex items-center justify-center mb-2 transition-transform hover:scale-105 duration-500">
            <img 
              src={inst?.logoUrl} 
              alt="Logo" 
              className="max-w-full max-h-full object-contain filter drop-shadow-sm" 
            />
          </div>
          
          {/* NOMBRE DE LA INSTITUCIÓN BAJO EL LOGO */}
          <h1 className="text-xs font-black text-slate-900 uppercase italic text-center leading-tight mb-4">
            {inst?.nombre}
          </h1>

          <h2 className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300 text-center">Navegación Core</h2>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                activeTab === item.id 
                ? 'bg-slate-50' 
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
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
            className="w-full flex items-center p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all group"
            style={{ 
                backgroundColor: `${primaryColor}10`,
                color: primaryColor,
                border: `1px solid ${primaryColor}20`
            }}
          >
            <LogOut size={16} className="mr-3 group-hover:-translate-x-1 transition-transform" /> Salir del Sistema
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
        {/* HEADER */}
        <header className="h-24 bg-white border-b border-slate-50 flex items-center justify-between px-12 shrink-0">
          <div className="relative w-96">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
                type="text" 
                placeholder="Buscar en el ecosistema..." 
                className="w-full pl-10 pr-4 py-3 bg-transparent outline-none text-xs font-bold placeholder:text-slate-300 focus:border-b-2 transition-all" 
                style={{ borderColor: primaryColor }}
            />
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-xs font-black text-slate-800 leading-none">{user?.nombre}</p>
              
              {/* CORREO DEL USUARIO LOGUEADO */}
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                {user?.email}
              </p>

              <p className="text-[8px] font-black uppercase tracking-widest mt-0.5" style={{ color: primaryColor }}>
                {inst?.nombre}
              </p>
            </div>

            <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg rotate-3 transition-transform hover:rotate-0" 
                style={{ backgroundColor: primaryColor, boxShadow: `0 10px 20px ${primaryColor}40` }}
            >
              {user?.nombre?.charAt(0)}
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-12 bg-slate-50/20">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
}