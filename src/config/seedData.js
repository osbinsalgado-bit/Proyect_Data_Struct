import { db } from './firebase'; // Ajusta la ruta a tu config
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  Timestamp, 
  writeBatch 
} from "firebase/firestore"; 

// --- 1. FUNCIÓN PARA CALCULAR EXPIRACIÓN (La lógica del reloj) ---
// Convierte horas a un Timestamp de Firebase
export const calcularExpiracion = (horas) => {
  const ahora = new Date();
  ahora.setHours(ahora.getHours() + horas);
  return Timestamp.fromDate(ahora);
};

// --- 2. SCRIPT PARA CARGAR TODA LA DATA DE PRUEBA ---
export const cargarDataPrueba = async () => {
  const batch = writeBatch(db);
  const instId = "unitec-hn"; // Tu ID de institución ya existente

  try {
    console.log("Iniciando carga de datos...");

    // A. CREAR SEDES
    const sedes = [
      { id: "sede-tgu", nombre: "Tegucigalpa", institucionId: instId },
      { id: "sede-sps", nombre: "San Pedro Sula", institucionId: instId }
    ];

    for (const sede of sedes) {
      const sedeRef = doc(db, "sedes", sede.id);
      batch.set(sedeRef, sede);
    }

    // B. CREAR USUARIO TEMPORAL (Ejemplo 1 semana = 168 horas)
    const temporalRef = doc(db, "usuarios", "temp-user-01"); // En producción usa el UID de Auth
    batch.set(temporalRef, {
      nombre: "Estudiante Temporal",
      email: "temporal@unitec.edu",
      rol: "temporal",
      institucionId: instId,
      sedesAsignadas: ["sede-sps"],
      status: "activo",
      fechaCreacion: Timestamp.now(),
      expiresAt: calcularExpiracion(168) // 1 semana
    });

    // C. CREAR 3 LABORATORIOS (2 en SPS, 1 en TGU)
    const labsData = [
      { id: "lab-01", nombre: "Laboratorio de IA", sedeId: "sede-sps" },
      { id: "lab-02", nombre: "Laboratorio de Redes", sedeId: "sede-sps" },
      { id: "lab-03", nombre: "Laboratorio de Diseño", sedeId: "sede-tgu" }
    ];

    for (const lab of labsData) {
      const labRef = doc(db, "laboratorios", lab.id);
      batch.set(labRef, {
        ...lab,
        institucionId: instId,
        columnasGrid: 5,
        filasGrid: 5
      });

      // D. CREAR 5 COMPUTADORAS POR CADA LABORATORIO
      for (let i = 1; i <= 5; i++) {
        const pcId = `${lab.id}-PC0${i}`;
        const pcRef = doc(db, "computadoras", pcId);
        batch.set(pcRef, {
          codigo: pcId,
          institucionId: instId,
          sedeId: lab.sedeId,
          labId: lab.id,
          estado: "operativo",
          software: ["Windows 11", "Office 365"],
          specs: { ram: "16GB", procesador: "i7" },
          coordenadas: { x: i, y: 1 } // Se posicionan en fila
        });
      }
    }

    await batch.commit();
    console.log("¡Data de prueba cargada con éxito!");
  } catch (error) {
    console.error("Error cargando data:", error);
  }
};