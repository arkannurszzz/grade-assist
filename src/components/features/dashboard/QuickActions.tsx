import Link from "next/link";
import { Plus, FileText, BarChart3, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Akses cepat ke fitur-fitur penting</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/sessions/new">
            <Button variant="outline" className="w-full justify-start">
              <Plus className="mr-2 h-4 w-4" />
              Buat Sesi Baru
            </Button>
          </Link>
          <Link href="/sessions">
            <Button variant="outline" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Lihat Semua Sesi
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="mr-2 h-4 w-4" />
              Pengaturan
            </Button>
          </Link>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => window.location.reload()}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
