import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

/**
 * Función maestra para enviar correos con branding dinámico
 */
export const sendBrandedEmail = async (to, subject, instData, bodyHtml) => {
  try {
    await addDoc(collection(db, "mail"), {
      to: to,
      message: {
        subject: subject,
        html: `
          <div style="font-family: sans-serif; background-color: ${instData.temaColorSecundario || '#f8fafc'}; padding: 40px 20px;">
            <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 30px; overflow: hidden; shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
              
              <!-- Encabezado con color principal -->
              <div style="background-color: ${instData.temaColorPrincipal || '#2563eb'}; padding: 50px 40px; text-align: center;">
                
                <!-- Contenedor del Logo para que resalte -->
                <div style="background-color: #ffffff; display: inline-block; padding: 15px 25px; border-radius: 20px; box-shadow: 0 10px 15px rgba(0,0,0,0.1);">
                  <img src="${instData.logoUrl}" alt="${instData.nombre}" style="height: 50px; width: auto; object-fit: contain; display: block;">
                </div>

              </div>

              <!-- Cuerpo del Correo -->
              <div style="padding: 40px; color: #1e293b; line-height: 1.8;">
                <h2 style="color: ${instData.temaColorPrincipal || '#2563eb'}; margin-top: 0; font-size: 24px; font-style: italic;">${instData.nombre}</h2>
                
                <div style="font-size: 15px;">
                  ${bodyHtml}
                </div>

                <hr style="border: 0; border-top: 1px solid ${instData.temaColorSecundario}44; margin: 30px 0;">
                
                <p style="font-size: 10px; color: #94a3b8; text-align: center; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">
                  Sistema de Gestión de Laboratorios <br> 
                  <span style="color: ${instData.temaColorPrincipal}">Operado por SGL 3.0</span>
                </p>
              </div>
            </div>
          </div>
        `
      }
    });
  } catch (error) {
    console.error("Error al enviar correo:", error);
  }
};