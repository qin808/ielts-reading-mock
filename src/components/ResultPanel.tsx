import { memo, useMemo } from 'react';
import { Award, Clock, Target, RotateCcw, Upload, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn, calculateBandScore, formatTime } from '@/lib/utils';
import type { IQuestion, IReadingTest } from '@/data/mockReading';

interface ResultPanelProps {
  test: IReadingTest;
  answers: Record<string, string | string[]>;
  duration: number;
  onRetry: () => void;
  onBackToUpload: () => void;
}

interface ScoreBreakdown {
  correct: number;
  wrong: number;
  unanswered: number;
  total: number;
}

function getScoreBreakdown(questions: IQuestion[], answers: Record<string, string | string[]>): ScoreBreakdown {
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;
  questions.forEach((q) => {
    const ua = answers[q.id];
    const ca = q.correctAnswer;
    if (ua === undefined || ua === '' || (Array.isArray(ua) && ua.length === 0)) {
      unanswered++;
      return;
    }
    if (Array.isArray(ca)) {
      if (!Array.isArray(ua)) {
        wrong++;
        return;
      }
      if (ua.length !== ca.length) {
        wrong++;
        return;
      }
      const match = ca.every((v) =>
        ua.some((u) => u.trim().toLowerCase() === v.trim().toLowerCase()),
      );
      if (match) correct++;
      else wrong++;
      return;
    }
    // 单值比较（不区分大小写）
    const uaStr = Array.isArray(ua) ? ua[0] ?? '' : ua;
    if (uaStr.trim().toLowerCase() === ca.trim().toLowerCase()) {
      correct++;
    } else {
      wrong++;
    }
  });
  return { correct, wrong, unanswered, total: questions.length };
}

function ResultPanel({ test, answers, duration, onRetry, onBackToUpload }: ResultPanelProps) {
  const breakdown = useMemo(() => getScoreBreakdown(test.questions, answers), [test.questions, answers]);
  const bandScore = useMemo(() => calculateBandScore(breakdown.correct, breakdown.total), [breakdown.correct, breakdown.total]);

  // 按 passage 分组统计
  const passageScores = useMemo(() => {
    return test.passages.map((p) => {
      const qs = test.questions.filter((q) => q.passageIndex === p.index);
      const b = getScoreBreakdown(qs, answers);
      return { passage: p, ...b };
    });
  }, [test, answers]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 py-8 md:py-12">
      <div className="max-w-5xl mx-auto px-4 md:px-6 space-y-6">
        {/* 顶部得分卡 */}
        <Card className="overflow-hidden border-primary/20 shadow-lg">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-8 py-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-2">
                  <div className="text-sm opacity-90">{test.title} · 成绩报告</div>
                  <h1 className="text-3xl md:text-4xl font-bold">模考完成</h1>
                  <div className="text-sm opacity-80">实际用时：{formatTime(duration)}</div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-5xl md:text-6xl font-black tabular-nums leading-none">
                      {bandScore.toFixed(1)}
                    </div>
                    <div className="text-xs opacity-80 mt-1">雅思阅读 Band 分</div>
                  </div>
                  <div className="w-px h-16 bg-primary-foreground/30 hidden md:block" />
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>正确 {breakdown.correct} 题</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      <span>错误 {breakdown.wrong} 题</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MinusCircle className="w-4 h-4" />
                      <span>未答 {breakdown.unanswered} 题</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 统计卡 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-card">
              <StatCard icon={Target} label="总题数" value={breakdown.total.toString()} />
              <StatCard icon={CheckCircle} label="正确" value={breakdown.correct.toString()} tone="success" />
              <StatCard icon={XCircle} label="错误" value={breakdown.wrong.toString()} tone="destructive" />
              <StatCard icon={Clock} label="用时" value={formatTime(duration)} />
            </div>
          </CardContent>
        </Card>

        {/* Passage 正确率 */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4">各 Passage 正确率</h3>
            <div className="space-y-4">
              {passageScores.map((ps) => {
                const percent = ps.total === 0 ? 0 : Math.round((ps.correct / ps.total) * 100);
                return (
                  <div key={ps.passage.index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">
                        Passage {ps.passage.index} · {ps.passage.title}
                      </span>
                      <span className="text-muted-foreground">
                        {ps.correct}/{ps.total} ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button onClick={onRetry} variant="default" className="flex-1 h-11">
            <RotateCcw className="w-4 h-4 mr-2" />
            再做一次
          </Button>
          <Button onClick={onBackToUpload} variant="outline" className="flex-1 h-11">
            <Upload className="w-4 h-4 mr-2" />
            返回上传新题
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: 'success' | 'destructive';
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          tone === 'success' && 'bg-success/15 text-success',
          tone === 'destructive' && 'bg-destructive/15 text-destructive',
          !tone && 'bg-primary/15 text-primary',
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={cn(
          'text-lg font-bold tabular-nums',
          tone === 'success' && 'text-success',
          tone === 'destructive' && 'text-destructive',
          !tone && 'text-foreground',
        )}>
          {value}
        </div>
      </div>
    </div>
  );
}

// Award icon placeholder 未使用的导入处理
void Award;

export default memo(ResultPanel);
