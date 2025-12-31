import OpenAI from 'openai';

let _client: OpenAI | null = null;

const getClient = (): OpenAI => {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    _client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }
  return _client;
};

export interface PIIDetection {
  type: 'name' | 'phone' | 'email' | 'rrn' | 'address' | 'account' | 'other';
  text: string;
  startIndex: number;
  endIndex: number;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface PIIAnalysisResult {
  hasPII: boolean;
  detections: PIIDetection[];
  maskedText: string;
  riskLevel: 'safe' | 'caution' | 'danger';
}

/**
 * Regex-based quick PII detection (runs instantly, no API call)
 */
export function quickPIICheck(text: string): PIIDetection[] {
  const detections: PIIDetection[] = [];

  // Email pattern
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  let match;
  while ((match = emailRegex.exec(text)) !== null) {
    detections.push({
      type: 'email',
      text: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      severity: 'high',
      suggestion: '[이메일 삭제됨]',
    });
  }

  // Korean phone numbers
  const phoneRegex = /(\+82\s?)?0\d{1,2}[-\s.]?\d{3,4}[-\s.]?\d{4}/g;
  while ((match = phoneRegex.exec(text)) !== null) {
    detections.push({
      type: 'phone',
      text: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      severity: 'high',
      suggestion: '[전화번호 삭제됨]',
    });
  }

  // Resident registration number
  const rrnRegex = /\b\d{6}[-\s]?\d{7}\b/g;
  while ((match = rrnRegex.exec(text)) !== null) {
    detections.push({
      type: 'rrn',
      text: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      severity: 'high',
      suggestion: '[주민번호 삭제됨]',
    });
  }

  // Korean name + title patterns
  const nameRegex = /([가-힣]{2,4})\s*(씨|님|대리|과장|부장|팀장|대표|사원|선임|주임|이사|본부장|실장)/g;
  while ((match = nameRegex.exec(text)) !== null) {
    detections.push({
      type: 'name',
      text: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      severity: 'medium',
      suggestion: '[이름 삭제됨]',
    });
  }

  // Bank account numbers
  const accountRegex = /\b\d{2,4}[-\s]?\d{2,4}[-\s]?\d{4,8}\b/g;
  while ((match = accountRegex.exec(text)) !== null) {
    const digits = match[0].replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 16) {
      detections.push({
        type: 'account',
        text: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        severity: 'high',
        suggestion: '[계좌번호 삭제됨]',
      });
    }
  }

  return detections;
}

/**
 * LLM-based deep PII analysis (more accurate, requires API call)
 */
export async function deepPIIAnalysis(text: string): Promise<PIIAnalysisResult> {
  const client = getClient();

  const systemPrompt = `당신은 개인정보(PII) 탐지 전문 시스템입니다.
주어진 텍스트에서 개인정보를 찾아 JSON 형식으로 반환하세요.

탐지 대상:
- name: 실명 (한국어/영어)
- phone: 전화번호
- email: 이메일 주소
- rrn: 주민등록번호
- address: 상세 주소 (동/호수 포함)
- account: 은행 계좌번호
- other: 기타 식별 가능한 정보

응답 형식:
{
  "detections": [
    {
      "type": "name|phone|email|rrn|address|account|other",
      "text": "원본 텍스트",
      "severity": "high|medium|low",
      "suggestion": "마스킹된 대체 텍스트"
    }
  ]
}

주의사항:
- 직급/직책만 있는 경우(예: "팀장이 말했다")는 PII가 아님
- 일반적인 회사명은 PII가 아님
- 문맥상 특정인 식별이 불가능하면 low severity`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `다음 텍스트에서 개인정보를 분석하세요:\n\n${text}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from AI');
    }

    const parsed = JSON.parse(content);
    const detections: PIIDetection[] = (parsed.detections || []).map((d: any) => {
      const startIndex = text.indexOf(d.text);
      return {
        type: d.type || 'other',
        text: d.text,
        startIndex: startIndex >= 0 ? startIndex : 0,
        endIndex: startIndex >= 0 ? startIndex + d.text.length : d.text.length,
        severity: d.severity || 'medium',
        suggestion: d.suggestion || '[삭제됨]',
      };
    });

    // Generate masked text
    let maskedText = text;
    const sortedDetections = [...detections].sort((a, b) => b.startIndex - a.startIndex);
    for (const detection of sortedDetections) {
      if (detection.startIndex >= 0) {
        maskedText =
          maskedText.slice(0, detection.startIndex) +
          detection.suggestion +
          maskedText.slice(detection.endIndex);
      }
    }

    const highCount = detections.filter(d => d.severity === 'high').length;
    const riskLevel: PIIAnalysisResult['riskLevel'] =
      highCount >= 2 ? 'danger' : highCount === 1 || detections.length >= 3 ? 'caution' : 'safe';

    return {
      hasPII: detections.length > 0,
      detections,
      maskedText,
      riskLevel,
    };
  } catch (error) {
    console.error('Deep PII analysis failed:', error);
    // Fallback to quick check
    const quickDetections = quickPIICheck(text);
    let maskedText = text;
    const sorted = [...quickDetections].sort((a, b) => b.startIndex - a.startIndex);
    for (const d of sorted) {
      maskedText = maskedText.slice(0, d.startIndex) + d.suggestion + maskedText.slice(d.endIndex);
    }
    return {
      hasPII: quickDetections.length > 0,
      detections: quickDetections,
      maskedText,
      riskLevel: quickDetections.some(d => d.severity === 'high') ? 'caution' : 'safe',
    };
  }
}

/**
 * Auto-mask text using quick regex detection
 */
export function autoMaskPII(text: string): string {
  const detections = quickPIICheck(text);
  let masked = text;
  const sorted = [...detections].sort((a, b) => b.startIndex - a.startIndex);
  for (const d of sorted) {
    masked = masked.slice(0, d.startIndex) + d.suggestion + masked.slice(d.endIndex);
  }
  return masked;
}
