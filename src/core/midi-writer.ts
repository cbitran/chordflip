import type { MidiEvent } from '../types'

function vlq(n: number): number[] {
  const out = [n & 0x7f]
  n >>= 7
  while (n > 0) {
    out.unshift((n & 0x7f) | 0x80)
    n >>= 7
  }
  return out
}

const s4 = (s: string) => [...s].map(c => c.charCodeAt(0))
const u32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]
const u16 = (n: number) => [(n >>> 8) & 255, n & 255]

export function trackBytes(events: MidiEvent[], bpm: number | null, name: string | null): number[] {
  type RawEvent = [number, number, number[]]
  const evs: RawEvent[] = []

  if (bpm !== null) {
    const us = Math.round(6e7 / bpm)
    evs.push([0, 0, [0xff, 0x51, 0x03, (us >> 16) & 255, (us >> 8) & 255, us & 255]])
  }
  if (name !== null) {
    const nb = s4(name)
    evs.push([0, 0, [0xff, 0x03, nb.length, ...nb]])
  }

  events.forEach(({ tick, duration, note, velocity }) => {
    evs.push([tick, 1, [0x90, note, velocity]])
    evs.push([tick + duration, 0, [0x80, note, 0]])
  })

  evs.sort((a, b) => a[0] - b[0] || a[1] - b[1])

  const out: number[] = []
  let last = 0
  evs.forEach(([t, , d]) => {
    out.push(...vlq(t - last), ...d)
    last = t
  })
  out.push(0, 0xff, 0x2f, 0x00)
  return out
}

export function midiFile(tracks: number[][], tpq = 480): Uint8Array {
  const fmt = tracks.length > 1 ? 1 : 0
  const header = [...s4('MThd'), ...u32(6), ...u16(fmt), ...u16(tracks.length), ...u16(tpq)]
  const data: number[] = [...header]
  tracks.forEach(t => data.push(...s4('MTrk'), ...u32(t.length), ...t))
  return Uint8Array.from(data)
}

export function downloadMidi(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'audio/midi' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 800)
}
