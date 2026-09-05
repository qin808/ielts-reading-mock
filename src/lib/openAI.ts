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
          "notes_content": "仅摘要填空题(FILL_BLANK_SUMMARY)需要：完整的笔记原文，保留所有上下文行（包括不带空格的描述行），用 _____（5个下划线）标记每个空格位置，用 \\n 换行",
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
4. 摘要填空题（FILL_BLANK_SUMMARY）必须填写 notes_content 字段：包含完整的笔记原文，保留所有上下文行（包括不带空格的纯描述行），每个空格用 _____（5个下划线）标记，行与行之间用 \\n 分隔。questions 数组中每个题目对应一个空格，按空格出现顺序编号。
5. 句子填空题（FILL_BLANK_SENTENCE）的 question_text 必须包含完整的句子上下文，用 _____ 标记空格位置
6. 填空题若有多空，answer 为数组，按空的顺序排列
7. 多选题 answer 为数组
8. 若 PDF 中未提供正确答案，answer 字段留空字符串
9. passage_content 保留原文的段落结构，用 \\n\\n 分隔段落
10. passage_content 中必须过滤掉页码（如纯数字行）、页眉页脚（如 "Test 2"、"Cambridge IELTS"、考试机构名称等）、角标、脚注标记等非正文内容
11. 只输出 JSON，不要输出任何解释性文字或 markdown 标记`;

export interface StructuredResult {
  passages: {
    passage_title: string;
    passage_content: string;
    question_groups: {
      question_type: string;
      instructions: string;
      notes_content?: string;
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
 * 从模型返回内容中提取 JSON（兼容不支持 response_format 的 API）
 */
function extractJson(content: string): any {
  // 直接尝试解析
  try {
    return JSON.parse(content);
  } catch {
    // ignore
  }
  // 尝试提取 ```json ... ``` 包裹的内容
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch {
      // ignore
    }
  }
  // 尝试提取第一个 { 到最后一个 } 之间的内容
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(content.slice(firstBrace, lastBrace + 1));
    } catch {
      // ignore
    }
  }
  throw new Error('返回的 JSON 格式解析失败，请重试或更换模型');
}

/**
 * 调用 AI API，自动兼容是否支持 response_format
 */
async function callChatApi(
  apiKey: string,
  apiUrl: string,
  model: string,
  messages: { role: string; content: string }[],
  temperature: number = 0.3,
): Promise<string> {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  // 第一次尝试：带 response_format（OpenAI 兼容）
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        temperature,
        response_format: { type: 'json_object' },
        messages,
      }),
    });

    // 如果是 400 错误，可能是不支持 response_format，降级重试
    if (response.status === 400) {
      const errText = await response.text();
      console.warn('带 response_format 调用失败，降级重试:', errText.slice(0, 200));
      throw new Error('response_format_not_supported');
    }

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `API 请求失败 (${response.status})`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) errMsg = errJson.error.message;
      } catch {
        // ignore
      }
      throw new Error(errMsg);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('API 返回内容为空');
    return content;
  } catch (err) {
    // 如果是不支持 response_format，降级不带参数重试
    if (err instanceof Error && err.message === 'response_format_not_supported') {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, temperature, messages }),
      });
      if (!response.ok) {
        const errText = await response.text();
        let errMsg = `API 请求失败 (${response.status})`;
        try {
          const errJson = JSON.parse(errText);
          if (errJson.error?.message) errMsg = errJson.error.message;
        } catch {
          // ignore
        }
        throw new Error(errMsg);
      }
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('API 返回内容为空');
      return content;
    }
    throw err;
  }
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

  // 限制文本长度，防止 token 超限（DeepSeek 等模型上下文较短，限制更严格）
  const maxLen = model.includes('deepseek') ? 30000 : 60000;
  const trimmedText = readingText.length > maxLen ? readingText.slice(0, maxLen) : readingText;

  const userPrompt = `以下是一份雅思阅读真题的文本内容，请按要求结构化：

${trimmedText}`;

  const content = await callChatApi(
    apiKey,
    apiUrl,
    model,
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    0.3,
  );

  const parsed = extractJson(content) as StructuredResult;

  if (!parsed.passages || parsed.passages.length === 0) {
    throw new Error('未能识别出任何 Passage，请检查 PDF 是否为雅思阅读真题，或更换模型重试');
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
      const notesContent = gRaw.notes_content;

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
          notesContent: questionType === 'fill_blank_summary' ? notesContent : undefined,
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

const GRADE_SYSTEM_PROMPT = `你是一位资深雅思阅读考官。请根据提供的阅读文章内容，回答以下雅思阅读题目。

输出严格的 JSON 格式，key 是题目编号（数字字符串），value 是正确答案：
- 判断题（TRUE/FALSE/NOT GIVEN）：值为 "TRUE" / "FALSE" / "NOT GIVEN"
- 单选题：值为选项字母，如 "A"、"B"、"C"、"D"
- 多选题：值为选项字母数组，如 ["A", "C"]
- 填空题：值为答案字符串（从原文中提取的单词/短语），多空则为数组
- 匹配题：值为匹配的字母/编号

示例输出：
{
  "1": "TRUE",
  "2": "C",
  "3": ["A", "D"],
  "4": "synthetic string",
  "5": ["5 pounds", "customisation"]
}

注意：
1. 所有答案必须基于文章内容，不能凭空猜测
2. 填空题答案必须是文章中出现的原词
3. 只输出 JSON，不要输出任何解释性文字`;

/**
 * AI 自动批改：根据文章内容生成每道题的正确答案
 * 按 Passage 分批调用，避免 token 超限
 */
export async function gradeAnswers(
  apiKey: string,
  passageContent: string,
  questions: IQuestion[],
  model: string = DEFAULT_MODEL,
  apiUrl: string = DEFAULT_API_URL,
): Promise<Record<number, string | string[]>> {
  if (!apiKey.trim()) {
    throw new Error('请先设置 OpenAI API Key');
  }
  if (questions.length === 0) return {};

  // 构建题目文本
  const questionsText = questions
    .map((q) => {
      let text = `第${q.number}题 [${q.type}]: ${q.questionText}`;
      if (q.options && q.options.length > 0) {
        text += '\n选项：\n' + q.options.join('\n');
      }
      if (q.blanks && q.blanks > 1) {
        text += `\n（共${q.blanks}个空）`;
      }
      return text;
    })
    .join('\n\n');

  const userPrompt = `阅读文章：

${passageContent.slice(0, 30000)}

---

题目：

${questionsText}

请根据文章内容，输出每道题的正确答案 JSON。`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: GRADE_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = `API 请求失败 (${response.status})`;
    try {
      const errJson = JSON.parse(errText);
      if (errJson.error?.message) errMsg = errJson.error.message;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI 批改返回内容为空');
  }

  let parsed: Record<string, string | string[]>;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('AI 批改返回的 JSON 格式解析失败');
  }

  // 转换 key 为数字
  const result: Record<number, string | string[]> = {};
  Object.entries(parsed).forEach(([k, v]) => {
    const num = parseInt(k, 10);
    if (!isNaN(num)) {
      result[num] = v;
    }
  });

  return result;
}
