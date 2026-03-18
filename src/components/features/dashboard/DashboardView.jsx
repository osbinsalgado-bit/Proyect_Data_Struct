import { useState, useEffect, useMemo } from 'react';
import { db } from '../../../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { 
  AlertTriangle, CheckCircle, Monitor, TrendingUp, MapPin, Microscope, Calendar
} from 'lucide-react';

export default function DashboardView({ inst, user }) {
  const [data, setData] = useState({ reportes: [], equipos: [], sedes: [], labs: [] });
  const [filtroSede, setFiltroSede] = useState('Todas');
  const [filtroLab, setFiltroLab] = useState('Todos');
  const [rangoTiempo, setRangoTiempo] = useState('Mensual'); // Diario, Semanal, Mensual

  const primaryColor = inst?.temaColorPrincipal || '#3b82f6';
  const isAdmin = user?.rol === 'admin_institucion';

  // 1. CARGA DE DATOS EN TIEMPO REAL
  useEffect(() => {
    if (!inst?.id) return;

    const qReportes = query(collection(db, "reportes"), where("instId", "==", inst.id));
    const qEquipos = query(collection(db, "computadoras"), where("instId", "==", inst.id));
    const qSedes = query(collection(db, "sedes"), where("institucionId", "==", inst.id));
    const qLabs = query(collection(db, "laboratorios"), where("institucionId", "==", inst.id));

    const unsubR = onSnapshot(qReportes, (s) => setData(prev => ({ ...prev, reportes: s.docs.map(d => ({ id: d.id, ...d.data() })) })));
    const unsubE = onSnapshot(qEquipos, (s) => setData(prev => ({ ...prev, equipos: s.docs.map(d => ({ id: d.id, ...d.data() })) })));
    const unsubS = onSnapshot(qSedes, (s) => setData(prev => ({ ...prev, sedes: s.docs.map(d => ({ id: d.id, ...d.data() })) })));
    const unsubL = onSnapshot(qLabs, (s) => setData(prev => ({ ...prev, labs: s.docs.map(d => ({ id: d.id, ...d.data() })) })));

    return () => { unsubR(); unsubE(); unsubS(); unsubL(); };
  }, [inst?.id]);

  // 2. LÓGICA DE FILTRADO (CASCADA Y TIEMPO)
  const datosProcesados = useMemo(() => {
    let { reportes, equipos, sedes, labs } = data;

    // A. Filtrar Sedes por Rol (Si es Coordinador)
    if (!isAdmin) {
      sedes = sedes.filter(s => user.sedesAsignadas?.includes(s.id));
      labs = labs.filter(l => user.sedesAsignadas?.includes(l.sedeId));
    }

    // B. Filtro por Sede Seleccionada
    let reportesFiltrados = filtroSede === 'Todas' ? reportes : reportes.filter(r => r.sedeId === filtroSede);
    let equiposFiltrados = filtroSede === 'Todas' ? equipos : equipos.filter(e => e.sedeId === filtroSede);

    // C. Filtro por Laboratorio Seleccionado
    if (filtroLab !== 'Todos') {
      reportesFiltrados = reportesFiltrados.filter(r => r.labId === filtroLab);
      equiposFiltrados = equiposFiltrados.filter(e => e.labId === filtroLab);
    }

    // D. Filtro por Tiempo
    const ahora = new Date();
    const milisegundosDia = 24 * 60 * 60 * 1000;
    
    reportesFiltrados = reportesFiltrados.filter(r => {
      if (!r.fecha) return false;
      const fechaReporte = r.fecha.toDate();
      const diferenciaDias = (ahora - fechaReporte) / milisegundosDia;

      if (rangoTiempo === 'Diario') return diferenciaDias <= 1;
      if (rangoTiempo === 'Semanal') return diferenciaDias <= 7;
      if (rangoTiempo === 'Mensual') return diferenciaDias <= 30;
      return true;
    });

    return { reportesFiltrados, equiposFiltrados, sedesDisponibles: sedes, labsDisponibles: labs };
  }, [data, filtroSede, filtroLab, rangoTiempo, isAdmin, user]);

  // 3. PREPARAR DATOS PARA GRÁFICAS
  const dataPie = [
    { name: 'Operativos', value: datosProcesados.equiposFiltrados.filter(e => e.estado === 'operativo').length, color: '#10b981' },
    { name: 'En Fallo', value: datosProcesados.equiposFiltrados.filter(e => e.estado === 'dañado').length, color: '#ef4444' },
    { name: 'En Revisión', value: datosProcesados.equiposFiltrados.filter(e => e.estado === 'revisando').length, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      
      {/* PANEL DE CONTROL SUPERIOR */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
            <h2 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">Dashboard</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest italic">Análisis en tiempo real • {rangoTiempo}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
            {/* Filtro Tiempo */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                {['Diario', 'Semanal', 'Mensual'].map(r => (
                    <button key={r} onClick={() => setRangoTiempo(r)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${rangoTiempo === r ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>{r}</button>
                ))}
            </div>
            {/* Filtro Sede */}
            <select value={filtroSede} onChange={(e) => {setFiltroSede(e.target.value); setFiltroLab('Todos');}} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase outline-none">
                <option value="Todas">Sedes: Todas</option>
                {datosProcesados.sedesDisponibles.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
            {/* Filtro Lab */}
            <select value={filtroLab} onChange={(e) => setFiltroLab(e.target.value)} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase outline-none">
                <option value="Todos">Labs: Todos</option>
                {datosProcesados.labsDisponibles.filter(l => filtroSede === 'Todas' || l.sedeId === filtroSede).map(l => (
                    <option key={l.id} value={l.id}>{l.nombre}</option>
                ))}
            </select>
        </div>
      </div>

      {/* METRICAS CLAVE */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatBox title="Equipos" val={datosProcesados.equiposFiltrados.length} icon={<Monitor/>} color="slate" />
          <StatBox title="Saludables" val={datosProcesados.equiposFiltrados.filter(e => e.estado === 'operativo').length} icon={<CheckCircle/>} color="green" />
          <StatBox title="Alertas" val={datosProcesados.equiposFiltrados.filter(e => e.estado === 'dañado').length} icon={<AlertTriangle/>} color="red" />
          <StatBox title="Reportes" val={datosProcesados.reportesFiltrados.length} icon={<TrendingUp/>} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* DISTRIBUCION DE SALUD */}
          <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col items-center">
              <h3 className="text-xl font-black uppercase italic tracking-tighter mb-8 self-start">Distribución de Salud</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={dataPie} innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                            {dataPie.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)'}} />
                        <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', textTransform: 'uppercase', fontSize: '10px', fontWeight: 'bold'}} />
                    </PieChart>
                </ResponsiveContainer>
              </div>
          </div>

          {/* INCIDENCIAS POR LABORATORIO */}
          <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
              <h3 className="text-xl font-black uppercase italic tracking-tighter mb-8">Top Laboratorios con Fallos</h3>
              <div className="space-y-4 overflow-y-auto max-h-[300px] pr-4 custom-scrollbar">
                  {datosProcesados.labsDisponibles
                    .filter(l => filtroSede === 'Todas' || l.sedeId === filtroSede)
                    .map(lab => {
                      const fallos = datosProcesados.equiposFiltrados.filter(e => e.labId === lab.id && e.estado === 'dañado').length;
                      return (
                          <div key={lab.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                              <div>
                                  <p className="text-xs font-black text-slate-900 uppercase italic">{lab.nombre}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{lab.sedeId.slice(0,10)}...</p>
                              </div>
                              <div className="flex items-center gap-4">
                                  <div className="h-2 w-24 bg-slate-200 rounded-full overflow-hidden">
                                      <div className="h-full bg-red-500" style={{ width: `${Math.min((fallos / 10) * 100, 100)}%` }}></div>
                                  </div>
                                  <span className="text-sm font-black text-slate-900">{fallos}</span>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      </div>
    </div>
  );
}

function StatBox({ title, val, icon, color }) {
    const theme = {
        green: 'bg-green-50 text-green-600 border-green-100',
        red: 'bg-red-50 text-red-600 border-red-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        slate: 'bg-slate-50 text-slate-900 border-slate-100'
    };
    return (
        <div className={`p-8 rounded-[3rem] border-2 shadow-sm ${theme[color]}`}>
            <div className="flex justify-between items-center mb-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm">{icon}</div>
                <span className="text-3xl font-black italic tracking-tighter">{val}</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{title}</p>
        </div>
    );
}