import { Injectable } from '@angular/core';
import * as L from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class MapPlugin {
  private map: L.Map | null = null;
  private static stylesheetPromise: Promise<void> | null = null;

  constructor() {
    // Configuración de iconos por defecto para Leaflet en entornos Angular/Ionic
    const iconRetinaUrl = 'assets/img/marker-icon-2x.png';
    const iconUrl = 'assets/img/marker-icon.png';
    const shadowUrl = 'assets/img/marker-shadow.png';
    
    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;
  }

  /**
   * Inicializa el mapa en un contenedor específico
   */
  async initMap(elementId: string, lat: number, lng: number, zoom: number = 13): Promise<L.Map> {
    await this.ensureLeafletStyles();
    console.log(`[MAP-PLUGIN] Inicializando mapa en #${elementId} para [${lat}, ${lng}]`);
    if (this.map) {
      console.log('[MAP-PLUGIN] Eliminando instancia anterior del mapa');
      this.map.remove();
    }

    this.map = L.map(elementId).setView([lat, lng], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    return this.map;
  }

  private ensureLeafletStyles(): Promise<void> {
    if (typeof document === 'undefined') {
      return Promise.resolve();
    }

    if (document.getElementById('leaflet-stylesheet')) {
      return Promise.resolve();
    }

    if (!MapPlugin.stylesheetPromise) {
      MapPlugin.stylesheetPromise = new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.id = 'leaflet-stylesheet';
        link.rel = 'stylesheet';
        link.href = 'assets/leaflet/leaflet.css';
        link.onload = () => resolve();
        link.onerror = () => reject(new Error('No se pudo cargar leaflet.css'));
        document.head.appendChild(link);
      });
    }

    return MapPlugin.stylesheetPromise;
  }

  /**
   * Añade un marcador al mapa
   */
  addMarker(lat: number, lng: number, popupText?: string, draggable: boolean = false): L.Marker {
    if (!this.map) throw new Error('Mapa no inicializado');
    
    const marker = L.marker([lat, lng], { draggable }).addTo(this.map);
    if (popupText) {
      marker.bindPopup(popupText);
      if (!draggable) marker.openPopup();
    }
    return marker;
  }

  /**
   * Limpia el mapa
   */
  destroyMap() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  /**
   * Fuerza al mapa a recalcular su tamaño (corrige bugs de zonas grises de Leaflet)
   */
  invalidateSize() {
    if (this.map) {
      setTimeout(() => {
        this.map?.invalidateSize();
      }, 200);
    }
  }
}
