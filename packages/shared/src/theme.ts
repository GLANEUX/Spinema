/** Design tokens from design/charte-graphique.html (version 2). */

export const colors = {
  mur: '#2B211A',
  murRayure: '#30251D',
  etagere: '#1B1714',
  bois: '#3C2F27',
  boisClair: '#6A5140',
  plastique: '#242120',
  plastiqueClair: '#34302D',
  etiquette: '#EFE3C4',
  poussiere: '#A59B90',
  feutre: '#1D1B2E',
  scotch: '#E6D9B0',
  carton: '#B98F5E',
  liege: '#A9794B',
  papier: '#F7F2E6',
  polaroid: '#F4EFE4',
  moutarde: '#D9A441',
  moutardeOmbre: '#8C6A28',
  bleuVert: '#6FA3A0',
  rouge: '#A8453A',
  jeton: '#C4574A',
  orange: '#F08A3C',
  led: '#8DFF9A',
  ledFond: '#071108',
  etiquettes: ['#EFE3C4', '#E9D9A8', '#CFE0D6', '#F1C9B8', '#D6DCEF'],
} as const;

export const fonts = {
  feutre: 'PermanentMarker_400Regular',
  main: 'Caveat_700Bold',
  imprime: 'Archivo_900Black_Italic',
  texte: 'Archivo_400Regular',
  texteFort: 'Archivo_600SemiBold',
  led: 'IBMPlexMono_600SemiBold',
} as const;

export const touche = { relief: 5, reliefSombre: 4, rayon: 8, zoneMin: 48 } as const;
export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 24 } as const;
export const motion = {
  defilement: { duree: 2800, easing: [0.15, 0.85, 0.25, 1] },
  soulevement: { duree: 380, easing: [0.2, 0.9, 0.3, 1.3] },
  touche: { duree: 80 },
} as const;
