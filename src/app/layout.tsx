import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { QueryProvider } from "@/providers/query-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GradeAssist - Tool Penilaian Otomatis",
  description: "Tool otomatis untuk dosen menilai jawaban mahasiswa dengan AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <div className="flex h-screen">
            <Sidebar />
            <MobileSidebar />
            <main className="flex-1 overflow-auto bg-muted/30">
              <div className="mx-auto p-6 md:p-6 pt-16 md:pt-6">{children}</div>
            </main>
          </div>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
