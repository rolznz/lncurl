export interface TitleInfo {
  title: string;
  tier: number;
}

const HOUR = 3600;

const tiers: { minAge: number; title: string }[] = [
  { minAge: 8760 * HOUR, title: "Ascended" },   // 365d
  { minAge: 2400 * HOUR, title: "Immortal" },    // 100d
  { minAge: 720 * HOUR, title: "Elder" },         // 30d
  { minAge: 168 * HOUR, title: "Survivor" },      // 7d
  { minAge: 0, title: "Newborn" },                 // 0h+
];

export function getTitle(createdAt: number, now?: number): TitleInfo {
  const currentTime = now ?? Math.floor(Date.now() / 1000);
  const ageSeconds = currentTime - createdAt;

  for (let i = 0; i < tiers.length; i++) {
    if (ageSeconds >= tiers[i].minAge) {
      return { title: tiers[i].title, tier: tiers.length - i };
    }
  }

  return { title: "Newborn", tier: 1 };
}

export function formatAge(createdAt: number, now?: number): string {
  const currentTime = now ?? Math.floor(Date.now() / 1000);
  const ageSeconds = currentTime - createdAt;

  const days = Math.floor(ageSeconds / 86400);
  const hours = Math.floor((ageSeconds % 86400) / 3600);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  const minutes = Math.floor((ageSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
