
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Google GenAI SDK with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * 기업 취업규칙 내 괴롭힘 방지 조항 생성 (gemini-3-flash-preview)
 */
export const generateEmploymentRule = async (companyName: string) => {
  const prompt = `주식회사 "${companyName}"를 위한 최신 노동법 기준 직장 내 괴롭힘 방지 조항을 생성하라.
  반드시 포함할 내용:
  1. 괴롭힘의 정의 (최신 판례 반영)
  2. 금지되는 구체적 행위 양태 (폭언, 업무배제, 모욕 등)
  3. 신고 접수 및 조사 절차 (피해자 보호 조치 의무 포함)
  4. 가해자 징계 규정 및 재발 방지 대책
  5. CEO의 면책을 위한 관리 감독 의무 명시
  
  형식: 전문적인 한국어 마크다운. 기업 취업규칙에 바로 붙여넣을 수 있는 법률 문서 형태.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Rule Generation Error:", error);
    return "법령 데이터를 분석하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
};

/**
 * 사건 데이터 기반 AI 노무사 전략 자문 (gemini-3-pro-preview)
 * 복합적인 추론과 법적 조언이 필요하므로 Thinking Config를 적용합니다.
 */
export const getLegalAdvice = async (reportContent: string) => {
  const prompt = `너는 20년 경력의 베테랑 노무사이자 리스크 관리 전문가다. 
  다음 접수된 직장 내 괴롭힘 제보 내용을 분석하여 경영진을 위한 방어 전략과 조치 가이드를 작성하라.
  
  [사건 본문]
  "${reportContent}"
  
  [분석 요청 사항]
  1. 법적 위험도 평가 (Low/Medium/High/Critical) 및 근거
  2. 즉각 수행해야 할 필수 조치 (분리 조치, 조사 개시 통보 등)
  3. 향후 분쟁(노동위원회 등) 발생 시 회사가 확보해야 할 면책 증빙 체크리스트
  4. 인사팀 및 대표이사를 위한 법률적 주의사항
  
  형식: 체계적인 한국어 마크다운. 전문적이고 권위 있는 어조 사용.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Advice Error:", error);
    return "AI 법률 엔진 분석에 실패했습니다. 긴급 자문이 필요한 경우 담당 노무사에게 직접 연락하세요.";
  }
};

/**
 * 사건 심각도 및 카테고리 자동 분류 (JSON 스키마 적용)
 */
export const triageReport = async (reportContent: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `다음 제보 내용을 분석하여 심각도와 카테고리를 분류하라: "${reportContent}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priority: {
              type: Type.STRING,
              description: "ONE OF: LOW, MEDIUM, HIGH, CRITICAL",
            },
            reason: {
              type: Type.STRING,
              description: "이 분류를 결정한 법률적/실무적 이유 (한국어)",
            },
            category: {
              type: Type.STRING,
              description: "Category: Verbal Abuse, Sexual Harassment, Power Abuse, Retaliation, or General Complaint",
            }
          },
          required: ["priority", "reason", "category"],
        },
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Triage Error:", error);
    return null;
  }
};
