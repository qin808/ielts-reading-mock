import { memo } from 'react';
import type { IPassage } from '@/data/mockReading';

interface PassageReaderProps {
  passage: IPassage;
}

function PassageReader({ passage }: PassageReaderProps) {
  return (
    <div className="h-full flex flex-col bg-white">
      {/* 顶部 Passag 信息 */}
      <div className="shrink-0 px-6 py-4 border-b border-border/50 bg-muted/30">
        <div className="text-xs font-medium text-muted-foreground mb-1">
          Passage {passage.index}
        </div>
        <div className="text-sm text-muted-foreground">
          You should spend about {passage.suggestedTime} minutes on{' '}
          {passage.questionRange}, which are based on Reading Passage {passage.index} below.
        </div>
      </div>

      {/* 文章内容 */}
      <div className="flex-1 overflow-y-auto px-8 py-6 prose prose-sm max-w-none prose-headings:text-center prose-headings:font-serif prose-headings:text-foreground prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:mb-4 prose-strong:text-foreground">
        <div
          dangerouslySetInnerHTML={{ __html: passage.content }}
          className="reading-content space-y-4 text-[15px] leading-relaxed text-foreground/90"
        />
      </div>
    </div>
  );
}

export default memo(PassageReader);
