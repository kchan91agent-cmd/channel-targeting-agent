import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import mammoth from "mammoth";
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import { parseHTML } from "linkedom";

const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const PRIVATE_DOCUMENT_HOSTS = new Set(["docs.google.com", "drive.google.com"]);
const READABLE_EXTENSIONS = new Set([".txt", ".md", ".markdown", ".html", ".htm", ".docx", ".pptx", ".pdf"]);
let pdfjsPromise;

async function withoutPdfjsOptionalWarnings(work) {
  const originalWarn = console.warn;
  console.warn = (...values) => {
    const message = values.map(String).join(" ");
    if (message.includes("Cannot load \"@napi-rs/canvas\"") || message.includes("standardFontDataUrl")) return;
    originalWarn(...values);
  };
  try {
    return await work();
  } finally {
    console.warn = originalWarn;
  }
}

export class SourceIngestionError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function normalizedText(value) {
  return String(value ?? "").replace(/\r\n?/g, "\n").replace(/[\t ]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function requireText(text) {
  const normalized = normalizedText(text);
  if (!normalized) throw new SourceIngestionError("SOURCE_UNREADABLE", "Source did not contain readable text.");
  return normalized;
}

function assertSize(buffer) {
  if (buffer.byteLength > MAX_SOURCE_BYTES) throw new SourceIngestionError("SOURCE_TOO_LARGE", "Source exceeds the 15 MB ingestion limit.");
}

function extensionFor({ filePath, contentType = "" }) {
  const fromPath = filePath ? extname(filePath.split("?")[0]).toLowerCase() : "";
  if (READABLE_EXTENSIONS.has(fromPath)) return fromPath;
  const mediaType = contentType.split(";", 1)[0].trim().toLowerCase();
  return new Map([
    ["text/plain", ".txt"], ["text/markdown", ".md"], ["text/html", ".html"],
    ["application/pdf", ".pdf"],
    ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"],
    ["application/vnd.openxmlformats-officedocument.presentationml.presentation", ".pptx"]
  ]).get(mediaType) ?? "";
}

function textFromHtml(html) {
  const { document } = parseHTML(html);
  for (const element of document.querySelectorAll("script, style, noscript, svg, iframe, form, nav")) element.remove();
  const title = document.querySelector("title")?.textContent?.trim();
  const body = document.body?.textContent;
  return requireText([title, body].filter(Boolean).join("\n\n"));
}

function valueText(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(valueText).join("");
  if (value && typeof value === "object") return Object.values(value).map(valueText).join("");
  return "";
}

function slideNumber(name) {
  return Number(name.match(/slide(\d+)\.xml$/)?.[1] ?? Number.MAX_SAFE_INTEGER);
}

function slideText(xml) {
  const parser = new XMLParser({ ignoreAttributes: false, textNodeName: "#text", trimValues: false });
  const document = parser.parse(xml);
  const values = [];
  function visit(value, key = "") {
    if (key === "a:t") values.push(valueText(value));
    if (Array.isArray(value)) value.forEach((item) => visit(item, key));
    else if (value && typeof value === "object") Object.entries(value).forEach(([childKey, childValue]) => visit(childValue, childKey));
  }
  visit(document);
  return normalizedText(values.join(" "));
}

async function textFromPptx(buffer) {
  const archive = await JSZip.loadAsync(buffer);
  const slides = Object.keys(archive.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((left, right) => slideNumber(left) - slideNumber(right));
  if (slides.length === 0) throw new SourceIngestionError("SOURCE_UNREADABLE", "Presentation did not contain readable slide text.");
  const sections = await Promise.all(slides.map(async (name, index) => {
    const text = slideText(await archive.file(name).async("string"));
    return text ? `Slide ${index + 1}\n${text}` : "";
  }));
  return requireText(sections.filter(Boolean).join("\n\n"));
}

async function textFromDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return requireText(result.value);
}

async function textFromPdf(buffer) {
  try {
    return await withoutPdfjsOptionalWarnings(async () => {
      if (!globalThis.DOMMatrix) {
        globalThis.DOMMatrix = class DOMMatrix {
          constructor() { Object.assign(this, { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }); }
        };
      }
      if (!globalThis.ImageData) globalThis.ImageData = class ImageData {};
      if (!globalThis.Path2D) globalThis.Path2D = class Path2D {};
      pdfjsPromise ??= import("pdfjs-dist/legacy/build/pdf.mjs");
      const pdfjs = await pdfjsPromise;
      const task = pdfjs.getDocument({ data: new Uint8Array(buffer) });
      const document = await task.promise;
      const pages = [];
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        pages.push(content.items.map((item) => item.str).join(" "));
      }
      await document.destroy();
      return requireText(pages.join("\n\n"));
    });
  } catch (error) {
    throw new SourceIngestionError("SOURCE_UNREADABLE", "PDF could not be converted to readable text.");
  }
}

async function ingestBuffer(buffer, { extension, sourceType }) {
  assertSize(buffer);
  let text;
  if ([".txt", ".md", ".markdown"].includes(extension)) text = requireText(buffer.toString("utf8"));
  else if ([".html", ".htm"].includes(extension)) text = textFromHtml(buffer.toString("utf8"));
  else if (extension === ".docx") text = await textFromDocx(buffer);
  else if (extension === ".pptx") text = await textFromPptx(buffer);
  else if (extension === ".pdf") text = await textFromPdf(buffer);
  else throw new SourceIngestionError("UNSUPPORTED_SOURCE", "Supported sources are text, HTML, DOCX, PPTX, and text-based PDF.");
  return { text, sourceType, extension };
}

export async function ingestFile(filePath) {
  const extension = extensionFor({ filePath });
  if (!extension) throw new SourceIngestionError("UNSUPPORTED_SOURCE", "Unsupported source file type.");
  let buffer;
  try {
    buffer = await readFile(filePath);
  } catch {
    throw new SourceIngestionError("SOURCE_UNREADABLE", "Source file could not be read.");
  }
  return ingestBuffer(buffer, { extension, sourceType: "file" });
}

export async function ingestPublicUrl(url, { fetchImpl = fetch } = {}) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new SourceIngestionError("UNSUPPORTED_SOURCE", "Source URL is invalid.");
  }
  if (parsed.protocol !== "https:") throw new SourceIngestionError("UNSUPPORTED_SOURCE", "Only public HTTPS URLs are supported.");
  if (PRIVATE_DOCUMENT_HOSTS.has(parsed.hostname)) {
    throw new SourceIngestionError("SOURCE_UNREADABLE", "Private document links must be exported or attached as a readable file.");
  }
  let response;
  try {
    response = await fetchImpl(parsed, { redirect: "follow", signal: AbortSignal.timeout(15000) });
  } catch {
    throw new SourceIngestionError("SOURCE_UNREADABLE", "Public source URL could not be fetched.");
  }
  if (!response.ok) throw new SourceIngestionError("SOURCE_UNREADABLE", "Public source URL returned an unreadable response.");
  const declaredSize = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredSize) && declaredSize > MAX_SOURCE_BYTES) throw new SourceIngestionError("SOURCE_TOO_LARGE", "Public source exceeds the 15 MB ingestion limit.");
  const buffer = Buffer.from(await response.arrayBuffer());
  const extension = extensionFor({ filePath: response.url ?? parsed.pathname, contentType: response.headers.get("content-type") ?? "" });
  if (!extension) throw new SourceIngestionError("UNSUPPORTED_SOURCE", "Public URL content type is not supported.");
  return ingestBuffer(buffer, { extension, sourceType: "url" });
}

export async function ingestSource({ filePath, url, fetchImpl } = {}) {
  if (Boolean(filePath) === Boolean(url)) throw new SourceIngestionError("USAGE", "Provide exactly one source file or public URL.");
  return filePath ? ingestFile(filePath) : ingestPublicUrl(url, { fetchImpl });
}
