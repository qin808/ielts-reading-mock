import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import UploadSection from '@/components/UploadSection';
import ExamHeader from '@/components/ExamHeader';
import PassageReader from '@/components/PassageReader';
import QuestionPanel from '@/components/QuestionPanel';
import QuestionNav from '@/components/QuestionNav';
import ResultPanel from '@/components/ResultPanel';
import { MOCK_READING_TEST, type IReadingTest } from '@/data/mockReading';
import { parsePdfText } from '@/lib/pdfParser';
import { structureReadingText } from '@/lib/openAI';
import { storage, STORAGE_KEYS } from '@/lib/storage';

type ExamPhase = 'upload' | 'parsing' | 'exam' | 'result';

interface PersistedState {
  test: IReadingTest;
  answers: Record<string, string | string[]>;
  timeLeft: number;
  phase: ExamPhase;
  duration: number;
}

export default function IeltsReadingPage() {
  const [phase, setPhase] = useState<ExamPhase>('upload');
  const [test, setTest] = useState<IReadingTest | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [timeLeft, setTimeLeft] = useState(3600);
  const [isPaused, setIsPaused] = useState(false);
  const [currentNumber, setCurrentNumber] = useState(1);
  const [currentPassage, setCurrentPassage] = useState<1 | 2 | 3>(1);
  const [isParsing, setIsParsing] = useState(false);
  const [parseStep, setParseStep] = useState(0);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [duration, setDuration] = useState(0);
  const [splitRatio, setSplitRatio] = useState(50); // 左栏百分比
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const questionPanelRef = useRef<HTMLDivElement>(null);

  // 恢复本地保存的考试状态
  useEffect(() => {
    try {
      const saved = storage.getItem(STORAGE_KEYS.STATE);
      if (saved) {
        const data: PersistedState = JSON.parse(saved);
        if (data.test && (data.phase === 'exam' || data.phase === 'result')) {
          setTest(data.test);
          setAnswers(data.answers || {});
          setTimeLeft(data.timeLeft ?? 3600);
          setDuration(data.duration ?? 0);
          if (data.phase === 'result') {
            setPhase('result');
          } else {
            setPhase('exam');
          }
        }
      }
    } catch (e) {
      console.error('Failed to restore state:', e);
    }
  }, []);

  // 保存状态到 localStorage
  useEffect(() => {
    if (phase === 'exam' && test) {
      try {
        const data: PersistedState = {
          test,
          answers,
          timeLeft,
          phase,
          duration: 3600 - timeLeft,
        };
        storage.setItem(STORAGE_KEYS.STATE, JSON.stringify(data));
      } catch (e) {
        console.error('Failed to save state:', e);
      }
    }
  }, [phase, test, answers, timeLeft]);

  // 倒计时
  useEffect(() => {
    if (phase !== 'exam' || isPaused) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // 时间到自动交卷
          window.clearInterval(timerRef.current!);
          timerRef.current = null;
          toast.warning('时间到！已自动交卷');
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isPaused]);

  // 拖拽分隔条
  useEffect(() => {
    if (!isDraggingSplit) return;
    const handleMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const ratio = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitRatio(Math.max(25, Math.min(75, ratio)));
    };
    const handleUp = () => setIsDraggingSplit(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDraggingSplit]);

  const currentPassageQuestions = useMemo(() => {
    if (!test) return [];
    return test.questions.filter((q) => q.passageIndex === currentPassage);
  }, [test, currentPassage]);

  const answeredCount = useMemo(() => {
    if (!test) return 0;
    return test.questions.filter((q) => {
      const a = answers[q.id];
      if (a === undefined || a === '') return false;
      if (Array.isArray(a) && a.length === 0) return false;
      if (Array.isArray(a) && a.every((v) => !v)) return false;
      return true;
    }).length;
  }, [test, answers]);

  const handleAnswerChange = useCallback((questionId: string, answer: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, []);

  const handleJumpToQuestion = useCallback((number: number) => {
    setCurrentNumber(number);
    // 找到该题所属 passage
    if (test) {
      const q = test.questions.find((qq) => qq.number === number);
      if (q) {
        setCurrentPassage(q.passageIndex);
      }
    }
    // 滚动到题目
    setTimeout(() => {
      const el = document.getElementById(`question-${number}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  }, [test]);

  const handlePrevQuestion = useCallback(() => {
    if (!test) return;
    const next = Math.max(1, currentNumber - 1);
    handleJumpToQuestion(next);
  }, [currentNumber, test, handleJumpToQuestion]);

  const handleNextQuestion = useCallback(() => {
    if (!test) return;
    const next = Math.min(test.questions.length, currentNumber + 1);
    handleJumpToQuestion(next);
  }, [currentNumber, test, handleJumpToQuestion]);

  const handleSwitchPassage = useCallback((index: 1 | 2 | 3) => {
    setCurrentPassage(index);
    if (test) {
      const firstQ = test.questions.find((q) => q.passageIndex === index);
      if (firstQ) {
        setCurrentNumber(firstQ.number);
      }
    }
  }, [test]);

  const handleAutoSubmit = useCallback(() => {
    setDuration(3600);
    setPhase('result');
    // 保存结果
    try {
      if (test) {
        const data: PersistedState = {
          test,
          answers,
          timeLeft: 0,
          phase: 'result',
          duration: 3600,
        };
        storage.setItem(STORAGE_KEYS.STATE, JSON.stringify(data));
      }
    } catch (e) {
      console.error('Save result failed:', e);
    }
  }, [answers, test]);

  const handleSubmitConfirm = useCallback(() => {
    setSubmitDialogOpen(false);
    setDuration(3600 - timeLeft);
    setPhase('result');
    try {
      if (test) {
        const data: PersistedState = {
          test,
          answers,
          timeLeft: 0,
          phase: 'result',
          duration: 3600 - timeLeft,
        };
        storage.setItem(STORAGE_KEYS.STATE, JSON.stringify(data));
      }
    } catch (e) {
      console.error('Save result failed:', e);
    }
    toast.success('已交卷，正在判分...');
  }, [answers, test, timeLeft]);

  const handleRetry = useCallback(() => {
    if (!test) return;
    setAnswers({});
    setTimeLeft(test.totalTime);
    setDuration(0);
    setCurrentNumber(1);
    setCurrentPassage(1);
    setIsPaused(false);
    setPhase('exam');
    // 清除保存的状态
    try {
      storage.removeItem(STORAGE_KEYS.STATE);
    } catch {
      // ignore
    }
    toast.success('已重置，开始新一轮模考');
  }, [test]);

  const handleBackToUpload = useCallback(() => {
    setPhase('upload');
    setTest(null);
    setAnswers({});
    setTimeLeft(3600);
    setDuration(0);
    setCurrentNumber(1);
    setCurrentPassage(1);
    try {
      storage.removeItem(STORAGE_KEYS.STATE);
    } catch {
      // ignore
    }
  }, []);

  const handleUseMock = useCallback(() => {
    setTest(MOCK_READING_TEST);
    setAnswers({});
    setTimeLeft(MOCK_READING_TEST.totalTime);
    setCurrentNumber(1);
    setCurrentPassage(1);
    setPhase('exam');
    toast.success('已加载示例真题，开始模考');
  }, []);

  const handleFileSelected = useCallback(async (file: File, apiKey: string) => {
    setIsParsing(true);
    setParseStep(1);
    try {
      // 第一步：PDF 解析（pdf.js 本地解析）
      toast.info('正在解析 PDF，请稍候...');
      const { text, numPages } = await parsePdfText(file);
      if (!text || text.trim().length < 100) {
        throw new Error('PDF 内容提取失败，请检查文件是否为可选择文本的 PDF');
      }
      console.info(`PDF 解析完成，共 ${numPages} 页，文本长度 ${text.length}`);

      setParseStep(2);
      toast.info('正在结构化题目...');

      // 第二步：题目结构化（OpenAI API）
      const parsedTest = await structureReadingText(apiKey, text, file.name);

      setTest(parsedTest);
      setAnswers({});
      setTimeLeft(parsedTest.totalTime);
      setCurrentNumber(1);
      setCurrentPassage(1);
      setPhase('exam');
      toast.success('解析成功，开始模考');
    } catch (err) {
      console.error('PDF parsing failed:', err);
      toast.error(
        err instanceof Error ? err.message : '解析失败，请重试或使用示例真题体验',
      );
    } finally {
      setIsParsing(false);
      setParseStep(0);
    }
  }, []);

  // 渲染各阶段
  if (phase === 'upload') {
    return (
      <UploadSection
        onFileSelected={handleFileSelected}
        onUseMock={handleUseMock}
        isParsing={isParsing}
      />
    );
  }

  if (phase === 'result' && test) {
    return (
      <ResultPanel
        test={test}
        answers={answers}
        duration={duration || 3600 - timeLeft}
        onRetry={handleRetry}
        onBackToUpload={handleBackToUpload}
      />
    );
  }

  if (phase === 'exam' && test) {
    const passage = test.passages.find((p) => p.index === currentPassage)!;
    const totalQuestions = test.questions.length;

    return (
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* 顶部操作栏 */}
        <ExamHeader
          title={test.title}
          timeLeft={timeLeft}
          isPaused={isPaused}
          onTogglePause={() => setIsPaused((p) => !p)}
          onSubmit={() => setSubmitDialogOpen(true)}
        />

        {/* Passage Tab */}
        <div className="shrink-0 border-b border-border/50 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center gap-1 px-4 md:px-6 pt-2">
            {test.passages.map((p) => (
              <button
                key={p.index}
                onClick={() => handleSwitchPassage(p.index)}
                className={
                  'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ' +
                  (currentPassage === p.index
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border')
                }
              >
                Passage {p.index}
              </button>
            ))}
            <div className="ml-auto text-xs text-muted-foreground hidden sm:block">
              已答 {answeredCount} / {totalQuestions} 题
            </div>
          </div>
        </div>

        {/* 主区：左右分栏 */}
        <div
          ref={containerRef}
          className="flex-1 flex min-h-0 relative"
          style={{ cursor: isDraggingSplit ? 'col-resize' : undefined }}
        >
          {/* 左：文章 */}
          <div
            className="h-full overflow-hidden border-r border-border/50"
            style={{ width: `${splitRatio}%` }}
          >
            <PassageReader passage={passage} />
          </div>

          {/* 分隔条 */}
          <div
            className="shrink-0 w-1.5 bg-border/40 hover:bg-primary/40 cursor-col-resize transition-colors group relative"
            onMouseDown={() => setIsDraggingSplit(true)}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-12 rounded-full bg-border/60 group-hover:bg-primary/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex flex-col gap-0.5">
                <div className="w-0.5 h-5 bg-white/60 rounded-full" />
              </div>
            </div>
          </div>

          {/* 右：题目 */}
          <div className="flex-1 h-full overflow-hidden relative" ref={questionPanelRef}>
            <QuestionPanel
              questions={currentPassageQuestions}
              currentNumber={currentNumber}
              onAnswerChange={handleAnswerChange}
            />

            {/* 上下题浮动按钮 */}
            <div className="absolute right-4 bottom-20 flex flex-col gap-1 z-10">
              <Button
                size="icon"
                variant="outline"
                onClick={handlePrevQuestion}
                disabled={currentNumber <= 1}
                className="w-10 h-10 rounded-lg shadow-sm bg-card"
                aria-label="上一题"
              >
                <ChevronUp className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                variant="default"
                onClick={handleNextQuestion}
                disabled={currentNumber >= totalQuestions}
                className="w-10 h-10 rounded-lg shadow-sm bg-primary"
                aria-label="下一题"
              >
                <ChevronDown className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* 底部题号导航 */}
        <QuestionNav
          questions={test.questions}
          currentNumber={currentNumber}
          onJump={handleJumpToQuestion}
        />

        {/* 暂停遮罩 */}
        {isPaused && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-2xl font-bold text-foreground">考试已暂停</div>
              <p className="text-muted-foreground">点击继续按钮恢复考试</p>
              <Button onClick={() => setIsPaused(false)} size="lg">
                继续考试
              </Button>
            </div>
          </div>
        )}

        {/* 交卷确认对话框 */}
        <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                确认交卷？
              </DialogTitle>
              <DialogDescription>
                交卷后将无法修改答案，请确认已完成所有题目。
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">总题数</span>
                <span className="font-medium text-foreground">{totalQuestions} 题</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">已答</span>
                <span className="font-medium text-success">{answeredCount} 题</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">未答</span>
                <span className="font-medium text-destructive">
                  {totalQuestions - answeredCount} 题
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">剩余时间</span>
                <span className="font-medium text-foreground tabular-nums">
                  {Math.floor(timeLeft / 60)}分{timeLeft % 60}秒
                </span>
              </div>
            </div>
            <DialogFooter className="flex-row gap-2 sm:justify-end">
              <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>
                继续作答
              </Button>
              <Button variant="default" onClick={handleSubmitConfirm}>
                确认交卷
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // parsing 加载态
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full mx-auto" />
        <h2 className="text-lg font-semibold text-foreground">
          {parseStep === 1 ? '正在解析 PDF...' : '正在结构化题目...'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {parseStep === 1 ? '提取文章与题目文本' : '按题型分类整理中（调用 AI 中）'}
        </p>
      </div>
    </div>
  );
}
