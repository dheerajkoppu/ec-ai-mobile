// File: pages/api/activities-email.ts

import { neon } from "@neondatabase/serverless";
import PDFDocument from "pdfkit";
import { Resend } from "resend";
import fs from "fs";
import path from "path";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" && body.email.trim() !== ""
        ? body.email
        : undefined;
    if (!email) {
      return new Response(JSON.stringify({ error: "Missing user email" }), {
        status: 400,
      });
    }

    const sql = neon(`${process.env.DATABASE_URL}`);
    const activities = (await sql`
      SELECT
        a.id,
        a.name,
        INITCAP(a.activity_type) AS category,
        a.hours_per_week,
        a.weeks_per_year,
        a.roles,
        a.description,
        a.grades
      FROM activities a
             JOIN users u ON a.user_id = u.id
      WHERE u.email = ${email}
      ORDER BY a.id ASC;
    `) as {
      id: number;
      name: string;
      category: string;
      hours_per_week: number;
      weeks_per_year: number;
      roles: string | null;
      description: string;
      grades: string;
    }[];

    if (activities.length === 0) {
      return new Response(
        JSON.stringify({ error: "No activities found for that user." }),
        { status: 404 },
      );
    }

    let totalHoursPerWeek = 0;
    const formatted = activities.map((a) => {
      totalHoursPerWeek += a.hours_per_week;
      return {
        id: a.id,
        name: a.name,
        category: a.category,
        hours: a.hours_per_week * a.weeks_per_year,
        hoursPerWeek: a.hours_per_week,
        weeksPerYear: a.weeks_per_year,
        roles: a.roles,
        description: a.description,
        grade: a.grades,
      };
    });

    const fontsFolder = path.join(process.cwd(), "assets", "fonts");
    const poppinsRegular = path.join(fontsFolder, "Poppins-Regular.ttf");
    const poppinsBold = path.join(fontsFolder, "Poppins-Bold.ttf");

    if (!fs.existsSync(poppinsRegular) || !fs.existsSync(poppinsBold)) {
      throw new Error(`Poppins TTF files not found in ${fontsFolder}`);
    }

    // @ts-ignore
    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      font: null,
      autoFirstPage: false,
    });

    doc.registerFont("Poppins-Regular", poppinsRegular);
    doc.registerFont("Poppins-Bold", poppinsBold);
    doc.addPage();
    doc.font("Poppins-Regular");

    const buffers: Buffer[] = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    const pdfGenerationComplete = new Promise<Buffer>((resolve) => {
      doc.on("end", () => {
        resolve(Buffer.concat(buffers));
      });
    });

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

    // Render each activity with category on top left
    for (const act of formatted) {
      const startY = doc.y;

      doc
        .font("Poppins-Bold")
        .fontSize(14)
        .fillColor("#000000")
        .text(act.category, 40, startY);
      doc.moveDown(0.5);

      const contentStartY = doc.y;

      const leftX = 40;
      const leftW = (doc.page.width - 80) * 0.25;
      doc
        .font("Poppins-Regular")
        .fontSize(11)
        .fillColor("#000000")
        .text(act.grade, leftX, contentStartY, { width: leftW });
      doc.text(`${act.hoursPerWeek} hr/wk`, leftX, doc.y, { width: leftW });
      doc.text(`${act.weeksPerYear} wk/yr`, leftX, doc.y, { width: leftW });

      const rightX = leftX + leftW + 16;
      const rightW = (doc.page.width - 80) * 0.75 - 16;

      doc
        .font("Poppins-Bold")
        .fontSize(12)
        .fillColor("#000")
        .text(act.name, rightX, contentStartY, { width: rightW });

      doc.font("Poppins-Regular").fontSize(11).fillColor("#4B5563");
      if (act.roles) {
        doc.text(`Roles: ${act.roles}`, rightX, doc.y, { width: rightW });
      }
      doc.font("Poppins-Regular").fontSize(11).fillColor("#000000");

      doc.text(act.description, rightX, doc.y, { width: rightW });

      doc.moveDown(1.5);

      doc
        .moveTo(40, doc.y)
        .lineTo(doc.page.width - 40, doc.y)
        .lineWidth(1)
        .strokeColor("#d3d3d3")
        .stroke();
      doc.moveDown(1);
    }
    doc
      .font("Poppins-Regular")
      .fontSize(10)
      .fillColor("#5B55F7")
      .text("Powered by EC-AI", 0, doc.page.height - 50, {
        align: "center",
        width: doc.page.width,
      });
    doc.end();

    const pdfBuffer = await pdfGenerationComplete;

    const pdfBase64 = pdfBuffer.toString("base64");

    await resend.emails.send({
      from: "EC-AI <onboarding@resend.dev>",
      to: "ask.ecai@gmail.com",
      subject: "Your EC-AI Activities PDF",
      text: "Hello,\n\nAttached is your EC-AI Activities PDF, formatted in the same concise, structured style used by college application platforms.\n\nBest regards, \nEC-AI",
      attachments: [
        {
          filename: "ec-ai_activities.pdf",
          content: pdfBase64,
        },
      ],
    });

    return new Response(
      JSON.stringify({
        message: "PDF generated and emailed successfully.",
        totalHoursPerWeek,
      }),
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error generating/emailing activities PDF:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Server error." }),
      { status: 500 },
    );
  }
}
