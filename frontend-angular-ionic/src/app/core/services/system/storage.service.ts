import { inject, Injectable } from '@angular/core';
import {
  Storage, ref, uploadBytes,
  getDownloadURL, deleteObject
} from '@angular/fire/storage';
import { LoggerService } from './logger.service';

/**
 * Servicio encargado de gestionar la subida y eliminación de archivos multimedia
 * (principalmente imágenes) utilizando Firebase Storage.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly storage = inject(Storage);
  private logger  = inject(LoggerService);

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
      
      this.logger.log(`[STORAGE] Imagen subida con éxito: ${downloadURL}`);
      return downloadURL;
    } catch (error) {
      this.logger.error('[STORAGE] Error al subir imagen', error);
      throw error;
    }
  }

  // --- Operaciones de Eliminación ---

  /**
   * Elimina una imagen de Firebase Storage dada su URL.
   * @param url La URL completa del archivo en storage
   * @param expectedFolder Opcional: carpeta esperada para validar que el archivo pertenece al contexto
   */
  async deleteImageByUrl(url: string, expectedFolder?: string): Promise<void> {
    this.logger.log(`[STORAGE] Intento de borrado para: ${url} (carpeta: ${expectedFolder ?? 'cualquiera'})`);

    if (!url || !url.includes('firebasestorage.googleapis.com')) {
      this.logger.warn('[STORAGE] URL no es de Firebase Storage o está vacía. Saltando borrado.');
      return;
    }

    try {
      const decodedUrl  = decodeURIComponent(url);
      const startIndex  = decodedUrl.indexOf('/o/') + 3;
      const endIndex    = decodedUrl.indexOf('?');

      if (startIndex === 2 || endIndex === -1) {
        this.logger.error('[STORAGE] No se pudo extraer la ruta del archivo de la URL', decodedUrl);
        return;
      }

      const filePath = decodedUrl.substring(startIndex, endIndex);

      // VALIDACIÓN DE CARPETA: bloquea borrados fuera del contexto especificado
      if (expectedFolder && !filePath.startsWith(`${expectedFolder}/`)) {
        this.logger.warn(`[STORAGE] Bloqueado: "${filePath}" no pertenece a "${expectedFolder}". Saltando.`);
        return;
      }

      this.logger.log(`[STORAGE] Ruta validada: "${filePath}". Solicitando borrado...`);
      await deleteObject(ref(this.storage, filePath));
      this.logger.log(`[STORAGE] Imagen eliminada con éxito: ${filePath}`);

    } catch (error: unknown) {
      if ((error as { code?: string })?.code === 'storage/object-not-found') {
        this.logger.warn('[STORAGE] El archivo ya no existe en el servidor (404). Ignorando.');
      } else {
        this.logger.error('[STORAGE] Error al eliminar imagen de Firebase', error);
      }
    }
  }
}
