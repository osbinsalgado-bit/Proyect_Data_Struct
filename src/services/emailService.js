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
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px; overflow: hidden;">
            <div style="background-color: ${instData.temaColor || '#2563eb'}; padding: 40px; text-align: center;">
              <img src="${instData.logoUrl}" alt="${instData.nombre}" style="height: 60px; filter: brightness(0) invert(1);">
            </div>
            <div style="padding: 40px; color: #333; line-height: 1.6;">
              <h2 style="color: ${instData.temaColor || '#2563eb'}; margin-top: 0;">${instData.nombre}</h2>
              ${bodyHtml}
              <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="font-size: 10px; color: #aaa; text-align: center; text-transform: uppercase; letter-spacing: 2px;">
                Sistema de Gestión de Laboratorios operado por MINS
              </p>
            </div>
          </div>
        `
      }
    });
  } catch (error) {
    console.error("Error al enviar correo:", error);
  }
};