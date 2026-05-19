import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root',
})
export class PreferencesPlugin {

  /**
   * Guarda un valor asociado a una clave
   */
  async set(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value });
  }

  /**
   * Obtiene el valor asociado a una clave
   */
  async get(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key });
    return value;
  }

  /**
   * Elimina un registro por clave
   */
  async remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  }

  /**
   * Limpia todos los registros almacenados
   */
  async clear(): Promise<void> {
    await Preferences.clear();
  }

  /**
   * Obtiene la lista de todas las claves almacenadas
   */
  async keys(): Promise<string[]> {
    const { keys } = await Preferences.keys();
    return keys;
  }
}
