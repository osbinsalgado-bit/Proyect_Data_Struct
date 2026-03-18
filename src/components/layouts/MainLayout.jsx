import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, MapPin, Users, LogOut, 
  ChevronRight, Microscope, AlertCircle, Clock 
} from 'lucide-react';

export default function MainLayout({ children, user, inst, activeTab, setActiveTab, sedeNombre }) {
  const navigate = useNavigate();
  const primaryColor = inst?.temaColorPrincipal || '#3b82f6';

  // Lógica de Menú por Rol
  const esStaff = user?.rol === 'admin_institucion' || user?.rol === 'coordinador';
  const isTemporal = user?.rol === 'temporal';

  const menuItems = [
    // Solo Staff
    ...(esStaff ? [
      { id: 'dashboard', label: 'Resumen Global', icon: LayoutDashboard },
      { id: 'sedes', label: 'Campus', icon: MapPin },
      { id: 'usuarios', label: 'Personal', icon: Users },
    ] : []),

    // Para Todos (Docentes y Staff)
    { id: 'labs', label: esStaff ? 'Laboratorios' : 'Mis Clases', icon: Microscope },
    { id: 'reportes', label: esStaff ? 'Bandeja de Fallos' : 'Reportar Fallo', icon: AlertCircle },
  ];

  // --- LÓGICA DEL CONTADOR PARA TEMPORALES ---
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!isTemporal || !user?.expiraEn) return;

    const interval = setInterval(() => {
      const ahora = new Date().getTime();
      const expira = user.expiraEn.toDate().getTime();
      const diferencia = expira - ahora;

      if (diferencia <= 0) {
        setTimeLeft("EXPIRADO");
        signOut(auth); // Cerrar sesión automáticamente
      } else {
        const horas = Math.floor(diferencia / (1000 * 60 * 60));
        const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${horas}h ${minutos}m restantes`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTemporal, user]);

  return (
    <div className="min-h-screen flex font-sans text-slate-900 bg-white">
      <aside className="w-72 bg-white border-r border-slate-100 flex flex-col z-20">
        <div className="p-8 border-b border-slate-50 flex flex-col items-center">
          <div className="w-full h-20 flex items-center justify-center mb-2">
            <img src={inst?.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
          </div>
          <p className="text-[10px] font-black text-slate-900 uppercase italic text-center leading-tight mb-4">{inst?.nombre}</p>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          {menuItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                activeTab === item.id ? 'bg-slate-50 shadow-sm' : 'text-slate-400 hover:bg-slate-50'
              }`}
              style={activeTab === item.id ? { borderRight: `4px solid ${primaryColor}` } : {}}
            >
              <div className="flex items-center">
                <item.icon size={18} className="mr-3" style={{ color: activeTab === item.id ? primaryColor : 'currentColor' }} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${activeTab === item.id ? 'text-slate-900' : ''}`}>
                  {item.label}
                </span>
              </div>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-50">
          <button onClick={() => signOut(auth)} className="w-full flex items-center p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-red-500 bg-red-50">
             Salir del Sistema
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-24 bg-white border-b border-slate-50 flex items-center justify-between px-12 shrink-0">
          <div className="flex items-center gap-4">
             {/* INDICADOR DE TIEMPO PARA TEMPORALES */}
             {isTemporal && (
               <div className="flex items-center gap-3 px-6 py-3 bg-amber-50 border border-amber-100 rounded-2xl">
                  <Clock size={16} className="text-amber-500 animate-pulse" />
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{timeLeft}</p>
               </div>
             )}
             {!isTemporal && (
                <div>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Sede Actual</p>
                    <h2 className="text-sm font-black text-slate-800 uppercase italic">{sedeNombre}</h2>
                </div>
             )}
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-xs font-black text-slate-800 leading-none">{user?.nombre}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1" style={{ color: primaryColor }}>{user?.rol}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg" style={{ backgroundColor: primaryColor }}>
              {user?.nombre?.charAt(0)}
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-12 bg-slate-50/20">
          {children}
        </section>
      </main>
    </div>
  );
}