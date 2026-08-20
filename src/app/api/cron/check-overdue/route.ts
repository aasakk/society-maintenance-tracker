import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // Verify a cron secret if needed (e.g., VERCEL_CRON_SECRET)
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return new Response('Unauthorized', { status: 401 });
    // }

    let config = await prisma.config.findUnique({ where: { id: "global" } });
    if (!config) {
      config = await prisma.config.create({ data: { id: "global", overdueThresholdDays: 3 } });
    }

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - config.overdueThresholdDays);

    // Update complaints that are older than threshold and not resolved
    const result = await prisma.complaint.updateMany({
      where: {
        status: { not: "Resolved" },
        createdAt: { lt: thresholdDate },
        isOverdue: false,
      },
      data: {
        isOverdue: true,
      },
    });

    return NextResponse.json({ success: true, updatedCount: result.count });
  } catch (error) {
    console.error("Cron check-overdue error:", error);
    return NextResponse.json({ error: "Failed to run cron" }, { status: 500 });
  }
}
