import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer } from 'lucide-react';

// Añadimos 'sedeNombre' a los props para mostrarlo correctamente
export default function QRGenerator({ lab, inst, pcs, onClose, sedeNombre }) {
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-white z-[600] flex flex-col font-sans overflow-hidden print:bg-white">
      
      {/* HEADER (Oculto al imprimir) */}
      <div className="h-24 border-b border-slate-100 flex items-center justify-between px-12 shrink-0 print:hidden">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">Generador de Etiquetas QR</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {lab.nombre} • {sedeNombre || 'Sede No Especificada'}
          </p>
        </div>
        <div className="flex gap-4">
          <button onClick={handlePrint} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 shadow-xl">
            <Printer size={16}/> Imprimir Etiquetas
          </button>
          <button onClick={onClose} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 transition-colors"><X/></button>
        </div>
      </div>

      {/* ÁREA DE ETIQUETAS */}
      <div className="flex-1 p-12 overflow-auto bg-slate-50 print:bg-white print:p-0">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto print:grid-cols-3 print:gap-4">
          {pcs.map((pc) => (
            <div key={pc.id} className="bg-white border-2 border-slate-200 p-6 rounded-[2.5rem] flex flex-col items-center text-center shadow-sm break-inside-avoid print:shadow-none print:border-slate-300">
              
              {/* Logo e Institución (Encabezado de Etiqueta) */}
              <div className="flex flex-col items-center mb-4">
                <img src={inst.logoUrl} alt="logo" className="h-7 object-contain mb-1" />
                <p className="text-[6px] font-black uppercase text-slate-300 tracking-[0.2em]">{inst.nombre}</p>
              </div>

              {/* QR (Link a la App) */}
              <div className="bg-white p-3 rounded-3xl border border-slate-100 mb-4 shadow-sm">
                <QRCodeSVG 
                    // ACTUALIZADO: Cambiado a la URL de Vercel
                    value={`https://proyectdatastruct.vercel.app/pc/${pc.id}`} 
                    size={110} 
                    level="H"
                />
              </div>

              {/* Información Detallada del Equipo */}
              <div className="space-y-1.5">
                <p className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">
                    {pc.nombre || pc.codigo}
                </p>
                <div className="flex flex-col gap-0.5">
                    {/* CAMBIO REALIZADO: Ahora muestra el nombre de la SEDE real */}
                    <p className="text-[8px] font-black text-blue-600 uppercase leading-none">
                        Sede: {sedeNombre || 'N/A'}
                    </p>
                    <p className="text-[7px] font-bold text-slate-400 uppercase leading-none">
                        Laboratorio: {lab.nombre}
                    </p>
                </div>
              </div>

              {/* Pie de Etiqueta con ID Único */}
              <div className="mt-5 pt-4 border-t border-slate-50 w-full">
                <p className="text-[6px] font-mono text-slate-300 tracking-widest uppercase">
                    Asset ID: {pc.id.slice(-10).toUpperCase()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estilos para impresión en tamaño Carta/A4 */}
      <style>{`
        @media print {
          @page { size: letter; margin: 0.5cm; }
          body { background: white; }
          .print\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
