import { Pause, Play, Send, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ExamHeaderProps {
  title: string;
  timeLeft: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onSubmit: () => void;
  onSaveExit?: () => void;
}

export default function ExamHeader({
  title,
  timeLeft,
  isPaused,
  onTogglePause,
  onSubmit,
  onSaveExit,
}: ExamHeaderProps) {
  const isLowTime = timeLeft < 300; // 不足 5 分钟

  return (
    <header className="sticky top-0 z-40 w-full bg-background/90 backdrop-blur-md border-b border-border/50">
      <div className="flex items-center justify-between px-4 md:px-6 h-14">
        {/* 左侧：考试信息 */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              IE
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-foreground leading-tight">
                {title}
              </div>
              <div className="text-xs text-muted-foreground">Test taker IDxxxxx</div>
            </div>
          </div>
        </div>

        {/* 中间：倒计时 */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'text-xl md:text-2xl font-bold tabular-nums tracking-tight',
              isLowTime ? 'text-destructive animate-pulse' : 'text-foreground',
            )}
          >
            {formatTime(timeLeft)}
          </div>
          <div className="text-xs text-muted-foreground">remaining</div>
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onTogglePause}
            className="h-9"
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 mr-1.5" />
                继续
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 mr-1.5" />
                暂停
              </>
            )}
          </Button>
          {onSaveExit && (
            <Button variant="outline" size="sm" onClick={onSaveExit} className="h-9 hidden md:flex">
              <Save className="w-4 h-4 mr-1.5" />
              保存退出
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={onSubmit}
            className="h-9 bg-primary hover:bg-primary/90"
          >
            <Send className="w-4 h-4 mr-1.5" />
            交卷
          </Button>
        </div>
      </div>
    </header>
  );
}
