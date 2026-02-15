import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <pre className="text-terminal-dim font-mono text-sm leading-tight select-none">
{`     _____________
    /             \\
   |    R.I.P.    |
   |              |
   |  This page   |
   |  died before |
   |  it was born |
   |              |
   |______________|
        | |
    .___|_|___.
    |_________|`}
      </pre>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">404 — Page Not Found</h1>
        <p className="text-muted-foreground text-lg">
          You've reached the void.
          <br />
          Not even 1 sat can save this URL.
        </p>
      </div>

      <Link to="/">
        <Button size="lg" className="cursor-pointer">Take me home</Button>
      </Link>
    </div>
  );
}
