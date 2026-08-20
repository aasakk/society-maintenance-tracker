import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const notice = await prisma.notice.create({
      data: {
        title: data.title,
        body: data.body,
        isImportant: data.isImportant || false,
        postedByUserId: session.user.id,
      },
    });

    if (notice.isImportant) {
      // Broadcast email to all residents
      const residents = await prisma.user.findMany({ where: { role: 'resident' } });
      for (const resident of residents) {
        await sendEmail({
          to: resident.email,
          subject: `IMPORTANT NOTICE: ${notice.title}`,
          body: `
            <h3>Hi ${resident.name},</h3>
            <p>An important notice has been posted by the administration:</p>
            <hr />
            <p style="white-space: pre-wrap;">${notice.body}</p>
          `
        });
      }
    }

    return NextResponse.json(notice, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create notice" }, { status: 500 });
  }
}
