import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: params.id },
      include: {
        history: {
          orderBy: { createdAt: "desc" },
          include: { changedByUser: { select: { name: true, role: true } } },
        },
      },
    });

    if (!complaint) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (session.user.role !== "admin" && complaint.residentId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(complaint);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch complaint details" }, { status: 500 });
  }
}
