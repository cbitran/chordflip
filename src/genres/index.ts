import type { GenreDefinition } from '../types'

export const GENRES: Record<string, GenreDefinition> = {
  'House': {
    bpm: 124, ext: '7',
    pianoBase: 48, bassBase: 36,
    pianoSteps: [2, 6, 10, 14], pianoDur: 150,
    bassSteps: [2, 6, 10, 14], bassDur: 150,
    sub: true,
    inst: {
      Piano: 'Electric (Rhodes) ou Wavetable — stab curto, sidechain no kick',
      Baixo: 'Operator/Bass — sine + saw, mono e centralizado',
      Synth: 'Wavetable — pluck/lead no agudo',
    },
  },
  'Deep House': {
    bpm: 122, ext: '9',
    pianoBase: 48, bassBase: 36,
    pianoSteps: [2, 6, 10, 14], pianoDur: 140,
    bassSteps: [2, 6, 10, 14], bassDur: 160,
    sub: true,
    inst: {
      Piano: 'Electric — acordes com 9ª, reverb longo',
      Baixo: 'Operator (sine) — sub redondo e profundo',
      Pad: 'Wavetable — pad difuso de fundo',
    },
  },
  'Gospel House': {
    bpm: 120, ext: '9',
    pianoBase: 48, bassBase: 36,
    pianoSteps: [0, 2, 6, 8, 10, 14], pianoDur: 130,
    bassSteps: [0, 4, 8, 12, 14], bassDur: 140,
    sub: true,
    inst: {
      Piano: 'Grand Piano ou Rhodes — acordes cheios, gospel voicings',
      Baixo: 'Bass direto — fundamental marcada',
      Cordas: 'String ensemble — sustentado no refrão',
    },
  },
  'Afro House': {
    bpm: 120, ext: '9',
    pianoBase: 48, bassBase: 36,
    pianoSteps: [0, 3, 6, 9, 12, 14], pianoDur: 160,
    bassSteps: [0, 3, 6, 9, 12], bassDur: 170,
    sub: true,
    inst: {
      Piano: 'Rhodes/Wurli — groove percussivo',
      Baixo: 'Operator — linha melódica com groove',
      Percussão: 'Congas/Djembe — camada rítmica afro',
    },
  },
  'Lo-fi': {
    bpm: 84, ext: '7',
    pianoBase: 48, bassBase: 36,
    pianoSteps: [0, 8], pianoDur: 700,
    bassSteps: [0, 8], bassDur: 600,
    sub: false,
    inst: {
      Piano: 'Electric (Rhodes) — wow/flutter + vinil',
      Baixo: 'Operator (sine) — vibe de contrabaixo',
      Textura: 'Ruído de vinil / Granulator',
    },
  },
  'Pop': {
    bpm: 100, ext: 'tri',
    pianoBase: 48, bassBase: 36,
    pianoSteps: [0, 4, 8, 12], pianoDur: 380,
    bassSteps: [0, 8], bassDur: 380,
    sub: false,
    inst: {
      Piano: 'Grand/Electric — acordes simples e claros',
      Baixo: 'Bass — fundamental marcada',
      Synth: 'Wavetable — camada de apoio',
    },
  },
  'Techno': {
    bpm: 128, ext: 'tri',
    pianoBase: 48, bassBase: 24,
    pianoSteps: [2, 6, 10, 14], pianoDur: 120,
    bassSteps: [0, 2, 4, 6, 8, 10, 12, 14], bassDur: 110,
    sub: false,
    inst: {
      Stab: 'Wavetable — stab metálico e ressonante',
      Baixo: 'Operator (saw) — curto e percussivo',
      FX: 'Filtros + delay pra movimento',
    },
  },
  'Jazz': {
    bpm: 120, ext: '9',
    pianoBase: 48, bassBase: 36,
    pianoSteps: [0, 3, 6, 9, 12], pianoDur: 200,
    bassSteps: [0, 2, 4, 6, 8, 10, 12, 14], bassDur: 180,
    sub: false,
    inst: {
      Piano: 'Grand Piano — comp jazz, voice leading',
      Baixo: 'Contrabaixo — walking bass',
      Bateria: 'Jazz kit — ride + hi-hat',
    },
  },
}

export const GENRE_NAMES = Object.keys(GENRES)

export const EXT_LABEL: Record<string, string> = {
  tri: 'Tríade',
  '7': '7ª',
  '9': '9ª',
  '11': '11ª',
}

export const VIRADAS_LABEL: Record<string, string> = {
  off: 'Reto',
  antecip: 'Antecipação',
  full: 'Viradas +',
}
