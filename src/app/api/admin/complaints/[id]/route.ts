import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const existing = await prisma.complaint.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Spec Requirement: Once a complaint is marked Resolved, it is closed (cannot be edited)
    if (existing.status === "Resolved") {
      return NextResponse.json({ error: "Complaint is already resolved and closed." }, { status: 400 });
    }

    const updateData: any = {};
    if (data.status) {
      updateData.status = data.status;
      if (data.status === "Resolved") updateData.resolvedAt = new Date();
      if (data.status === "Resolved" || data.status === "Open") updateData.isOverdue = false;
    }
    if (data.priority) updateData.priority = data.priority;

    const complaint = await prisma.complaint.update({
      where: { id: params.id },
      data: updateData,
    });

    // Handle history logging and email notification
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

      // Send email to resident about the status change
      const resident = await prisma.user.findUnique({ where: { id: existing.residentId } });
      if (resident) {
        await sendEmail({
          to: resident.email,
          subject: `Complaint Status Updated: ${existing.category}`,
          body: `
            <h3>Hello ${resident.name},</h3>
            <p>Your complaint regarding <strong>${existing.category}</strong> has been updated to: <strong>${data.status}</strong>.</p>
            <p>Admin Note: ${data.note || 'None provided.'}</p>
          `
        });
      }
    }

    return NextResponse.json(complaint);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update complaint" }, { status: 500 });
  }
}
