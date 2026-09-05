import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// 配置 worker
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export interface PdfParseResult {
  text: string;
  numPages: number;
}

/**
 * 解析 PDF 文件，提取全部页面的纯文本内容
 */
export async function parsePdfText(file: File): Promise<PdfParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  const pageTexts: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // 按 y 坐标排序行，保持阅读顺序
    const items = content.items as { str: string; transform: number[] }[];
    const lines: { y: number; text: string }[] = [];

    items.forEach((item) => {
      if (!item.str || !item.str.trim()) return;
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      const existingLine = lines.find((l) => Math.abs(l.y - y) < 3);
      if (existingLine) {
        // 同一行，追加文本
        existingLine.text += item.str;
      } else {
        lines.push({ y, text: item.str });
      }
      void x;
    });

    // 按 y 降序（从上到下）
    lines.sort((a, b) => b.y - a.y);
    const pageText = lines.map((l) => l.text).join('\n');
    pageTexts.push(pageText);
  }

  return {
    text: pageTexts.join('\n\n'),
    numPages,
  };
}
