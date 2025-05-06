import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';

// Interfaz para almacenar cada marcador
interface Ruta {
  tipo: 'peligro' | 'ruta';
  lat: number;
  lng: number;
  fecha: Date;
}

type TipoMarcador = Ruta['tipo'];

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.scss'],
  standalone: false,
})
export class MapaComponent implements OnInit {
  map!: L.Map;
  tipoSeleccionado: TipoMarcador | null = null;
  rutas: Ruta[] = [];
  destino: string = '';
  apiKey = '5b3ce3597851110001cf62482aa84af9836343798848b1e56c1d4ee8';
  rutaLayer: L.GeoJSON | null = null;

  constructor(private http: HttpClient) {}

  iconos: Record<TipoMarcador, L.Icon> = {
    peligro: L.icon({
      iconUrl: '../../../assets/icon/peligro.jpg',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    }),
    ruta: L.icon({
      iconUrl: '../../../assets/icon/ruta.jpg',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    }),
  };

  ngOnInit() {
    this.initMap();
  }

  initMap(): void {
    this.map = L.map('map').setView([4.711, -74.072], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data © OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (this.tipoSeleccionado) {
        const nuevaRuta: Ruta = {
          tipo: this.tipoSeleccionado,
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          fecha: new Date()
        };

        this.rutas.push(nuevaRuta);

        L.marker([nuevaRuta.lat, nuevaRuta.lng], {
          icon: this.iconos[nuevaRuta.tipo]
        })
        .addTo(this.map)
        .bindPopup(`
          <strong>${nuevaRuta.tipo === 'peligro' ? 'Zona peligrosa' : 'Ruta en mal estado'}</strong><br>
          Fecha: ${nuevaRuta.fecha.toLocaleString()}
        `);

        this.tipoSeleccionado = null;
      }
    });
  }


  seleccionarTipo(tipo: TipoMarcador): void {
    this.tipoSeleccionado = tipo;
  }

  centrarEnMiUbicacion(): void {
    if (!navigator.geolocation) {
      alert('La geolocalización no está soportada en este navegador.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.map.setView([lat, lng], 15);
        L.marker([lat, lng])
          .addTo(this.map)
          .bindPopup('¡Estás aquí!')
          .openPopup();
      },
      (error) => {
        alert('No se pudo obtener la ubicación.');
        console.error(error);
      }
    );
  }

  async trazarRuta(): Promise<void> {
    if (!navigator.geolocation || !this.destino) {
      alert('Ubicación actual o destino no válido.');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const start = [pos.coords.longitude, pos.coords.latitude];

      // 1. Geocodificar destino
      const nominatimURL = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.destino)}`;
      const resultado: any = await this.http.get(nominatimURL).toPromise();
      if (!resultado || resultado.length === 0) {
        alert('No se encontró la dirección.');
        return;
      }

      const end = [parseFloat(resultado[0].lon), parseFloat(resultado[0].lat)];

      // 2. Llamar a OpenRouteService
      const body = {
        coordinates: [start, end],
        profile: 'cycling-regular',
        format: 'geojson'
      };

      const headers = {
        Authorization: this.apiKey,
        'Content-Type': 'application/json'
      };

      try {
        const response: any = await this.http.post(
          'https://api.openrouteservice.org/v2/directions/cycling-regular/geojson',
          body,
          { headers }
        ).toPromise();

        // 3. Dibujar en el mapa
        if (this.rutaLayer) {
          this.map.removeLayer(this.rutaLayer);
        }

        this.rutaLayer = L.geoJSON(response).addTo(this.map);
        this.map.fitBounds(this.rutaLayer.getBounds());

      } catch (error) {
        alert('Error al calcular la ruta');
        console.error(error);
      }

    }, (err) => {
      alert('No se pudo obtener tu ubicación.');
    });
  }
}
