const NICKNAME_STORAGE_KEY = "nickname";
const LEGACY_NICKNAME_REGEX = /^Player-[A-Z0-9]{4}$/;

const ADJECTIVES = [
  "delicate",
  "agile",
  "brave",
  "bright",
  "calm",
  "clever",
  "curious",
  "eager",
  "gentle",
  "happy",
  "jolly",
  "kind",
  "lively",
  "merry",
  "nimble",
  "playful",
  "quick",
  "silly",
  "smart",
  "snappy",
  "sparkly",
  "spirited",
  "sunny",
  "swift",
  "upbeat",
  "vivid",
  "witty",
  "zippy",
];

const ANIMALS = [
  "alpaca",
  "badger",
  "beaver",
  "bison",
  "buffalo",
  "butterfly",
  "capybara",
  "cheetah",
  "chipmunk",
  "dolphin",
  "eagle",
  "falcon",
  "fox",
  "gazelle",
  "gecko",
  "giraffe",
  "hamster",
  "hedgehog",
  "kangaroo",
  "koala",
  "lemur",
  "leopard",
  "lion",
  "lynx",
  "manatee",
  "meerkat",
  "otter",
  "owl",
  "panda",
  "parrot",
  "penguin",
  "puffin",
  "rabbit",
  "raccoon",
  "seal",
  "sloth",
  "sparrow",
  "swan",
  "tiger",
  "toucan",
  "turtle",
  "whale",
  "wolf",
  "wombat",
  "zebra",
];

function pickRandom(values: readonly string[]): string {
  return values[Math.floor(Math.random() * values.length)];
}

function toTitleCase(text: string): string {
  return `${text[0].toUpperCase()}${text.slice(1)}`;
}

export function generateAnimalNickname(): string {
  const adjective = pickRandom(ADJECTIVES);
  const animal = pickRandom(ANIMALS);
  return `${toTitleCase(adjective)} ${toTitleCase(animal)}`;
}

export function getOrCreateNickname(): string {
  const existing = sessionStorage.getItem(NICKNAME_STORAGE_KEY);
  if (existing && !LEGACY_NICKNAME_REGEX.test(existing)) {
    return existing;
  }

  const generated = generateAnimalNickname();
  sessionStorage.setItem(NICKNAME_STORAGE_KEY, generated);
  return generated;
}
