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
    if (!url || !url.includes('firebasestorage.googleapis.com')) {
      console.log('[STORAGE] URL no válida o no pertenece a Firebase Storage');
      return;
    }

    try {
      // Extraer la ruta del archivo de la URL
      // Las URLs de Firebase Storage tienen el formato: .../o/news%2Ffilename?alt=media...
      const decodedUrl = decodeURIComponent(url);
      const startIndex = decodedUrl.indexOf('/o/') + 3;
      const endIndex = decodedUrl.indexOf('?');
      const filePath = decodedUrl.substring(startIndex, endIndex);

      const storageRef = ref(this.storage, filePath);
      await deleteObject(storageRef);
      console.log(`[STORAGE] Imagen eliminada con éxito: ${filePath}`);
    } catch (error) {
      console.error('[STORAGE] Error al eliminar imagen:', error);
      // No lanzamos error para no romper el flujo principal si la imagen ya no existía
    }
  }
}
