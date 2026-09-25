import { useState } from 'react';
import { ArrowLeft, Sparkles, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { QuestionGenConfig } from '@/lib/openAI';

interface QuestionConfigPanelProps {
  articleTitle: string;
  articleLength: number;
  onGenerate: (config: QuestionGenConfig) => void;
  onBack: () => void;
  isGenerating: boolean;
}

const TYPE_OPTIONS: {
  key: keyof QuestionGenConfig;
  label: string;
  desc: string;
  max: number;
}[] = [
  { key: 'true_false_not_given', label: '判断题', desc: 'TRUE / FALSE / NOT GIVEN', max: 10 },
  { key: 'multiple_choice_single', label: '单选题', desc: '四选一 (A-D)', max: 5 },
  { key: 'multiple_choice_multi', label: '多选题', desc: '选 TWO (A-E)', max: 3 },
  { key: 'fill_blank_sentence', label: '句子填空', desc: '从原文选词填空', max: 8 },
  { key: 'fill_blank_summary', label: '摘要填空', desc: 'Summary 选词 (空数)', max: 7 },
  { key: 'matching_heading', label: '标题匹配', desc: '为段落选小标题', max: 6 },
  { key: 'matching_information', label: '段落信息匹配', desc: '找包含信息的段落', max: 6 },
];

export default function QuestionConfigPanel({
  articleTitle,
  articleLength,
  onGenerate,
  onBack,
  isGenerating,
}: QuestionConfigPanelProps) {
  const [config, setConfig] = useState<QuestionGenConfig>({
    true_false_not_given: 5,
    multiple_choice_single: 3,
    multiple_choice_multi: 0,
    fill_blank_sentence: 4,
    fill_blank_summary: 0,
    matching_heading: 0,
    matching_information: 0,
  });

  const totalQuestions = Object.values(config).reduce((s, v) => s + v, 0);

  const updateCount = (key: keyof QuestionGenConfig, value: number) => {
    const max = TYPE_OPTIONS.find((t) => t.key === key)?.max ?? 10;
    const clamped = Math.max(0, Math.min(max, value));
    setConfig((prev) => ({ ...prev, [key]: clamped }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden">
        {/* 头部 */}
        <div className="p-6 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} disabled={isGenerating}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI 出题配置
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                <FileText className="w-3 h-3 inline mr-1" />
                {articleTitle} · 约 {Math.round(articleLength / 1000)}K 字符
              </p>
            </div>
          </div>
        </div>

        {/* 题型选择 */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            选择需要 AI 生成的题型和数量，留空则不生成该题型。
          </p>
          <div className="space-y-3">
            {TYPE_OPTIONS.map((opt) => (
              <div
                key={opt.key}
                className="flex items-center gap-4 p-3 rounded-lg border border-border/50 bg-background hover:border-primary/30 transition-colors"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.desc}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => updateCount(opt.key, config[opt.key] - 1)}
                    disabled={isGenerating || config[opt.key] <= 0}
                  >
                    −
                  </Button>
                  <Input
                    type="number"
                    min={0}
                    max={opt.max}
                    value={config[opt.key]}
                    onChange={(e) => updateCount(opt.key, parseInt(e.target.value) || 0)}
                    className="w-16 h-9 text-center"
                    disabled={isGenerating}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => updateCount(opt.key, config[opt.key] + 1)}
                    disabled={isGenerating || config[opt.key] >= opt.max}
                  >
                    +
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* 总计 */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
            <span className="text-sm font-medium text-foreground">预计总题数</span>
            <span className="text-lg font-bold text-primary">{totalQuestions} 题</span>
          </div>
          {totalQuestions < 5 && (
            <p className="text-xs text-warning">建议至少选择 5 道题，否则题目太少练习效果不佳。</p>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="p-6 border-t border-border/50 bg-muted/30 flex gap-3">
          <Button variant="outline" onClick={onBack} disabled={isGenerating} className="flex-1">
            返回
          </Button>
          <Button
            onClick={() => onGenerate(config)}
            disabled={isGenerating || totalQuestions < 1}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                AI 出题中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                开始出题（{totalQuestions} 题）
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
