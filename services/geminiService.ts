
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Google GenAI SDK with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateEmploymentRule = async (companyName: string) => {
  const prompt = `Create a robust, modern workplace harassment (직장 내 괴롭힘) prevention clause for the company rules of "${companyName}". 
  The rules should comply with the latest South Korean Labor Standards Act. 
  Focus on legal defense for the CEO and safety for the employee. 
  Include specific procedures for investigation and disciplinary action.
  Provide the output in professional Korean Markdown format.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return "법령 데이터를 불러오는 중 오류가 발생했습니다.";
  }
};

export const getLegalAdvice = async (reportContent: string) => {
  const prompt = `As a senior labor attorney, analyze the following harassment report and provide:
  1. Risk Assessment (Low/Medium/High/Critical)
  2. Immediate recommended actions (인사 조치, 분리 조치 등) for the employer to ensure legal immunity.
  3. Evidence checklist for the defense pack.
  Report: "${reportContent}"
  Output in professional Korean using Markdown.`;

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
    return "AI 분석을 수행할 수 없습니다.";
  }
};

export const triageReport = async (reportContent: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following workplace report for harassment risk and severity. 
      Report: "${reportContent}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priority: {
              type: Type.STRING,
              description: "One of: LOW, MEDIUM, HIGH, CRITICAL",
            },
            reason: {
              type: Type.STRING,
              description: "Brief explanation of the triage decision in Korean.",
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
