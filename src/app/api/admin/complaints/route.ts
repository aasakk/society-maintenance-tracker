import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;
    
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const complaints = await prisma.complaint.findMany({
      where,
      orderBy: [
        { isOverdue: "desc" },
        { createdAt: "desc" },
      ],
      include: { resident: { select: { name: true, flatNumber: true } } },
    });

    return NextResponse.json(complaints);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch complaints" }, { status: 500 });
  }
}
