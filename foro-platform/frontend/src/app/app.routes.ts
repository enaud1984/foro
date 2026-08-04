import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({standalone:true,template:''})
export class DestinazioneNavigazioneComponent {}

export const routes: Routes = [
  {path:'scrivania',component:DestinazioneNavigazioneComponent},
  {path:'agenda',component:DestinazioneNavigazioneComponent},
  {path:'anagrafiche',component:DestinazioneNavigazioneComponent},
  {path:'anagrafiche/nuova',component:DestinazioneNavigazioneComponent},
  {path:'anagrafiche/:id',component:DestinazioneNavigazioneComponent},
  {path:'anagrafiche/:id/modifica',component:DestinazioneNavigazioneComponent},
  {path:'pratiche',component:DestinazioneNavigazioneComponent},
  {path:'pratiche/nuova',component:DestinazioneNavigazioneComponent},
  {path:'pratiche/:id',component:DestinazioneNavigazioneComponent},
  {path:'pratiche/:id/modifica',component:DestinazioneNavigazioneComponent},
];
