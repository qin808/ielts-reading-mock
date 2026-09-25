import { useState, useCallback, useRef, type DragEvent, type ChangeEvent } from 'react';
import { Upload, FileText, Sparkles, CheckCircle, BookOpen, Clock, Key, Eye, EyeOff, Trash2, Cpu, Globe, FileQuestion } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { AVAILABLE_MODELS, DEFAULT_MODEL, DEFAULT_API_URL } from '@/lib/openAI';
import { parsePdfText, parseImageFile, isImageFile, type OcrProgress } from '@/lib/pdfParser';

interface UploadSectionProps {
  onFileSelected: (file: File, apiKey: string) => void;
  onUseMock: () => void;
  isParsing: boolean;
  onArticleExtracted?: (text: string, fileName: string, apiKey: string) => void;
}

type Mode = 'parse' | 'generate';

const SUPPORTED_TYPES = [
  '判断题 (TRUE/FALSE/NOT GIVEN)',
  '选择题 (单选/多选)',
  '填空题 (摘要填空/句子填空)',
  '匹配题 (段落信息/标题/人名)',
];

export default function UploadSection({ onFileSelected, onUseMock, isParsing, onArticleExtracted }: UploadSectionProps) {
  const [mode, setMode] = useState<Mode>('parse');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState<string>(() => storage.getItem(STORAGE_KEYS.OPENAI_KEY) ?? '');
  const [model, setModel] = useState<string>(() => storage.getItem(STORAGE_KEYS.MODEL) || DEFAULT_MODEL);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(() => storage.getItem(STORAGE_KEYS.API_BASE_URL) || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isDocxFile = (file: File) =>
    file.name.toLowerCase().endsWith('.docx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): boolean => {
    if (isImageFile(file) || file.type === 'application/pdf' || isDocxFile(file)) return true;
    toast.error('请上传 PDF、Word (.docx) 或图片文件');
    return false;
  };

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, []);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) setSelectedFile(file);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const saveSettings = useCallback(() => {
    storage.setItem(STORAGE_KEYS.OPENAI_KEY, apiKey.trim());
    storage.setItem(STORAGE_KEYS.MODEL, model);
    if (apiBaseUrl.trim()) storage.setItem(STORAGE_KEYS.API_BASE_URL, apiBaseUrl.trim());
    else storage.removeItem(STORAGE_KEYS.API_BASE_URL);
  }, [apiKey, model, apiBaseUrl]);

  const extractArticle = useCallback(async () => {
    if (!selectedFile || !onArticleExtracted) return;
    setIsExtracting(true);
    try {
      let text = '';
      if (isDocxFile(selectedFile)) {
        toast.info('正在解析 Word 文档...', { duration: 3000 });
        const mammoth = await import('mammoth');
        const arrayBuffer = await selectedFile.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else if (isImageFile(selectedFile)) {
        toast.info('正在识别图片文字...', { duration: 4000 });
        const result = await parseImageFile(selectedFile, () => {});
        text = result.text;
      } else {
        toast.info('正在解析 PDF 文本...', { duration: 3000 });
        const result = await parsePdfText(selectedFile, () => {});
        text = result.text;
      }
      if (!text || text.trim().length < 100) {
        throw new Error('文章内容提取失败，请确认文件清晰可读');
      }
      toast.success('文章提取成功', { duration: 2000 });
      onArticleExtracted(text, selectedFile.name, apiKey.trim());
    } catch (err) {
      console.error('Extract article failed:', err);
      toast.error('文章提取失败：' + (err instanceof Error ? err.message : '未知错误'), { duration: 5000 });
    } finally {
      setIsExtracting(false);
    }
  }, [selectedFile, apiKey, onArticleExtracted]);

  const handleStart = useCallback(() => {
    if (!selectedFile) { toast.error('请先选择文件'); return; }
    if (!apiKey.trim()) { toast.error('请先设置 OpenAI API Key'); return; }
    saveSettings();
    if (mode === 'parse') {
      onFileSelected(selectedFile, apiKey.trim());
    } else {
      extractArticle();
    }
  }, [selectedFile, apiKey, mode, saveSettings, onFileSelected, extractArticle]);

  const handleClearKey = useCallback(() => {
    setApiKey('');
    storage.removeItem(STORAGE_KEYS.OPENAI_KEY);
    toast.success('API Key 已清除');
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const isBusy = isParsing || isExtracting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <section className="w-full pt-12 pb-8 md:pt-16 md:pb-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI 驱动 · 雅思阅读练习
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
            雅思阅读 <span className="text-primary">模考与出题</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            上传剑雅真题 PDF 一键模考，或上传任意英文文章让 AI 按雅思风格出题
          </p>
        </div>
      </section>

      <section className="w-full pb-10">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            <div className="flex border-b border-border/50 bg-muted/30">
              <button
                onClick={() => setMode('parse')}
                disabled={isBusy}
                className={cn(
                  'flex-1 py-3 px-4 text-sm font-medium transition-colors',
                  mode === 'parse' ? 'bg-card text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <BookOpen className="w-4 h-4 inline mr-2 -mt-0.5" />
                剑雅真题模考
              </button>
              <button
                onClick={() => setMode('generate')}
                disabled={isBusy}
                className={cn(
                  'flex-1 py-3 px-4 text-sm font-medium transition-colors',
                  mode === 'generate' ? 'bg-card text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <FileQuestion className="w-4 h-4 inline mr-2 -mt-0.5" />
                AI 出题练习
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Key className="w-4 h-4 text-primary" />
                  OpenAI API Key
                </label>
                <div className="relative">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="pr-24 h-11"
                    disabled={isBusy}
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowKey((s) => !s)} className="h-8 w-8 p-0">
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={handleClearKey} className="h-8 w-8 p-0 text-destructive" disabled={!apiKey}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">仅保存在本地浏览器中，不会上传到任何服务器。</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Cpu className="w-4 h-4 text-primary" />
                  AI 模型
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={isBusy}
                  className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {AVAILABLE_MODELS.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
                </select>
                <button type="button" onClick={() => setShowAdvanced((s) => !s)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <Globe className="w-3 h-3" />
                  {showAdvanced ? '收起高级设置' : '自定义 API 地址（国内模型/代理）'}
                </button>
                {showAdvanced && (
                  <Input type="text" value={apiBaseUrl} onChange={(e) => setApiBaseUrl(e.target.value)} placeholder={`默认: ${DEFAULT_API_URL}`} className="h-10 text-sm" />
                )}
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  'relative flex flex-col items-center justify-center py-12 px-6 rounded-xl border-2 border-dashed cursor-pointer transition-all',
                  isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border/70 hover:border-primary/60 hover:bg-muted/30',
                  isBusy && 'pointer-events-none opacity-60',
                )}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,.docx,image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {selectedFile ? selectedFile.name : mode === 'parse' ? '上传剑雅阅读真题 PDF' : '上传英文文章（PDF / Word / 图片）'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedFile ? `文件大小: ${formatFileSize(selectedFile.size)}` : '拖拽文件到此处，或点击选择 · 支持 PDF / DOCX / PNG / JPG，扫描件自动 OCR'}
                </p>
                {selectedFile && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-success">
                    <FileText className="w-4 h-4" />
                    <span>文件已就绪</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleStart} disabled={!selectedFile || isBusy || !apiKey.trim()} className="flex-1 h-12 text-base">
                  {isBusy ? (
                    <><span className="animate-spin mr-2">⏳</span>{isExtracting ? '提取文章中...' : '处理中...'}</>
                  ) : mode === 'parse' ? (
                    <><Sparkles className="w-4 h-4 mr-2" />开始 AI 解析</>
                  ) : (
                    <><FileQuestion className="w-4 h-4 mr-2" />提取文章并出题</>
                  )}
                </Button>
                <Button onClick={onUseMock} variant="outline" className="flex-1 h-12 text-base" disabled={isBusy}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  使用示例真题
                </Button>
              </div>
            </div>

            <div className="border-t border-border/50 bg-muted/30 px-8 py-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">支持题型</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {SUPPORTED_TYPES.map((type) => (
                  <div key={type} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border/50">
                    <CheckCircle className="w-4 h-4 text-success shrink-0" />
                    <span className="text-xs text-muted-foreground">{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}