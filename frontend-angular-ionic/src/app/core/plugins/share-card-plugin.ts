import { Injectable } from '@angular/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root'
})
export class ShareCardPlugin {

  /**
   * Captura un elemento HTML, lo convierte en imagen PNG y lo comparte nativamente.
   * @param element El HTMLElement a capturar (ej. la ficha del jugador)
   * @param playerName El nombre del jugador (para nombrar el archivo compartido)
   */
  async shareElementAsImage(element: HTMLElement, playerName: string): Promise<boolean> {
    try {
      console.log('[SHARE-CARD] Iniciando captura de elemento a canvas...');
      
      // 1. Convertir el elemento HTML a Canvas usando html2canvas
      // Usamos configuraciones óptimas para alta calidad y compatibilidad CORS de imágenes
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        scale: 2, // Escala 2x para resolución retina / nítida
        backgroundColor: null // Preservar transparencias o fondos del CSS
      });

      console.log('[SHARE-CARD] Canvas generado. Exportando a base64...');
      // 2. Exportar el canvas a Data URL (base64)
      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.split(',')[1]; // Remover el prefijo data:image/png;base64,

      const fileName = `scouting_${playerName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.png`;

      // 3. Si estamos en la Web convencional (navegador de escritorio)
      if (Capacitor.getPlatform() === 'web') {
        console.log('[SHARE-CARD] Ejecutando en la Web. Iniciando descarga directa...');
        // En web convencional, Navigator Share a veces no permite compartir archivos
        // de forma fiable si no es HTTPS o en navegadores antiguos.
        // Hacemos un fallback excelente: descargar la imagen directamente para el usuario.
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        link.click();
        return true;
      }

      console.log('[SHARE-CARD] Escribiendo archivo temporal en el dispositivo móvil...');
      // 4. Si estamos en Móvil (Capacitor nativo), guardamos en el sistema de archivos temporal
      const writeResult = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache // Guardar en el directorio de caché para que el OS lo limpie después
      });

      console.log('[SHARE-CARD] Archivo guardado con éxito. Abriendo menú compartir...', writeResult.uri);

      // 5. Compartir el archivo guardado nativamente
      await Share.share({
        title: `Ficha de ${playerName}`,
        text: `Información de ${playerName}.`,
        files: [writeResult.uri]
      });

      return true;
    } catch (error) {
      console.error('[SHARE-CARD] Error al capturar o compartir ficha:', error);
      return false;
    }
  }
}
