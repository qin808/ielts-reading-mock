import type { IReadingTest, IQuestion, QuestionType, IPassage } from '@/data/mockReading';

export const DEFAULT_API_URL = 'https://api.openai.com/v1/chat/completions';
export const DEFAULT_MODEL = 'gpt-4o-mini';

export const AVAILABLE_MODELS = [
  { value: 'gpt-4o-mini', label: 'gpt-4o-mini（推荐，速度快成本低）' },
  { value: 'gpt-4o', label: 'gpt-4o（精度更高，成本较高）' },
  { value: 'gpt-4.1-mini', label: 'gpt-4.1-mini' },
  { value: 'gpt-4.1', label: 'gpt-4.1' },
  { value: 'deepseek-chat', label: 'deepseek-chat（DeepSeek，需自定义 API 地址）' },
  { value: 'deepseek-reasoner', label: 'deepseek-reasoner（DeepSeek 推理模型）' },
  { value: 'qwen-plus', label: 'qwen-plus（通义千问，需自定义 API 地址）' },
  { value: 'glm-4-flash', label: 'glm-4-flash（智谱，需自定义 API 地址）' },
];

const SYSTEM_PROMPT = `你是一位专业的雅思考试内容结构化专家。请将用户提供的雅思阅读真题文本解析为严格的 JSON 格式。

输出格式要求（response_format: json_object）：
{
  "passages": [
    {
      "passage_title": "文章标题",
      "passage_content": "文章完整正文，保留段落换行",
      "question_groups": [
        {
          "question_type": "TRUE_FALSE_NOT_GIVEN | MULTIPLE_CHOICE_SINGLE | MULTIPLE_CHOICE_MULTI | FILL_BLANK_SUMMARY | FILL_BLANK_SENTENCE | MATCHING_HEADING | MATCHING_INFORMATION | MATCHING_PERSON",
          "instructions": "题目组说明文字，如题型介绍和要求",
          "questions": [
            {
              "number": 1,
              "question_text": "题干内容",
              "options": ["A. 选项1", "B. 选项2"],
              "answer": "正确答案，单选/判断为字符串，多选/多空为字符串数组",
              "explanation": "答案说明（可选）"
            }
          ]
        }
      ]
    }
  ]
}

注意事项：
1. 严格识别 Passage 1/2/3 三篇文章及其对应的题目
2. 题目编号为全局连续编号（1-40）
3. 选项数组中保留 A./B./C. 前缀
4. 填空题若有多空，answer 为数组，按空的顺序排列
5. 多选题 answer 为数组
6. 若 PDF 中未提供正确答案，answer 字段留空字符串
7. passage_content 保留原文的段落结构，用 \\n\\n 分隔段落
8. 只输出 JSON，不要输出任何解释性文字或 markdown 标记`;

export interface StructuredResult {
  passages: {
    passage_title: string;
    passage_content: string;
    question_groups: {
      question_type: string;
      instructions: string;
      questions: {
        number: number;
        question_text: string;
        options?: string[];
        answer: string | string[];
        explanation?: string;
      }[];
    }[];
  }[];
}

/**
 * 调用 OpenAI API 将阅读文本结构化为题目数据
 */
export async function structureReadingText(
  apiKey: string,
  readingText: string,
  fileName: string,
  model: string = DEFAULT_MODEL,
  apiUrl: string = DEFAULT_API_URL,
): Promise<IReadingTest> {
  if (!apiKey.trim()) {
    throw new Error('请先设置 OpenAI API Key');
  }

  // 限制文本长度，防止 token 超限
  const trimmedText = readingText.length > 60000 ? readingText.slice(0, 60000) : readingText;

  const userPrompt = `以下是一份雅思阅读真题的文本内容，请按要求结构化：

${trimmedText}`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = `API 请求失败 (${response.status})`;
    try {
      const errJson = JSON.parse(errText);
      if (errJson.error?.message) {
        errMsg = errJson.error.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('API 返回内容为空');
  }

  let parsed: StructuredResult;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('返回的 JSON 格式解析失败');
  }

  if (!parsed.passages || parsed.passages.length === 0) {
    throw new Error('未能识别出任何 Passage，请检查 PDF 是否为雅思阅读真题');
  }

  return convertToReadingTest(parsed, fileName);
}

function mapQuestionType(rawType: string): QuestionType {
  const t = rawType.toUpperCase().replace(/-/g, '_').replace(/ /g, '_');
  const map: Record<string, QuestionType> = {
    TRUE_FALSE_NOT_GIVEN: 'true_false_not_given',
    MULTIPLE_CHOICE_SINGLE: 'multiple_choice_single',
    MULTIPLE_CHOICE_MULTI: 'multiple_choice_multi',
    FILL_BLANK_SUMMARY: 'fill_blank_summary',
    FILL_BLANK_SENTENCE: 'fill_blank_sentence',
    MATCHING_HEADING: 'matching_heading',
    MATCHING_INFORMATION: 'matching_information',
    MATCHING_PERSON: 'matching_name',
    MATCHING_NAME: 'matching_name',
  };
  return map[t] ?? 'multiple_choice_single';
}

function convertToReadingTest(data: StructuredResult, fileName: string): IReadingTest {
  const passages: IPassage[] = [];
  const allQuestions: IQuestion[] = [];
  let globalQNum = 1;

  data.passages.forEach((pRaw, idx) => {
    const passageIndex = (idx + 1) as 1 | 2 | 3;
    const title = pRaw.passage_title || `Passage ${passageIndex}`;
    const content = pRaw.passage_content || '';
    const groups = pRaw.question_groups || [];

    const firstQ = globalQNum;
    let passageQCount = 0;

    groups.forEach((gRaw) => {
      const questionType = mapQuestionType(gRaw.question_type);
      const qs = gRaw.questions || [];

      qs.forEach((q) => {
        const options = q.options && q.options.length > 0 ? q.options : undefined;
        const correctAnswer = q.answer ?? '';

        allQuestions.push({
          id: `p${passageIndex}-q${globalQNum}`,
          number: q.number || globalQNum,
          passageIndex,
          type: questionType,
          groupInstruction: gRaw.instructions,
          groupRange: undefined,
          questionText: q.question_text,
          options,
          correctAnswer,
          isAnswered: false,
        });
        passageQCount++;
        globalQNum++;
      });
    });

    const lastQ = firstQ + passageQCount - 1;
    // 将 passage_content 转为 HTML 分段
    const htmlContent = content
      .split(/\n\s*\n/)
      .filter((p) => p.trim())
      .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');

    passages.push({
      index: passageIndex,
      title,
      content: htmlContent,
      suggestedTime: 20,
      questionRange: passageQCount > 0 ? `Questions ${firstQ}-${lastQ}` : 'Questions',
    });
  });

  // 补全不足 3 篇的情况
  while (passages.length < 3 && passages.length > 0) {
    const nextIdx = (passages.length + 1) as 1 | 2 | 3;
    passages.push({
      index: nextIdx,
      title: `Passage ${nextIdx}`,
      content: '<p>（未识别到该 Passage 内容）</p>',
      suggestedTime: 20,
      questionRange: 'Questions 0-0',
    });
  }

  // 计算总题数
  const totalQuestions = allQuestions.length;

  return {
    id: `upload-${Date.now()}`,
    source: 'user-uploaded',
    title: fileName.replace(/\.pdf$/i, ''),
    totalTime: 3600,
    passages,
    questions: allQuestions,
  };

  // 避免 TypeScript 未使用变量告警
  void totalQuestions;
}
