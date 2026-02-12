import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    settings = await prisma.appSettings.create({
      data: { id: "default" },
    });
  }

  // Mask API keys for security
  return NextResponse.json({
    ...settings,
    geminiApiKey: settings.geminiApiKey ? "••••••" + settings.geminiApiKey.slice(-4) : "",
    openaiApiKey: settings.openaiApiKey ? "••••••" + settings.openaiApiKey.slice(-4) : "",
  });
}

export async function PUT(req: Request) {
  const body = await req.json();

  const data: Record<string, string> = {};
  if (body.geminiApiKey !== undefined && !body.geminiApiKey.startsWith("••••••")) {
    data.geminiApiKey = body.geminiApiKey;
  }
  if (body.openaiApiKey !== undefined && !body.openaiApiKey.startsWith("••••••")) {
    data.openaiApiKey = body.openaiApiKey;
  }
  if (body.defaultProvider !== undefined) {
    data.defaultProvider = body.defaultProvider;
  }

  const settings = await prisma.appSettings.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });

  return NextResponse.json({
    ...settings,
    geminiApiKey: settings.geminiApiKey ? "••••••" + settings.geminiApiKey.slice(-4) : "",
    openaiApiKey: settings.openaiApiKey ? "••••••" + settings.openaiApiKey.slice(-4) : "",
  });
}
