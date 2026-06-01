// Biblioteca de esqueletos harmônicos curados
// Cada esqueleto é definido em graus relativos (semitones from root)
// O sistema transpõe para qualquer tonalidade

export interface ProgressionSkeleton {
  id: string
  name: string
  character: string
  description: string
  // Graus em semitons a partir da raiz (0 = I, 5 = IV, 7 = V, etc.)
  degrees: number[]
  // Qualidade base de cada grau antes do enriquecimento
  qualities: string[]
  // Gêneros compatíveis (vazio = todos)
  genres: string[]
  // Tags para busca/filtro
  tags: string[]
}

export const SKELETONS: ProgressionSkeleton[] = [
  // ── House clássico ─────────────────────────────────────────────
  {
    id: 'house-classic-1645',
    name: 'I – VI – IV – V',
    character: 'Clássico, emocional, familiar',
    description: 'A progressão mais usada no House. Funciona em qualquer tonalidade.',
    degrees: [0, 9, 5, 7],
    qualities: ['maj', 'm', 'maj', 'maj'],
    genres: ['House', 'Deep House', 'Gospel House'],
    tags: ['classic', 'emotional', 'soul'],
  },
  {
    id: 'house-classic-1345',
    name: 'I – III – IV – V',
    character: 'Quente, soul, anos 70',
    description: 'O esqueleto de "Stuck on You". Base do gospel house.',
    degrees: [0, 4, 5, 7],
    qualities: ['maj', 'm', 'maj', 'maj'],
    genres: ['House', 'Deep House', 'Gospel House'],
    tags: ['soul', 'gospel', 'warm'],
  },
  {
    id: 'house-minor-625',
    name: 'VI – II – V – I',
    character: 'Tenso, melancólico, cíclico',
    description: 'Ciclo de quintas descendente. Resolve no I com força.',
    degrees: [9, 2, 7, 0],
    qualities: ['m', 'm', 'maj', 'maj'],
    genres: ['House', 'Deep House'],
    tags: ['tension', 'melancholy', 'cycle'],
  },
  // ── Deep House ─────────────────────────────────────────────────
  {
    id: 'deep-house-1625',
    name: 'I – VI – II – V',
    character: 'Sofisticado, jazz, elegante',
    description: 'Turnaround jazz adaptado para deep house. Com 9ª soa extraordinário.',
    degrees: [0, 9, 2, 7],
    qualities: ['maj', 'm', 'm', 'maj'],
    genres: ['Deep House', 'Gospel House', 'Jazz'],
    tags: ['jazz', 'sophisticated', 'elegant'],
  },
  {
    id: 'deep-house-modal',
    name: 'I – bVII – IV – I',
    character: 'Modal, aberto, psicodélico',
    description: 'bVII emprestado cria espaço modal característico do deep/afro.',
    degrees: [0, 10, 5, 0],
    qualities: ['maj', 'maj', 'maj', 'maj'],
    genres: ['Deep House', 'Afro House'],
    tags: ['modal', 'open', 'psychedelic'],
  },
  {
    id: 'deep-house-2516',
    name: 'II – V – I – VI',
    character: 'Jazz-house, resolução forte',
    description: 'ii–V–I com extensão no VI. Muito usado no deep house europeu.',
    degrees: [2, 7, 0, 9],
    qualities: ['m', 'maj', 'maj', 'm'],
    genres: ['Deep House', 'Jazz'],
    tags: ['jazz', 'resolution', 'european'],
  },
  // ── Gospel House ───────────────────────────────────────────────
  {
    id: 'gospel-145',
    name: 'I – IV – V',
    character: 'Espiritual, poderoso, simples',
    description: 'A base do gospel. Simples mas devastadora com voicings de 9ª e 11ª.',
    degrees: [0, 5, 7],
    qualities: ['maj', 'maj', 'maj'],
    genres: ['Gospel House', 'House'],
    tags: ['gospel', 'powerful', 'spiritual'],
  },
  {
    id: 'gospel-1564',
    name: 'I – V – VI – IV',
    character: 'Épico, grandioso, gospel moderno',
    description: 'Progressão do gospel moderno. Muito usada em house com coral.',
    degrees: [0, 7, 9, 5],
    qualities: ['maj', 'maj', 'm', 'maj'],
    genres: ['Gospel House'],
    tags: ['epic', 'grand', 'modern-gospel'],
  },
  // ── Afro House ─────────────────────────────────────────────────
  {
    id: 'afro-minor-loop',
    name: 'I – IV – bVII – IV',
    character: 'Hipnótico, afro, tribal',
    description: 'Loop modal com movimento bVII. Característica do afro house.',
    degrees: [0, 5, 10, 5],
    qualities: ['m', 'm', 'maj', 'm'],
    genres: ['Afro House'],
    tags: ['afro', 'hypnotic', 'loop', 'tribal'],
  },
  {
    id: 'afro-1b345',
    name: 'I – bIII – IV – V',
    character: 'Dark, groove, africano',
    description: 'bIII emprestado do menor paralelo. Groove denso e profundo.',
    degrees: [0, 3, 5, 7],
    qualities: ['m', 'maj', 'm', 'maj'],
    genres: ['Afro House', 'Deep House'],
    tags: ['dark', 'groove', 'african'],
  },
  // ── Universal ──────────────────────────────────────────────────
  {
    id: 'universal-145b7',
    name: 'I – IV – V – bVII',
    character: 'Funk, groovy, aberto',
    description: 'Adiciona o bVII para um final aberto e funk. Cai bem em qualquer estilo.',
    degrees: [0, 5, 7, 10],
    qualities: ['maj', 'maj', 'maj', 'maj'],
    genres: [],
    tags: ['funk', 'groove', 'universal'],
  },
  {
    id: 'universal-minor-6251',
    name: 'VI – II – V – I (menor)',
    character: 'Dark, progressivo, clássico',
    description: 'Ciclo completo em campo menor. Funciona em todos os gêneros.',
    degrees: [9, 2, 7, 0],
    qualities: ['m', 'm7b5', 'maj', 'm'],
    genres: [],
    tags: ['dark', 'progressive', 'classic', 'minor'],
  },
]

export function getSkeletonsForGenre(genre: string): ProgressionSkeleton[] {
  return SKELETONS.filter(s => s.genres.length === 0 || s.genres.includes(genre))
}
