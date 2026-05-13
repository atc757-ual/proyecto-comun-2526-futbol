import { inject, Injectable } from '@angular/core';
import { 
  Storage, ref, uploadBytes, 
  getDownloadURL, deleteObject 
} from '@angular/fire/storage';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private storage = inject(Storage);

  /**
   * Sube una imagen a Firebase Storage y retorna la URL pública
   * @param file El archivo a subir
   * @param path La carpeta dentro de storage (ej: 'news')
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

  /**
   * Elimina una imagen de Firebase Storage dada su URL
   * @param url La URL completa del archivo en storage
   */
  async deleteImageByUrl(url: string): Promise<void> {
    console.log(`[STORAGE] Intento de borrado para URL: ${url}`);
    
    if (!url || !url.includes('firebasestorage.googleapis.com')) {
      console.warn('[STORAGE] La URL no es de Firebase Storage o está vacía. Saltando borrado.');
      return;
    }

    try {
      // Extraer la ruta del archivo de la URL
      // Formato: .../o/news%2Ffilename?alt=media...
      const decodedUrl = decodeURIComponent(url);
      const startIndex = decodedUrl.indexOf('/o/') + 3;
      const endIndex = decodedUrl.indexOf('?');
      
      if (startIndex === 2 || endIndex === -1) {
        console.error('[STORAGE] No se pudo extraer la ruta del archivo de la URL:', decodedUrl);
        return;
      }

      const filePath = decodedUrl.substring(startIndex, endIndex);
      console.log(`[STORAGE] Ruta extraída: "${filePath}". Solicitando borrado a Firebase...`);

      const storageRef = ref(this.storage, filePath);
      await deleteObject(storageRef);
      
      console.log(`[STORAGE] ✅ Imagen eliminada con éxito del servidor: ${filePath}`);
    } catch (error) {
      console.error('[STORAGE] ❌ Error crítico al eliminar imagen de Firebase:', error);
      // No lanzamos error para no romper el flujo de la app
    }
  }
}
