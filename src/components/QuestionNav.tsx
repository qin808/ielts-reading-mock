import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { IQuestion } from '@/data/mockReading';

interface QuestionNavProps {
  questions: IQuestion[];
  currentNumber: number;
  onJump: (number: number) => void;
}

function QuestionNav({ questions, currentNumber, onJump }: QuestionNavProps) {
  // 按 Passage 分组
  const groups = [
    { label: 'Part 1', items: questions.filter((q) => q.passageIndex === 1) },
    { label: 'Part 2', items: questions.filter((q) => q.passageIndex === 2) },
    { label: 'Part 3', items: questions.filter((q) => q.passageIndex === 3) },
  ];

  return (
    <div className="shrink-0 w-full bg-background/95 backdrop-blur-sm border-t border-border/50 px-4 py-3">
      <div className="flex items-center justify-center gap-6 md:gap-10 flex-wrap">
        {groups.map((group) => {
          const answeredCount = group.items.filter((q) => q.isAnswered).length;
          return (
            <div key={group.label} className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground w-12 shrink-0">
                {group.label}
              </span>
              <div className="flex gap-1.5">
                {group.items.map((q) => {
                  const isCurrent = q.number === currentNumber;
                  return (
                    <button
                      key={q.id}
                      onClick={() => onJump(q.number)}
                      className={cn(
                        'w-7 h-7 rounded-md text-xs font-medium transition-all flex items-center justify-center',
                        isCurrent
                          ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                          : q.isAnswered
                            ? 'bg-primary/15 text-primary hover:bg-primary/25'
                            : 'bg-muted text-muted-foreground hover:bg-muted-foreground/15 hover:text-foreground',
                      )}
                      aria-label={`跳转到第 ${q.number} 题`}
                    >
                      {q.number}
                    </button>
                  );
                })}
              </div>
              <span className="text-xs text-muted-foreground w-10 shrink-0">
                {answeredCount}/{group.items.length}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(QuestionNav);
