// Mock API functions for songs CRUD
// In-memory store with sample data — no backend required

let nextId = 6;

let songs = [
  {
    id: 1,
    artist: 'Dena',
    track: 'Cash, Diamond Ring, Swimming Pools',
    link: 'https://www.youtube.com/watch?v=r4CDc9yCAqE',
  },
  {
    id: 2,
    artist: 'Jessy Lanza',
    track: 'Kathy Lee',
    link: 'https://vimeo.com/73455369',
  },
  {
    id: 3,
    artist: 'Tame Impala',
    track: 'The Less I Know the Better',
    link: 'https://www.youtube.com/watch?v=sBzrzS1Ag_g',
  },
  {
    id: 4,
    artist: 'Radiohead',
    track: 'Karma Police',
    link: 'https://www.youtube.com/watch?v=1uYWYWPc9HU',
  },
  {
    id: 5,
    artist: 'Gorillaz',
    track: 'Feel Good Inc.',
    link: 'https://www.youtube.com/watch?v=HyHNuVaZJ-k',
  },
];

// Simulate network delay
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getSongs() {
  await delay();
  return { songs: [...songs], count: songs.length };
}

export async function getSong(id) {
  await delay();
  const song = songs.find((s) => s.id === Number(id));
  return song || null;
}

export async function addSong(song) {
  await delay();
  const newSong = { ...song, id: nextId++ };
  songs.push(newSong);
  return newSong;
}

export async function updateSong(song) {
  await delay();
  const idx = songs.findIndex((s) => s.id === Number(song.id));
  if (idx !== -1) {
    songs[idx] = { ...songs[idx], ...song, id: songs[idx].id };
  }
}

export async function deleteSong(id) {
  await delay();
  songs = songs.filter((s) => s.id !== Number(id));
}

export async function getSongCount() {
  await delay();
  return songs.length;
}
