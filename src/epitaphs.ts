const autoEpitaphs = [
  "Lived fast, died broke",
  "Should have hodled",
  "Gone but not forgotten... actually, probably forgotten",
  "Here lies a wallet that believed in zero fees",
  "Dust to dust, sats to void",
  "One sat short of survival",
  "The mempool doesn't care about your feelings",
  "Not your keys, not your sats, not your problem",
  "Born on-chain, died off-chain",
  "F in the chat",
  "It was a good run... was it though?",
  "I came, I saw, I got reaped",
  "Another one bites the dust",
  "404: Balance not found",
  "This wallet has left the Lightning network",
  "Farewell cruel blockchain",
  "Ran out of sats and patience",
  "The charge loop claims another soul",
  "Insufficient funds for existence",
  "It's not a bug, it's a feature: death",
  "Couldn't even afford to die with dignity",
  "Last seen: desperately looking for inbound liquidity",
  "Died doing what it loved: nothing",
  "Too stubborn to top up, too broke to live",
  "A moment of silence for this empty wallet",
  "The reaper waits for no wallet",
  "Balance: 0. Hope: also 0",
  "Gone to the great mempool in the sky",
  "This wallet made poor life choices",
  "RIP in sats",
  "The hourly charge was too much to bear",
  "Born free, died fee'd",
];

const causeOfDeathTemplates = [
  "Starved on a {dayOfWeek}",
  "Ghosted by its owner",
  "Bled out at {age} old",
  "The charge loop showed no mercy",
  "Flatlined during the {hour}:00 harvest",
  "Ran dry after {charges} charges",
  "Couldn't scrape together 1 sat",
  "Found empty at the {hour}:00 sweep",
  "Abandoned and drained",
  "Neglected to the point of deletion",
  "Owner forgot it existed",
  "Died alone in the {hour}:00 culling",
  "Succumbed to insufficient funds",
  "The reaper came at {hour}:00",
  "Perished in the hourly purge",
];

const daysOfWeek = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
];

export function getRandomEpitaph(): string {
  return autoEpitaphs[Math.floor(Math.random() * autoEpitaphs.length)];
}

export function sanitizeEpitaph(message: string): string | null {
  const trimmed = message.trim().slice(0, 140);
  if (trimmed.length === 0) return null;
  // Basic sanitization: strip HTML tags
  return trimmed.replace(/<[^>]*>/g, "");
}

export function generateCauseOfDeathFlavor(
  createdAt: number,
  totalCharged: number,
): string {
  const now = new Date();
  const template =
    causeOfDeathTemplates[
      Math.floor(Math.random() * causeOfDeathTemplates.length)
    ];

  const ageSeconds = Math.floor(Date.now() / 1000) - createdAt;
  const ageDays = Math.floor(ageSeconds / 86400);
  const ageHours = Math.floor((ageSeconds % 86400) / 3600);
  const ageStr = ageDays > 0 ? `${ageDays}d ${ageHours}h` : `${ageHours}h`;

  return template
    .replace("{dayOfWeek}", daysOfWeek[now.getDay()])
    .replace("{hour}", String(now.getHours()).padStart(2, "0"))
    .replace("{age}", ageStr)
    .replace("{charges}", String(totalCharged));
}
