import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { IQuestion, QuestionType } from '@/data/mockReading';

interface QuestionPanelProps {
  questions: IQuestion[];
  currentNumber: number;
  onAnswerChange: (questionId: string, answer: string | string[]) => void;
  showResult?: boolean;
}

function getTypeLabel(type: QuestionType): string {
  switch (type) {
    case 'true_false_not_given':
      return '判断题';
    case 'multiple_choice_single':
      return '单选题';
    case 'multiple_choice_multi':
      return '多选题';
    case 'fill_blank_summary':
      return '摘要填空';
    case 'fill_blank_sentence':
      return '句子填空';
    case 'matching_heading':
      return '标题匹配';
    case 'matching_information':
      return '段落信息匹配';
    case 'matching_name':
      return '人名匹配';
    default:
      return '题目';
  }
}

// 按 groupRange 分组展示题目
function groupQuestions(questions: IQuestion[]) {
  const groups: { key: string; instruction?: string; range?: string; type: QuestionType; items: IQuestion[] }[] = [];
  const seen = new Set<string>();
  questions.forEach((q) => {
    const key = q.groupRange ?? `type-${q.type}`;
    if (!seen.has(key)) {
      seen.add(key);
      groups.push({
        key,
        instruction: q.groupInstruction,
        range: q.groupRange,
        type: q.type,
        items: questions.filter((qq) => (qq.groupRange ?? `type-${qq.type}`) === key),
      });
    }
  });
  return groups;
}

