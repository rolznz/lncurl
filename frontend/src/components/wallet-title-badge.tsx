import { Badge } from "@/components/ui/badge";

interface WalletTitleBadgeProps {
  title: string;
  tier: number;
}

const tierColors: Record<number, string> = {
  1: "bg-muted text-muted-foreground",
  2: "bg-terminal/20 text-terminal",
  3: "bg-blue-500/20 text-blue-400",
  4: "bg-purple-500/20 text-purple-400",
  5: "bg-amber-500/20 text-amber-300",
};

export function WalletTitleBadge({ title, tier }: WalletTitleBadgeProps) {
  return (
    <Badge variant="outline" className={tierColors[tier] || tierColors[1]}>
      {title}
    </Badge>
  );
}
