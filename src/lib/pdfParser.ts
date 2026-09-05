import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import Tesseract from 'tesseract.js';

// 配置 pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export interface PdfParseResult {
  text: string;
  numPages: number;
  usedOcr: boolean;
}

export interface OcrProgress {
  phase: string;
  progress: number;
  currentPage: number;
  totalPages: number;
}

// 文本长度低于此值判定为扫描件
const SCANNED_THRESHOLD = 100;
// OCR 渲染缩放比例（平衡准确率和速度）
const OCR_SCALE = 1.8;
// OCR 最大页数（避免太慢）
const MAX_OCR_PAGES = 15;

/**
 * 清理 PDF 提取的文本，过滤页码、页眉页脚、角标等无关内容
 */
function cleanExtractedText(text: string): string {
  const lines = text.split('\n');
  const cleaned: string[] = [];

  // 统计每行出现次数（页眉页脚会重复出现）
  const lineCount = new Map<string, number>();
  lines.forEach((l) => {
    const trimmed = l.trim();
    if (trimmed) {
      lineCount.set(trimmed, (lineCount.get(trimmed) || 0) + 1);
    }
  });

  // 常见页眉页脚关键词
  const headerFooterPatterns = [
    /^test\s*\d+$/i,
    /^cambridge\s+ielts/i,
    /^reading\s+passage\s*\d+$/i,
    /^questions\s+\d+[-–]\d+$/i,
    /^you\s+should\s+spend\s+about\s+\d+\s+minutes/i,
    /^\d+\s*\/\s*\d+$/, // 页码格式 1/4
    /^page\s+\d+/i,
    /^©\s*cambridge/i,
    /^photocopiable/i,
  ];

  lines.forEach((line) => {
    const trimmed = line.trim();

    // 空行保留（用于段落分隔）
    if (!trimmed) {
      cleaned.push(line);
      return;
    }

    // 过滤纯数字行（页码）
    if (/^\d+$/.test(trimmed) && trimmed.length <= 3) {
      return;
    }

    // 过滤匹配页眉页脚模式的行
    if (headerFooterPatterns.some((p) => p.test(trimmed))) {
      return;
    }

    // 过滤重复出现 3 次以上的短行（很可能是页眉页脚）
    const count = lineCount.get(trimmed) || 0;
    if (count >= 3 && trimmed.length < 50) {
      return;
    }

    // 过滤只有 1-2 个字符且不是常见标点的行（角标）
    if (trimmed.length <= 2 && !/^[.,;:!?'"()]$/.test(trimmed)) {
      return;
    }

    cleaned.push(line);
  });

  // 合并多余的空行
  return cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * 对图片进行 OCR 识别
 */
export async function ocrImage(
  imageSource: string | HTMLCanvasElement | File,
  onProgress?: (progress: OcrProgress) => void,
): Promise<string> {
  onProgress?.({ phase: 'loading_language', progress: 0, currentPage: 0, totalPages: 1 });

  const result = await Tesseract.recognize(imageSource, 'chi_sim+eng', {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress?.({
          phase: 'recognizing',
          progress: Math.round(m.progress * 100),
          currentPage: 1,
          totalPages: 1,
        });
      }
    },
  });

  onProgress?.({ phase: 'done', progress: 100, currentPage: 1, totalPages: 1 });
  return result.data.text;
}

/**
 * 将 PDF 页面渲染为 canvas
 */
async function renderPageToCanvas(
  page: pdfjsLib.PDFPageProxy,
  scale: number = OCR_SCALE,
): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return canvas;
}

/**
 * 对扫描件 PDF 逐页 OCR
 */
export async function ocrScannedPdf(
  pdf: pdfjsLib.PDFDocumentProxy,
  onProgress?: (progress: OcrProgress) => void,
): Promise<string> {
  const numPages = Math.min(pdf.numPages, MAX_OCR_PAGES);
  const pageTexts: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    onProgress?.({ phase: 'rendering', progress: Math.round((i / numPages) * 100), currentPage: i, totalPages: numPages });

    const page = await pdf.getPage(i);
    const canvas = await renderPageToCanvas(page);

    onProgress?.({ phase: 'recognizing', progress: Math.round((i / numPages) * 100), currentPage: i, totalPages: numPages });

    const result = await Tesseract.recognize(canvas, 'chi_sim+eng');
    pageTexts.push(result.data.text);

    // 清理 canvas 释放内存
    canvas.width = 0;
    canvas.height = 0;
  }

  return pageTexts.join('\n\n');
}

/**
 * 解析 PDF 文件，自动判断是否为扫描件并 OCR
 */
export async function parsePdfText(
  file: File,
  onProgress?: (progress: OcrProgress) => void,
): Promise<PdfParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;

  // 第一步：尝试提取文本
  onProgress?.({ phase: 'extracting_text', progress: 0, currentPage: 0, totalPages: numPages });
  const pageTexts: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items = content.items as { str: string; transform: number[] }[];
    const lines: { y: number; text: string }[] = [];

    items.forEach((item) => {
      if (!item.str || !item.str.trim()) return;
      const y = Math.round(item.transform[5]);
      const existingLine = lines.find((l) => Math.abs(l.y - y) < 3);
      if (existingLine) {
        existingLine.text += item.str;
      } else {
        lines.push({ y, text: item.str });
      }
    });

    lines.sort((a, b) => b.y - a.y);
    pageTexts.push(lines.map((l) => l.text).join('\n'));
  }

  const text = cleanExtractedText(pageTexts.join('\n\n'));

  // 判断是否为扫描件
  if (text.trim().length < SCANNED_THRESHOLD) {
    onProgress?.({ phase: 'scanned_detected', progress: 0, currentPage: 0, totalPages: numPages });
    const ocrText = cleanExtractedText(await ocrScannedPdf(pdf, onProgress));
    return { text: ocrText, numPages, usedOcr: true };
  }

  return { text, numPages, usedOcr: false };
}

/**
 * 解析图片文件（PNG/JPG），直接 OCR
 */
export async function parseImageFile(
  file: File,
  onProgress?: (progress: OcrProgress) => void,
): Promise<PdfParseResult> {
  const text = await ocrImage(file, onProgress);
  return { text, numPages: 1, usedOcr: true };
}

/**
 * 判断文件是否为图片
 */
export function isImageFile(file: File): boolean {
  return file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/webp';
}
