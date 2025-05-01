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

  // Íconos personalizados
  iconos: Record<TipoMarcador, L.Icon> = {
    peligro: L.icon({
      iconUrl: '../../../assets/icon/peligro.jpg', // Asegúrate de tener este ícono en assets/icons/
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
    this.map = L.map('map').setView([4.711, -74.072], 13); // Bogotá

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data © OpenStreetMap contributors'
    }).addTo(this.map);

    // Evento al hacer clic en el mapa
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

        // Resetear selección después de colocar marcador
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
}
