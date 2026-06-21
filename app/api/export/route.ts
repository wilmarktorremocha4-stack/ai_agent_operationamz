import { randomUUID } from 'crypto';
import { put } from '@vercel/blob';
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import ExcelJS from 'exceljs';
import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';
import { NavigatorDocumentPDF } from '@/components/pdf/navigator-document';
import { ChatbotError } from '@/lib/errors';

export const maxDuration = 30;

type ExportRequest = {
  title: string;
  file_type: 'pdf' | 'docx' | 'spreadsheet';
  formatted_content: string;
  summary?: string;
};

async function generatePdf(req: ExportRequest): Promise<Response> {
  const buffer = await renderToBuffer(
    createElement(NavigatorDocumentPDF, {
      title: req.title,
      content: req.formatted_content,
      summary: req.summary,
    })
  );

  const blob = await put(`exports/${randomUUID()}.pdf`, buffer, {
    access: 'public',
    contentType: 'application/pdf',
  });

  return Response.json({ file_url: blob.url });
}

async function generateDocx(req: ExportRequest): Promise<Response> {
  const lines = req.formatted_content.split('\n');
  const paragraphs = lines.map((line) => {
    if (line.startsWith('# ')) {
      return new Paragraph({
        text: line.slice(2),
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.LEFT,
      });
    }
    if (line.startsWith('## ')) {
      return new Paragraph({
        text: line.slice(3),
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.LEFT,
      });
    }
    return new Paragraph({
      children: [new TextRun({ text: line, size: 24 })],
    });
  });

  const doc = new Document({
    title: req.title,
    creator: 'AMZ Navigator',
    sections: [
      {
        children: [
          new Paragraph({
            text: req.title,
            heading: HeadingLevel.TITLE,
          }),
          ...(req.summary
            ? [
                new Paragraph({
                  children: [new TextRun({ text: req.summary, italics: true })],
                }),
              ]
            : []),
          ...paragraphs,
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const blob = await put(`exports/${randomUUID()}.docx`, buffer, {
    access: 'public',
    contentType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  return Response.json({ file_url: blob.url });
}

async function generateXlsx(req: ExportRequest): Promise<Response> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AMZ Navigator';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Data');

  sheet.addRow([req.title]);
  sheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF030A18' },
  };

  const lines = req.formatted_content.split('\n').filter(Boolean);
  for (const line of lines) {
    sheet.addRow([line]);
  }

  sheet.getColumn(1).width = 80;

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  const blob = await put(`exports/${randomUUID()}.xlsx`, buffer, {
    access: 'public',
    contentType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  return Response.json({ file_url: blob.url });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ExportRequest;
    const { title, file_type, formatted_content } = body;

    if (!title || !formatted_content) {
      return new ChatbotError('bad_request:api').toResponse();
    }

    switch (file_type) {
      case 'docx':
        return generateDocx(body);
      case 'spreadsheet':
        return generateXlsx(body);
      default:
        return generatePdf(body);
    }
  } catch (error) {
    console.error('Export error:', error);
    return Response.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    );
  }
}
