import { inject, Injectable } from '@angular/core';
import { 
  Storage, ref, uploadBytes, 
  getDownloadURL, deleteObject 
} from '@angular/fire/storage';

/**
 * Servicio encargado de gestionar la subida y eliminación de archivos multimedia
 * (principalmente imágenes) utilizando Firebase Storage.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private storage = inject(Storage);

  // --- Operaciones de Subida ---

  /**
   * Sube una imagen a Firebase Storage y retorna la URL pública
   * @param file El archivo a subir
   * @param path La carpeta dentro de storage (ej: 'news' o 'players')
   */
  async uploadImage(file: File, path: string = 'news'): Promise<string> {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(this.storage, `${path}/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log(`[STORAGE] Imagen subida con éxito: ${downloadURL}`);
      return downloadURL;
    } catch (error) {
      console.error('[STORAGE] Error al subir imagen:', error);
      throw error;
    }
  }

  // --- Operaciones de Eliminación ---

  /**
   * Elimina una imagen de Firebase Storage dada su URL
   * @param url La URL completa del archivo en storage
   * @param expectedFolder Opcional: Carpeta esperada para validar que el archivo pertenece al contexto
   */
  async deleteImageByUrl(url: string, expectedFolder?: string): Promise<void> {
    console.log(`[STORAGE] Intento de borrado para URL: ${url} (Carpeta esperada: ${expectedFolder || 'Cualquiera'})`);
    
    if (!url || !url.includes('firebasestorage.googleapis.com')) {
      console.warn('[STORAGE] La URL no es de Firebase Storage o está vacía. Saltando borrado.');
      return;
    }

    try {
      const decodedUrl = decodeURIComponent(url);
      const startIndex = decodedUrl.indexOf('/o/') + 3;
      const endIndex = decodedUrl.indexOf('?');
      
      if (startIndex === 2 || endIndex === -1) {
        console.error('[STORAGE] No se pudo extraer la ruta del archivo de la URL:', decodedUrl);
        return;
      }

      const filePath = decodedUrl.substring(startIndex, endIndex);
      
      // VALIDACIÓN DE CARPETA: Bloquea intentos de borrado fuera del contexto especificado por seguridad
      if (expectedFolder && !filePath.startsWith(`${expectedFolder}/`)) {
        console.warn(`[STORAGE] 🛡️ Bloqueado: El archivo "${filePath}" no pertenece a la carpeta "${expectedFolder}". Saltando borrado.`);
        return;
      }

      console.log(`[STORAGE] Ruta validada: "${filePath}". Solicitando borrado a Firebase...`);

      const storageRef = ref(this.storage, filePath);
      await deleteObject(storageRef);
      
      console.log(`[STORAGE] ✅ Imagen eliminada con éxito del servidor: ${filePath}`);
    } catch (error: any) {
      if (error?.code === 'storage/object-not-found') {
        console.warn(`[STORAGE] El archivo ya no existe en el servidor (404). Ignorando.`);
      } else {
        console.error('[STORAGE] ❌ Error al eliminar imagen de Firebase:', error);
      }
    }
  }
}
