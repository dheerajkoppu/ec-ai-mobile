import PDFDocument from "pdfkit";

export async function POST(request: Request) {
  const { email, activities } = await request.json();

  if (!email || !activities || !Array.isArray(activities)) {
    return new Response(
      JSON.stringify({ error: "Missing email or activities" }),
      { status: 400 },
    );
  }

  if (activities.length === 0) {
    return new Response(JSON.stringify({ error: "No activities provided" }), {
      status: 404,
    });
  }

  // Dynamically load fonts from /public/fonts
  const { origin } = new URL(request.url);
  async function fetchFont(name: string) {
    const res = await fetch(`${origin}/fonts/${name}`);
    if (!res.ok) throw new Error(name);
    return Buffer.from(await res.arrayBuffer());
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

  // Return Base64-encoded PDF
  return new Response(
    JSON.stringify({
      pdfBase64: pdfBuffer.toString("base64"),
    }),
    { status: 200 },
  );
}
