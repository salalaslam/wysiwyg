import { saveAs } from "file-saver";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  type IParagraphOptions,
} from "docx";

import { isStandaloneHtmlDocument } from "@/lib/html-templates";

function downloadBlob(blob: Blob, filename: string) {
  saveAs(blob, filename);
}

function sanitizeFilename(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "draftroom-export";
}

function paragraphFromText(text: string, options?: IParagraphOptions) {
  return new Paragraph({
    ...options,
    children: [new TextRun(text || "")],
  });
}

function collectInlineText(node: ChildNode): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent?.replace(/\s+/g, " ") ?? "";
  }

  if (!(node instanceof HTMLElement)) {
    return "";
  }

  return Array.from(node.childNodes)
    .map((child) => collectInlineText(child))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function toAlignment(style: string) {
  if (style.includes("center")) return AlignmentType.CENTER;
  if (style.includes("right")) return AlignmentType.RIGHT;
  return AlignmentType.LEFT;
}

function hasDirectTextContent(element: Element) {
  return Array.from(element.childNodes).some((node) => {
    if (node.nodeType !== Node.TEXT_NODE) {
      return false;
    }

    return (node.textContent ?? "").trim().length > 0;
  });
}

function createParagraphsFromElement(element: Element, inheritedStyle = ""): Paragraph[] {
  const style = `${inheritedStyle} ${element.getAttribute("style") ?? ""}`;
  const alignment = toAlignment(style);
  const text = element.textContent?.replace(/\s+/g, " ").trim() ?? "";

  if (!text && element.children.length === 0) {
    return [];
  }

  switch (element.tagName) {
    case "H1":
      return [
        paragraphFromText(text, {
          heading: HeadingLevel.HEADING_1,
          alignment,
          spacing: { after: 220 },
        }),
      ];
    case "H2":
      return [
        paragraphFromText(text, {
          heading: HeadingLevel.HEADING_2,
          alignment,
          spacing: { before: 220, after: 120 },
        }),
      ];
    case "H3":
      return [
        paragraphFromText(text, {
          heading: HeadingLevel.HEADING_3,
          alignment,
          spacing: { before: 160, after: 100 },
        }),
      ];
    case "P":
      return [
        paragraphFromText(text, {
          alignment,
          spacing: { after: 120 },
        }),
      ];
    case "BLOCKQUOTE":
      return [
        paragraphFromText(text, {
          alignment,
          indent: { left: 420 },
          spacing: { before: 120, after: 120 },
        }),
      ];
    case "UL":
    case "OL":
      return Array.from(element.children)
        .filter((child) => child.tagName === "LI")
        .map((child, index) => {
          const itemText = collectInlineText(child);
          const prefix = element.tagName === "OL" ? `${index + 1}. ` : "• ";

          return paragraphFromText(`${prefix}${itemText}`, {
            alignment,
            indent: { left: 360 },
            spacing: { after: 80 },
          });
        });
    case "BR":
      return [];
    default: {
      if (element.children.length > 0) {
        const nested = Array.from(element.children).flatMap((child) =>
          createParagraphsFromElement(child, style)
        );

        if (nested.length > 0) {
          if (hasDirectTextContent(element) && !["BODY", "HTML"].includes(element.tagName)) {
            return [
              paragraphFromText(text, {
                alignment,
                spacing: { after: 120 },
              }),
              ...nested,
            ];
          }

          return nested;
        }
      }

      return text
        ? [
            paragraphFromText(text, {
              alignment,
              spacing: { after: 120 },
            }),
          ]
        : [];
    }
  }
}

function htmlToParagraphs(html: string) {
  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");
  const bodyChildren = Array.from(document.body.children);

  const paragraphs = bodyChildren.flatMap((element) => createParagraphsFromElement(element));

  return paragraphs.length ? paragraphs : [paragraphFromText("Document export")];
}

export function exportHtmlDocument(html: string, title: string) {
  const filename = `${sanitizeFilename(title)}.html`;

  if (isStandaloneHtmlDocument(html)) {
    downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), filename);
    return;
  }

  const shell = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body {
        background: #f5f0e8;
        color: #17120d;
        font-family: Georgia, "Times New Roman", serif;
        margin: 0;
        padding: 48px 24px;
      }
      main {
        max-width: 860px;
        margin: 0 auto;
        background: white;
        padding: 56px;
        box-shadow: 0 30px 80px rgba(23, 18, 13, 0.12);
      }
      h1 { font-size: 2.4rem; line-height: 1.05; }
      h2 { font-size: 1.4rem; margin-top: 2rem; }
      p, li { font-size: 1rem; line-height: 1.7; }
      blockquote {
        margin-left: 0;
        padding-left: 16px;
        border-left: 3px solid #dd8c5b;
        color: #5d5041;
      }
    </style>
  </head>
  <body>
    <main class="export-surface">${html}</main>
  </body>
</html>`;

  downloadBlob(new Blob([shell], { type: "text/html;charset=utf-8" }), filename);
}

export async function exportDocxDocument(html: string, title: string) {
  const doc = new Document({
    sections: [
      {
        children: htmlToParagraphs(html),
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${sanitizeFilename(title)}.docx`);
}
