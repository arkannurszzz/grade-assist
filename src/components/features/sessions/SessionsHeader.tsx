import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SessionsHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Sesi Penilaian</h1>
        <p className="text-muted-foreground">Kelola semua sesi penilaian</p>
      </div>
      <Link href="/sessions/new">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Buat Sesi Baru
        </Button>
      </Link>
    </div>
  );
}
