import { prisma } from "./db.js";

const categories = {
  chaotic: {
    adjectives: [
      "chaotic",
      "reckless",
      "feral",
      "unhinged",
      "volatile",
      "rogue",
      "wild",
      "turbulent",
      "frantic",
      "manic",
      "erratic",
      "restless",
      "savage",
      "untamed",
      "rabid",
    ],
    nouns: [
      "gremlin",
      "tornado",
      "goblin",
      "spark",
      "havoc",
      "blitz",
      "riot",
      "storm",
      "fury",
      "rampage",
      "tempest",
      "vortex",
      "surge",
      "bolt",
      "inferno",
    ],
  },
  doomed: {
    adjectives: [
      "doomed",
      "forsaken",
      "hopeless",
      "tragic",
      "fallen",
      "wretched",
      "damned",
      "fading",
      "terminal",
      "sinking",
      "crumbling",
      "withered",
      "blighted",
      "cursed",
      "forlorn",
    ],
    nouns: [
      "pickle",
      "soul",
      "wraith",
      "husk",
      "ember",
      "shadow",
      "remnant",
      "phantom",
      "echo",
      "cinder",
      "ash",
      "relic",
      "shard",
      "wisp",
      "void",
    ],
  },
  cursed: {
    adjectives: [
      "cursed",
      "hexed",
      "jinxed",
      "haunted",
      "bewitched",
      "blighted",
      "tainted",
      "stricken",
      "afflicted",
      "plagued",
      "scarred",
      "tormented",
      "vexed",
      "spooked",
      "possessed",
    ],
    nouns: [
      "waffle",
      "toad",
      "raven",
      "moth",
      "serpent",
      "spider",
      "crow",
      "bat",
      "skull",
      "bone",
      "crypt",
      "specter",
      "ghoul",
      "wraith",
      "banshee",
    ],
  },
  legendary: {
    adjectives: [
      "mighty",
      "epic",
      "supreme",
      "cosmic",
      "immortal",
      "divine",
      "legendary",
      "eternal",
      "radiant",
      "sovereign",
      "titan",
      "stellar",
      "mythic",
      "glorious",
      "exalted",
    ],
    nouns: [
      "phoenix",
      "dragon",
      "titan",
      "lion",
      "eagle",
      "wolf",
      "narwhal",
      "kraken",
      "griffin",
      "pegasus",
      "hydra",
      "sphinx",
      "colossus",
      "leviathan",
      "wyvern",
    ],
  },
  haunted: {
    adjectives: [
      "haunted",
      "ghostly",
      "spectral",
      "ethereal",
      "phantom",
      "eerie",
      "shadowy",
      "nocturnal",
      "twilight",
      "misty",
      "hollow",
      "silent",
      "pale",
      "frostbitten",
      "moonlit",
    ],
    nouns: [
      "whisper",
      "shade",
      "fog",
      "mist",
      "chill",
      "dusk",
      "silence",
      "frost",
      "void",
      "abyss",
      "gloom",
      "haunt",
      "dirge",
      "requiem",
      "elegy",
    ],
  },
  absurd: {
    adjectives: [
      "confused",
      "clumsy",
      "dizzy",
      "goofy",
      "wonky",
      "bumbling",
      "wobbly",
      "soggy",
      "fluffy",
      "squishy",
      "cranky",
      "grumpy",
      "sleepy",
      "chunky",
      "funky",
    ],
    nouns: [
      "potato",
      "noodle",
      "walrus",
      "llama",
      "penguin",
      "pancake",
      "muffin",
      "nugget",
      "pickle",
      "waffle",
      "turnip",
      "dumpling",
      "biscuit",
      "pretzel",
      "burrito",
    ],
  },
};

const categoryNames = Object.keys(categories) as (keyof typeof categories)[];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRawName(): string {
  const category = randomItem(categoryNames);
  const { adjectives, nouns } = categories[category];
  const adj = randomItem(adjectives);
  const noun = randomItem(nouns);
  return `lncurl_${adj}_${noun}`;
}

export async function generateWalletName(attempt: number): Promise<string> {
  const name =
    attempt === 0
      ? generateRawName()
      : generateRawName() + Math.floor(Math.random() * 100);
  // Skip names already used locally
  const existing = await prisma.wallet.findUnique({ where: { name } });
  const inGraveyard = await prisma.graveyard.findUnique({ where: { name } });
  if (existing || inGraveyard) {
    return generateRawName() + Math.floor(Math.random() * 1000);
  }
  return name;
}
