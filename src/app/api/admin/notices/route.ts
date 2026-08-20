import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

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
      // TODO: Send broadcast email to all residents
    }

    return NextResponse.json(notice, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create notice" }, { status: 500 });
  }
}
