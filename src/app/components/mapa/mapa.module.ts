import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapaComponent } from './mapa.component';
import { IonicModule } from '@ionic/angular';

@NgModule({
  declarations: [MapaComponent],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [MapaComponent]
})
export class MapaModule {}
