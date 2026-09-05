import { useState, useCallback, useRef, type DragEvent, type ChangeEvent } from 'react';
import { Upload, FileText, Sparkles, CheckCircle, BookOpen, Clock, Key, Eye, EyeOff, Trash2, Cpu, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { AVAILABLE_MODELS, DEFAULT_MODEL, DEFAULT_API_URL } from '@/lib/openAI';

interface UploadSectionProps {
  onFileSelected: (file: File, apiKey: string) => void;
  onUseMock: () => void;
  isParsing: boolean;
}

const SUPPORTED_TYPES = [
  '判断题 (TRUE/FALSE/NOT GIVEN)',
  '选择题 (单选/多选)',
  '填空题 (摘要填空/句子填空)',
  '匹配题 (段落信息/标题/人名)',
];

const STEPS = [
  { icon: Upload, title: '上传真题 PDF', desc: '选择剑雅阅读真题 PDF 文件' },
  { icon: Sparkles, title: 'AI 智能解析', desc: '自动提取文章与题目' },
  { icon: BookOpen, title: '开始模考', desc: '60 分钟限时作答，自动判分' },
];

export default function UploadSection({ onFileSelected, onUseMock, isParsing }: UploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState<string>(() => storage.getItem(STORAGE_KEYS.OPENAI_KEY) ?? '');
  const [model, setModel] = useState<string>(() => storage.getItem(STORAGE_KEYS.MODEL) || DEFAULT_MODEL);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(() => storage.getItem(STORAGE_KEYS.API_BASE_URL) || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
        toast.error('请上传 PDF 或图片文件');
        return;
      }
      setSelectedFile(file);
      // 重置 input value，确保下次选择同一文件也能触发 onChange
      if (inputRef.current) inputRef.current.value = '';
    }
  }, []);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
        toast.error('请上传 PDF 或图片文件');
        return;
      }
      setSelectedFile(file);
    }
    // 重置 input value，确保下次选择同一文件也能触发 onChange
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const handleStart = useCallback(() => {
    if (!selectedFile) {
      toast.error('请先选择 PDF 文件');
      return;
    }
    if (!apiKey.trim()) {
      toast.error('请先设置 OpenAI API Key');
      return;
    }
    // 保存配置
    storage.setItem(STORAGE_KEYS.OPENAI_KEY, apiKey.trim());
    storage.setItem(STORAGE_KEYS.MODEL, model);
    if (apiBaseUrl.trim()) {
      storage.setItem(STORAGE_KEYS.API_BASE_URL, apiBaseUrl.trim());
    } else {
      storage.removeItem(STORAGE_KEYS.API_BASE_URL);
    }
    onFileSelected(selectedFile, apiKey.trim());
  }, [selectedFile, apiKey, onFileSelected]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Hero 区 */}
      <section className="w-full pt-16 pb-12 md:pt-24 md:pb-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                AI 驱动 · 剑雅真题一键模考
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                雅思阅读
                <span className="text-primary"> 模考系统</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                上传剑桥雅思阅读真题 PDF，AI 自动解析文章与题目，
                <br className="hidden md:block" />
                还原真实考试界面，60 分钟限时作答，自动判分复盘。
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>支持 8 大题型</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>60 分钟倒计时</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>自动判分复盘</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-xl border border-border/50 aspect-[4/3] bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/20">
                {/* 装饰图案：抽象书页 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-4/5 h-3/4">
                    {/* 左页 */}
                    <div className="absolute left-0 top-0 w-[48%] h-full bg-card rounded-l-lg shadow-lg border border-border/60 p-4 transform -rotate-2 origin-bottom-right">
                      <div className="space-y-2">
                        <div className="h-3 w-2/3 bg-primary/20 rounded" />
                        <div className="h-2 w-full bg-muted-foreground/15 rounded" />
                        <div className="h-2 w-5/6 bg-muted-foreground/15 rounded" />
                        <div className="h-2 w-4/5 bg-muted-foreground/15 rounded" />
                        <div className="h-2 w-full bg-muted-foreground/15 rounded" />
                        <div className="h-2 w-3/4 bg-muted-foreground/15 rounded" />
                        <div className="h-2 w-5/6 bg-muted-foreground/15 rounded mt-4" />
                        <div className="h-2 w-2/3 bg-muted-foreground/15 rounded" />
                      </div>
                    </div>
                    {/* 右页 */}
                    <div className="absolute right-0 top-0 w-[48%] h-full bg-card rounded-r-lg shadow-lg border border-border/60 p-4 transform rotate-2 origin-bottom-left">
                      <div className="space-y-2">
                        <div className="h-3 w-1/2 bg-primary/20 rounded" />
                        <div className="flex gap-2 items-center">
                          <div className="w-4 h-4 rounded-full border-2 border-primary/50" />
                          <div className="h-2 flex-1 bg-muted-foreground/15 rounded" />
                        </div>
                        <div className="flex gap-2 items-center">
                          <div className="w-4 h-4 rounded-full bg-primary/30" />
                          <div className="h-2 flex-1 bg-muted-foreground/15 rounded" />
                        </div>
                        <div className="flex gap-2 items-center">
                          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                          <div className="h-2 flex-1 bg-muted-foreground/15 rounded" />
                        </div>
                        <div className="h-2 w-full bg-muted-foreground/15 rounded mt-3" />
                        <div className="h-2 w-3/4 bg-muted-foreground/15 rounded" />
                      </div>
                    </div>
                    {/* 书脊 */}
                    <div className="absolute left-1/2 top-2 bottom-2 w-0.5 -translate-x-1/2 bg-border/80" />
                  </div>
                </div>
                {/* 柔光渐变 */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-6 right-6 w-24 h-24 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute bottom-8 left-8 w-32 h-32 rounded-full bg-secondary/20 blur-3xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 使用步骤 */}
      <section className="w-full py-12">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="flex gap-4 p-6 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm"
              >
                <div className="shrink-0 w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <step.icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Step {i + 1}</div>
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 上传区 */}
      <section className="w-full pb-10">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            <div className="p-8 space-y-6">
              {/* API Key 设置 */}
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
                    disabled={isParsing}
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowKey((s) => !s)}
                      className="h-8 w-8 p-0"
                      aria-label={showKey ? '隐藏 Key' : '显示 Key'}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearKey}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      aria-label="清除 Key"
                      disabled={!apiKey}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  仅保存在本地浏览器中，不会上传到任何服务器。
                </p>
              </div>

              {/* 模型选择 */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Cpu className="w-4 h-4 text-primary" />
                  AI 模型
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={isParsing}
                  className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50"
                >
                  {AVAILABLE_MODELS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAdvanced((s) => !s)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Globe className="w-3 h-3" />
                  {showAdvanced ? '收起高级设置' : '自定义 API 地址（国内模型/代理）'}
                </button>
                {showAdvanced && (
                  <div className="pt-1">
                    <Input
                      type="text"
                      value={apiBaseUrl}
                      onChange={(e) => setApiBaseUrl(e.target.value)}
                      placeholder={`默认: ${DEFAULT_API_URL}`}
                      className="h-10 text-sm"
                      disabled={isParsing}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      使用 DeepSeek、通义千问等国内模型时，填写其兼容 OpenAI 格式的 API 地址，如 https://api.deepseek.com/v1/chat/completions
                    </p>
                  </div>
                )}
              </div>

              {/* 拖拽上传区 */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  'relative flex flex-col items-center justify-center py-12 px-6 rounded-xl border-2 border-dashed cursor-pointer transition-all',
                  isDragging
                    ? 'border-primary bg-primary/5 scale-[1.01]'
                    : 'border-border/70 hover:border-primary/60 hover:bg-muted/30',
                  isParsing && 'pointer-events-none opacity-60',
                )}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {selectedFile ? selectedFile.name : '上传剑雅阅读真题 PDF 或图片'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedFile
                    ? `文件大小: ${formatFileSize(selectedFile.size)}`
                    : '拖拽文件到此处，或点击选择文件 · 支持 PDF / PNG / JPG，扫描件自动 OCR'}
                </p>
                {selectedFile && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-success">
                    <FileText className="w-4 h-4" />
                    <span>文件已就绪，点击下方开始解析</span>
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleStart}
                  disabled={!selectedFile || isParsing || !apiKey.trim()}
                  className="flex-1 h-12 text-base"
                >
                  {isParsing ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      解析中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      开始 AI 解析
                    </>
                  )}
                </Button>
                <Button
                  onClick={onUseMock}
                  variant="outline"
                  className="flex-1 h-12 text-base"
                  disabled={isParsing}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  使用示例真题体验
                </Button>
              </div>
            </div>

            {/* 支持题型 */}
            <div className="border-t border-border/50 bg-muted/30 px-8 py-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">支持雅思阅读题型</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SUPPORTED_TYPES.map((type) => (
                  <div
                    key={type}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border/50"
                  >
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
