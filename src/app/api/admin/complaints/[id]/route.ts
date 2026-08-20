import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const existing = await prisma.complaint.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updateData: any = {};
    if (data.status) {
      updateData.status = data.status;
      if (data.status === "Resolved") updateData.resolvedAt = new Date();
      if (data.status === "Resolved" || data.status === "Open") updateData.isOverdue = false; // logic simplified for now
    }
    if (data.priority) updateData.priority = data.priority;

    const complaint = await prisma.complaint.update({
      where: { id: params.id },
      data: updateData,
    });

    if (data.status && data.status !== existing.status) {
      await prisma.complaintStatusHistory.create({
        data: {
          complaintId: complaint.id,
          oldStatus: existing.status,
          newStatus: data.status,
          changedByUserId: session.user.id,
          note: data.note || `Status changed to ${data.status}`,
        },
      });
      // TODO: Send email notification here
    }

    return NextResponse.json(complaint);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update complaint" }, { status: 500 });
  }
}
