import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  ImageRun,
  PageBreak,
  AlignmentType,
  WidthType,
  ExternalHyperlink,
  Footer,
  PageNumber,
} from "docx";
import type { OutputData } from "@editorjs/editorjs";
import { toExportNodes, type ExportListItem, type ExportNode } from "@/lib/export/model";
import { getAsset } from "@/lib/storage/assets";

async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}

type DocxImageType = "png" | "jpg" | "gif" | "bmp" | "svg";

function mimeToDocxImageType(mime: string): DocxImageType | null {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/gif":
      return "gif";
    case "image/bmp":
      return "bmp";
    case "image/svg+xml":
      return "svg";
    default:
      return null;
  }
}

function flattenListItems(items: ExportListItem[], ordered: boolean, depth = 0): Paragraph[] {
  return items.flatMap((item, i) => {
    const prefix = ordered ? `${i + 1}.` : "•";
    const para = new Paragraph({
      text: `${prefix} ${item.text}`,
      indent: { left: depth * 360 },
    });
    return [para, ...flattenListItems(item.items, ordered, depth + 1)];
  });
}

async function nodeToDocxElements(
  node: ExportNode
): Promise<(Paragraph | Table)[]> {
  switch (node.kind) {
    case "heading": {
      const levels = [
        HeadingLevel.HEADING_1,
        HeadingLevel.HEADING_2,
        HeadingLevel.HEADING_3,
        HeadingLevel.HEADING_4,
      ];
      return [new Paragraph({ text: node.text, heading: levels[Math.min(node.level - 1, 3)] })];
    }
    case "paragraph":
      return [new Paragraph({ children: [new TextRun(node.text)] })];
    case "quote":
      return [
        new Paragraph({
          children: [new TextRun({ text: node.text, italics: true })],
          indent: { left: 360 },
        }),
        ...(node.caption
          ? [new Paragraph({ text: `— ${node.caption}`, indent: { left: 360 } })]
          : []),
      ];
    case "list":
      return flattenListItems(node.items, node.ordered);
    case "code":
      return node.code
        .split("\n")
        .map((line) => new Paragraph({ children: [new TextRun({ text: line, font: "Courier New" })] }));
    case "table": {
      if (!node.rows.length) return [];
      const rows = node.rows.map(
        (row, ri) =>
          new TableRow({
            children: row.map(
              (cell) =>
                new TableCell({
                  children: [new Paragraph({ text: cell, heading: ri === 0 ? HeadingLevel.HEADING_4 : undefined })],
                })
            ),
          })
      );
      return [new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } })];
    }
    case "delimiter":
      return [new Paragraph({ text: "* * *", alignment: AlignmentType.CENTER })];
    case "citation":
      return [
        new Paragraph({
          children: [
            new TextRun({ text: node.author, bold: true }),
            new TextRun({ text: ` (${node.year}). ` }),
            new TextRun({ text: node.source, italics: true }),
          ],
        }),
      ];
    case "pagebreak":
      return [new Paragraph({ children: [new PageBreak()] })];
    case "math":
      return [new Paragraph({ children: [new TextRun({ text: node.latex, font: "Cambria Math" })] })];
    case "toc":
      return node.items.map(
        (i) => new Paragraph({ text: i.text, indent: { left: (i.level - 1) * 360 } })
      );
    case "image": {
      if (!node.assetId) return [new Paragraph({ text: node.caption || "[Image]" })];
      const asset = await getAsset(node.assetId);
      if (!asset) return [new Paragraph({ text: node.caption || "[Image unavailable]" })];
      const bytes = await blobToUint8Array(asset.blob);
      const docxType = mimeToDocxImageType(asset.mimeType);
      if (!docxType) {
        return [new Paragraph({ text: node.caption || `[Unsupported image: ${asset.mimeType}]` })];
      }
      const elements: Paragraph[] = [
        new Paragraph({
          children: [
            new ImageRun({
              data: bytes,
              transformation: { width: 400, height: 300 },
              type: docxType,
              altText: {
                title: node.caption || asset.name,
                description: node.caption || asset.name,
                name: asset.name,
              },
            }),
          ],
        }),
      ];
      if (node.caption) {
        elements.push(new Paragraph({ text: node.caption, alignment: AlignmentType.CENTER }));
      }
      return elements;
    }
    case "attachment":
      return [new Paragraph({ text: `📎 ${node.name}` })];
    case "link":
      return [
        new Paragraph({
          children: [
            new ExternalHyperlink({
              link: node.url,
              children: [
                new TextRun({ text: node.label || node.url, style: "Hyperlink" }),
              ],
            }),
          ],
        }),
      ];
    case "diagram":
      return [
        new Paragraph({ children: [new TextRun({ text: "Diagram (Mermaid source)", italics: true })] }),
        ...node.source.split("\n").map(
          (line) => new Paragraph({ children: [new TextRun({ text: line, font: "Courier New" })] })
        ),
      ];
    default:
      return [];
  }
}

export async function toDocx(title: string, data: OutputData): Promise<Blob> {
  const nodes = toExportNodes(data);
  const bodyGroups = await Promise.all(nodes.map(nodeToDocxElements));
  const body = bodyGroups.flat();

  const doc = new Document({
    sections: [
      {
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Page ", size: 18, color: "5A5650" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "5A5650" }),
                  new TextRun({ text: " of ", size: 18, color: "5A5650" }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: "5A5650" }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({ text: title || "Untitled document", heading: HeadingLevel.TITLE }),
          ...body,
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}
