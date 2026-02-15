import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WalletTitleBadge } from "./wallet-title-badge";
import type { LeaderboardEntry } from "@/lib/api";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  preview?: boolean;
}

export function LeaderboardTable({ entries, preview }: LeaderboardTableProps) {
  const shown = preview ? entries.slice(0, 5) : entries;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Age</TableHead>
          <TableHead>Title</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shown.map((e) => (
          <TableRow key={e.name}>
            <TableCell className="font-mono text-muted-foreground">
              {e.rank}
            </TableCell>
            <TableCell className="font-mono text-terminal text-sm">
              {e.name}
            </TableCell>
            <TableCell className="font-mono text-sm">{e.age}</TableCell>
            <TableCell>
              <WalletTitleBadge title={e.title} tier={e.tier} />
            </TableCell>
          </TableRow>
        ))}
        {shown.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground">
              No wallets yet
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
