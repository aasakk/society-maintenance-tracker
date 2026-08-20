import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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

    let where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;

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
