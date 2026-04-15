import PDFDocument from "pdfkit";
import { createClerkClient } from "@clerk/backend";
import { requireAuth, unauthorizedResponse } from "@/lib/serverAuth";
import { sql } from "@/lib/db";
import { resend, FROM_ADDRESS } from "@/lib/resend";
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

const MAX_ACTIVITIES = 50;

export async function POST(request: Request) {
  let clerkId: string;
  try {
    clerkId = await requireAuth(request);
  } catch {
    return unauthorizedResponse();
  }

  try {
    // Fetch activities from DB — never trust caller-supplied data
    const rows = await sql`
      SELECT
        a.name,
        INITCAP(a.activity_type) AS category,
        a.hours_per_week,
        a.weeks_per_year,
        a.roles,
        a.description,
        a.grades
      FROM activities a
      WHERE a.clerk_id = ${clerkId}
      ORDER BY a.id ASC
      LIMIT ${MAX_ACTIVITIES}
    `;

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: "No activities found" }), {
        status: 404,
      });
    }

    const activities = rows.map((row: any) => ({
      name: row.name,
      category: row.category,
      hoursPerWeek: row.hours_per_week,
      weeksPerYear: row.weeks_per_year,
      roles: row.roles,
      description: row.description,
      grade: row.grades,
    }));

    // Derive recipient email from Clerk — never trust caller-supplied address
    const clerkUser = await clerkClient.users.getUser(clerkId);
    const recipientEmail = clerkUser.emailAddresses.find(
      (entry) => entry.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress;

    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: "No email on account" }), {
        status: 422,
      });
    }

    // Dynamically load fonts from /public/fonts
    const { origin } = new URL(request.url);
    async function fetchFont(name: string) {
      const response = await fetch(`${origin}/fonts/${name}`);
      if (!response.ok) throw new Error(name);
      return Buffer.from(await response.arrayBuffer());
    }
    const poppinsRegular = await fetchFont("Poppins-Regular.ttf");
    const poppinsBold = await fetchFont("Poppins-Bold.ttf");

    // Initialize PDF document
    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      // @ts-ignore
      font: null,
      autoFirstPage: false,
    });

    doc.registerFont("Poppins-Regular", poppinsRegular);
    doc.registerFont("Poppins-Bold", poppinsBold);

    doc.addPage();
    doc.font("Poppins-Regular");

    // Collect output as buffer
    const buffers: Uint8Array[] = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    const pdfBufferPromise = new Promise<Buffer>((resolve) =>
      doc.on("end", () => resolve(Buffer.concat(buffers))),
    );

    // Header section
    doc.rect(40, doc.y, doc.page.width - 80, 6).fill("#5B55F7");
    doc.moveDown(1);
    doc
      .font("Poppins-Bold")
      .fontSize(24)
      .fillColor("#5B55F7")
      .text("Activities", { align: "left" });
    doc.moveDown(0.5);
    doc
      .moveTo(40, doc.y)
      .lineTo(doc.page.width - 40, doc.y)
      .lineWidth(1)
      .strokeColor("#d3d3d3")
      .stroke();
    doc.moveDown(1);

    // Render each activity
    for (const act of activities) {
      const startY = doc.y;

      doc
        .font("Poppins-Bold")
        .fontSize(14)
        .fillColor("#000")
        .text(act.category || "No Category", 40, startY);
      doc.moveDown(0.5);

      const leftX = 40;
      const leftW = (doc.page.width - 80) * 0.25;
      doc
        .font("Poppins-Regular")
        .fontSize(11)
        .fillColor("#000")
        .text(`Grade: ${act.grade || "N/A"}`, leftX, doc.y, { width: leftW })
        .text(`${act.hoursPerWeek ?? "?"} hr/wk`, { width: leftW })
        .text(`${act.weeksPerYear ?? "?"} wk/yr`, { width: leftW });

      const rightX = leftX + leftW + 36;
      const rightW = (doc.page.width - 80) * 0.75 - 16;
      doc
        .font("Poppins-Bold")
        .fontSize(12)
        .fillColor("#000")
        .text(act.name || "Untitled", rightX, startY, { width: rightW });

      if (act.roles) {
        doc
          .font("Poppins-Regular")
          .fontSize(11)
          .fillColor("#4B5563")
          .text(`Roles: ${act.roles}`, rightX, doc.y, { width: rightW });
      }

      doc
        .font("Poppins-Regular")
        .fontSize(11)
        .fillColor("#000")
        .text(act.description || "No description provided.", rightX, doc.y, {
          width: rightW,
        });

      doc.moveDown(1.5);
      doc
        .moveTo(40, doc.y)
        .lineTo(doc.page.width - 40, doc.y)
        .lineWidth(1)
        .strokeColor("#d3d3d3")
        .stroke();
      doc.moveDown(1);
    }

    // Footer
    doc
      .font("Poppins-Regular")
      .fontSize(10)
      .fillColor("#5B55F7")
      .text("Powered by EC-AI", 0, doc.y, {
        align: "center",
        width: doc.page.width,
      });

    doc.end();
    const pdfBuffer = await pdfBufferPromise;

    // Send email with generated PDF
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: recipientEmail,
      replyTo: "ask.ecai@gmail.com",
      subject: "Your EC‑AI Activities PDF",
      text: "Hi there,\n\nWe've attached your activities PDF to this email.\n\nThanks for being a part of EC-AI!\n– The EC-AI Team",
      attachments: [
        {
          filename: "activities.pdf",
          content: pdfBuffer.toString("base64"),
        },
      ],
    });

    return new Response(JSON.stringify({ sent: true }), { status: 200 });
  } catch (error) {
    console.error("PDF/email error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
