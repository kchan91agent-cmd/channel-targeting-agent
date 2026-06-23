import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import JSZip from "jszip";
import { SourceIngestionError, ingestFile, ingestPublicUrl } from "../src/source/ingest.js";

async function temporaryFile(name, content) {
  const directory = await mkdtemp(join(tmpdir(), "channel-targeting-ingestion-test-"));
  const path = join(directory, name);
  await writeFile(path, content);
  return { directory, path };
}

function minimalPdf(text) {
  const content = `BT /F1 12 Tf 72 720 Td (${text}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  ];
  let output = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(output));
    output += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(output);
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  output += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return output;
}

test("ingests plain text and HTML without retaining scripts", async () => {
  const text = await temporaryFile("brief.txt", "Readable campaign source");
  const html = await temporaryFile("brief.html", "<html><title>Launch page</title><body>Readable page<script>private()</script></body></html>");
  try {
    assert.deepEqual(await ingestFile(text.path), { text: "Readable campaign source", sourceType: "file", extension: ".txt" });
    assert.equal((await ingestFile(html.path)).text.includes("private"), false);
  } finally {
    await rm(text.directory, { recursive: true, force: true });
    await rm(html.directory, { recursive: true, force: true });
  }
});

test("ingests minimal DOCX, PPTX, and text-based PDF sources", async () => {
  const directory = await mkdtemp(join(tmpdir(), "channel-targeting-ingestion-test-"));
  try {
    const docx = new JSZip();
    docx.file("[Content_Types].xml", "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/word/document.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml\"/></Types>");
    docx.file("word/document.xml", "<w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\"><w:body><w:p><w:r><w:t>DOCX source evidence</w:t></w:r></w:p></w:body></w:document>");
    await writeFile(join(directory, "brief.docx"), await docx.generateAsync({ type: "nodebuffer" }));

    const pptx = new JSZip();
    pptx.file("ppt/slides/slide1.xml", "<p:sld xmlns:p=\"p\" xmlns:a=\"a\"><p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>Slide source evidence</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>");
    await writeFile(join(directory, "brief.pptx"), await pptx.generateAsync({ type: "nodebuffer" }));
    await writeFile(join(directory, "brief.pdf"), minimalPdf("PDF source evidence"));

    assert.equal((await ingestFile(join(directory, "brief.docx"))).text, "DOCX source evidence");
    assert.equal((await ingestFile(join(directory, "brief.pptx"))).text, "Slide 1\nSlide source evidence");
    assert.ok((await ingestFile(join(directory, "brief.pdf"))).text.includes("PDF source evidence"));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("ingests public HTML while rejecting private document links and unsupported sources", async () => {
  const response = new Response("<html><body>Public source evidence</body></html>", { headers: { "content-type": "text/html" } });
  const result = await ingestPublicUrl("https://example.com/brief", { fetchImpl: async () => response });
  assert.equal(result.text, "Public source evidence");
  await assert.rejects(ingestPublicUrl("https://docs.google.com/document/d/private"), { code: "SOURCE_UNREADABLE" });
  await assert.rejects(ingestPublicUrl("http://example.com/brief"), { code: "UNSUPPORTED_SOURCE" });
  await assert.rejects(ingestFile("/not/a/source.png"), { code: "UNSUPPORTED_SOURCE" });
  assert.ok(SourceIngestionError);
});