function QuestionPanel({ questions, currentNumber, onAnswerChange, showResult }: QuestionPanelProps) {
  const groups = useMemo(() => groupQuestions(questions), [questions]);

  const currentQ = questions.find((q) => q.number === currentNumber);

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        {groups.map((group) => (
          <div key={group.key} className="space-y-4">
            {/* 题型说明 */}
            {(group.range || group.instruction) && (
              <div className="pb-3 border-b border-border/50">
                {group.range && (
                  <div className="text-base font-semibold text-foreground mb-2">
                    {group.range}
                  </div>
                )}
                {group.instruction && (
                  <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {group.instruction}
                  </div>
                )}
                <div className="text-xs text-primary font-medium mt-2">
                  {getTypeLabel(group.type)}
                </div>
              </div>
            )}

            {/* 题目列表 */}
            <div className="space-y-5">
              {group.items.map((q) => (
                <QuestionItem
                  key={q.id}
                  question={q}
                  isCurrent={q.number === currentNumber}
                  onAnswerChange={onAnswerChange}
                  showResult={showResult}
                />
              ))}
            </div>

            {/* 匹配题：统一显示选项列表 */}
            {(group.type === 'matching_heading' ||
              group.type === 'matching_information' ||
              group.type === 'matching_name') &&
              group.items[0]?.options &&
              group.items[0].options.length > 0 && (
                <div className="mt-2 pt-4 border-t border-border/40">
                  <div className="text-xs text-muted-foreground mb-3 font-medium">选项列表</div>
                  <div className="space-y-2">
                    {group.items[0].options.map((opt, i) => {
                      const letter = opt.match(/^([A-Z]{1,2}|[ivxlcdm]+)\.?\s*/i)?.[1]?.toUpperCase() ?? String.fromCharCode(65 + i);
                      const text = opt.replace(/^[A-Z]{1,2}\.?\s*/i, '').replace(/^[ivxlcdm]+\.?\s*/i, '');
                      return (
                        <div key={i} className="flex gap-2 px-3 py-2 rounded-md border border-border/50 bg-muted/20">
                          <span className="shrink-0 w-6 text-sm font-semibold text-primary">{letter}</span>
                          <span className="text-sm text-foreground/90 leading-relaxed">{text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
          </div>
        ))}
        {questions.length === 0 && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            暂无题目
          </div>
        )}
      </div>
      {/* 当前题号标记（占位，供参考） */}
      {currentQ && (
        <div className="shrink-0 px-4 py-2 border-t border-border/50 bg-muted/30 text-xs text-muted-foreground text-center">
          当前第 {currentNumber} 题 / 共 {questions.length} 题
        </div>
      )}
    </div>
  );
}

interface QuestionItemProps {
  question: IQuestion;
  isCurrent: boolean;
  onAnswerChange: (questionId: string, answer: string | string[]) => void;
  showResult?: boolean;
}

function QuestionItem({ question, isCurrent, onAnswerChange, showResult }: QuestionItemProps) {
  const id = `q-${question.id}`;
  const isMatching =
    question.type === 'matching_heading' ||
    question.type === 'matching_information' ||
    question.type === 'matching_name';
  const isCorrect = useMemo(() => {
    if (!showResult) return null;
    const ua = question.userAnswer;
    const ca = question.correctAnswer;
    if (Array.isArray(ca)) {
      if (!Array.isArray(ua)) return false;
      if (ua.length !== ca.length) return false;
      return ca.every((v) => ua.includes(v));
    }
    return ua === ca;
  }, [showResult, question]);

  return (
    <div
      id={`question-${question.number}`}
      className={cn(
        'p-4 rounded-lg transition-all scroll-mt-4',
        isCurrent ? 'bg-primary/5 ring-1 ring-primary/30' : 'bg-transparent',
        showResult && isCorrect === true && 'bg-success/10 ring-1 ring-success/30',
        showResult && isCorrect === false && 'bg-destructive/10 ring-1 ring-destructive/30',
      )}
    >
      {/* 题干 */}
      <div className="flex gap-3 items-start">
        <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
          {question.number}
        </span>
        <div className="flex-1 text-sm text-foreground leading-relaxed pt-1">
          {question.questionText}
        </div>
        {/* 匹配题：下拉框与题干同行 */}
        {isMatching && (
          <div className="shrink-0 pt-0.5">
            {renderOptions(question, id, onAnswerChange, showResult)}
          </div>
        )}
      </div>

      {/* 选项区（非匹配题） */}
      {!isMatching && (
        <div className="pl-10 mt-3 space-y-2">
          {renderOptions(question, id, onAnswerChange, showResult)}
        </div>
      )}

      {/* 结果区 */}
      {showResult && (
        <div className="pl-10 mt-3 pt-3 border-t border-border/40 space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">你的答案：</span>
            <span className={cn('font-medium', isCorrect ? 'text-success' : 'text-destructive')}>
              {formatAnswer(question.userAnswer) || '未作答'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">正确答案：</span>
            <span className="font-medium text-success">
              {formatAnswer(question.correctAnswer)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function formatAnswer(answer: string | string[] | undefined): string {
  if (!answer) return '';
  if (Array.isArray(answer)) return answer.join(', ');
  return answer;
}

function renderOptions(
  question: IQuestion,
  id: string,
  onAnswerChange: (id: string, answer: string | string[]) => void,
  showResult?: boolean,
) {
  const { type, options: rawOptions, userAnswer, correctAnswer, blanks } = question;

  // 判断题使用固定选项
  const options = type === 'true_false_not_given' && (!rawOptions || rawOptions.length === 0)
    ? ['TRUE', 'FALSE', 'NOT GIVEN']
    : rawOptions;

  // 匹配题：题干 + 下拉选择框（选项列表在题目组下方统一展示）
  if (
    options &&
    (type === 'matching_heading' || type === 'matching_information' || type === 'matching_name')
  ) {
    const selected = (userAnswer as string) ?? '';
    return (
      <div className="flex items-center gap-3">
        <select
          value={selected}
          disabled={showResult}
          onChange={(e) => onAnswerChange(question.id, e.target.value)}
          className={cn(
            'h-9 min-w-[80px] px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-60',
            showResult && selected === correctAnswer && 'bg-success/15 border-success/50 text-success',
            showResult && selected && selected !== correctAnswer && 'bg-destructive/15 border-destructive/50',
          )}
        >
          <option value="">-</option>
          {options.map((opt) => {
            const letter = opt.match(/^([A-Z]{1,2}|[ivxlcdm]+)\.?\s*/i)?.[1]?.toUpperCase() ?? opt;
            return (
              <option key={opt} value={opt}>
                {letter}
              </option>
            );
          })}
        </select>
        {showResult && (
          <span className="text-xs text-muted-foreground">
            正确: {String(correctAnswer).match(/^([A-Z]{1,2}|[ivxlcdm]+)\.?/i)?.[1] ?? String(correctAnswer)}
          </span>
        )}
      </div>
    );
  }

  // 单选类：TRUE/FALSE/NOT GIVEN、单选题
  if (
    options &&
    (type === 'true_false_not_given' || type === 'multiple_choice_single')
  ) {
    return (
      <div className="space-y-2">
        {options.map((opt) => {
          const checked = userAnswer === opt;
          const isCorrectOpt = showResult && correctAnswer === opt;
          const isWrongOpt = showResult && checked && correctAnswer !== opt;
          return (
            <label
              key={opt}
              className={cn(
                'flex items-center gap-3 p-2.5 rounded-md cursor-pointer transition-colors',
                showResult && isCorrectOpt && 'bg-success/15',
                showResult && isWrongOpt && 'bg-destructive/15',
                !showResult && 'hover:bg-muted/60',
              )}
            >
              <input
                type="radio"
                name={id}
                value={opt}
                checked={checked}
                disabled={showResult}
                onChange={(e) => onAnswerChange(question.id, e.target.value)}
                className="shrink-0 text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">{opt}</span>
            </label>
          );
        })}
      </div>
    );
  }

  // 多选题
  if (options && type === 'multiple_choice_multi') {
    const ua = Array.isArray(userAnswer) ? userAnswer : [];
    const ca = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
    return (
      <div className="space-y-2">
        {options.map((opt, idx) => {
          const label = String.fromCharCode(65 + idx); // A, B, C, D, E
          const checked = ua.includes(label);
          const isCorrectOpt = showResult && ca.includes(label);
          const isWrongOpt = showResult && checked && !ca.includes(label);
          return (
            <label
              key={opt}
              className={cn(
                'flex items-center gap-3 p-2.5 rounded-md cursor-pointer transition-colors',
                showResult && isCorrectOpt && 'bg-success/15',
                showResult && isWrongOpt && 'bg-destructive/15',
                !showResult && 'hover:bg-muted/60',
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={showResult}
                onChange={(e) => {
                  const next = e.target.checked ? [...ua, label] : ua.filter((x) => x !== label);
                  onAnswerChange(question.id, next);
                }}
                className="shrink-0 text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">
                <span className="font-semibold">{label}.</span> {opt}
              </span>
            </label>
          );
        })}
      </div>
    );
  }

  // 填空题：摘要填空（多空）、句子填空（单空）
  if (type === 'fill_blank_summary' || type === 'fill_blank_sentence') {
    const count = blanks ?? (type === 'fill_blank_sentence' ? 1 : 1);
    const ua = Array.isArray(userAnswer) ? userAnswer : userAnswer ? [userAnswer] : [];
    const ca = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];

    // 渲染带编号的填空输入框
    const blanksJsx: React.ReactNode[] = [];
    for (let i = 0; i < count; i++) {
      const blankNum = i + 1;
      const val = ua[i] ?? '';
      const isCorrectBlank = showResult && val.trim().toLowerCase() === (ca[i] ?? '').toLowerCase();
      const isWrongBlank = showResult && val && val.trim().toLowerCase() !== (ca[i] ?? '').toLowerCase();
      blanksJsx.push(
        <div key={i} className="inline-flex items-center mx-1 align-middle">
          <span className="text-xs text-muted-foreground mr-1 font-medium">{blankNum}.</span>
          <input
            type="text"
            value={val}
            disabled={showResult}
            onChange={(e) => {
              const next = [...ua];
              next[i] = e.target.value;
              onAnswerChange(question.id, next);
            }}
            className={cn(
              'w-28 h-7 px-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary',
              showResult && isCorrectBlank && 'bg-success/15 border-success/50 text-success-foreground',
              showResult && isWrongBlank && 'bg-destructive/15 border-destructive/50',
            )}
            placeholder={`第${blankNum}空`}
          />
        </div>,
      );
    }

    return (
      <div className="space-y-3">
        <div className="text-sm leading-8 text-foreground/90">
          请在下方填写答案：
        </div>
        <div className="flex flex-wrap gap-2">
          {blanksJsx}
        </div>
      </div>
    );
  }

  return null;
}

export default memo(QuestionPanel);
