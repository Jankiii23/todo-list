import Link from "next/link";
import { UserNav } from "./UserNav";
import { NotebookPen } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <NotebookPen className="h-7 w-7 text-primary" />
          <span className="text-2xl font-bold text-primary">TaskFlow</span>
        </Link>
        <UserNav />
      </div>
    </header>
  );
}
