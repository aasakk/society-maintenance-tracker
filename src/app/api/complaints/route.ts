import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const complaint = await prisma.complaint.create({
      data: {
        residentId: session.user.id,
        category: data.category,
        description: data.description,
        photoUrl: data.photoUrl,
        location: data.location,
        priority: data.priority || "Medium",
        status: "Open",
      },
    });

    await prisma.complaintStatusHistory.create({
      data: {
        complaintId: complaint.id,
        newStatus: "Open",
        changedByUserId: session.user.id,
        note: "Complaint logged",
      },
    });

    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    console.error("Create Complaint Error:", error);
    return NextResponse.json({ error: "Failed to create complaint" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const complaints = await prisma.complaint.findMany({
      where: { residentId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(complaints);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch complaints" }, { status: 500 });
  }
}
