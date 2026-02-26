import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface FoodAnalysis {
  name: string;
  weight: string;
  calories: number;
  healthRating: number; // 1-10
  isHealthy: boolean;
  summary: string;
  nutrients: {
    protein: string;
    carbs: string;
    fats: string;
  };
  alternatives: string[];
}

export async function analyzeFoodImage(base64Image: string): Promise<FoodAnalysis> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `حلل صورة الطعام هذه وقدم تفصيلاً غذائياً دقيقاً باللغة العربية.
  1. قدر وزن الطعام الموضح.
  2. حدد ما إذا كان صحياً أم لا.
  3. قدم تقييماً صحياً من 1 إلى 10.
  4. اقترح بدائل صحية إذا كان الطعام غير صحي.
  5. قدم نبذة مختصرة ومفيدة عن الوجبة وفوائدها أو أضرارها.
  يجب أن تكون الإجابة بتنسيق JSON فقط باللغة العربية.`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(",")[1],
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          weight: { type: Type.STRING },
          calories: { type: Type.NUMBER },
          healthRating: { type: Type.NUMBER },
          isHealthy: { type: Type.BOOLEAN },
          summary: { type: Type.STRING },
          nutrients: {
            type: Type.OBJECT,
            properties: {
              protein: { type: Type.STRING },
              carbs: { type: Type.STRING },
              fats: { type: Type.STRING },
            },
            required: ["protein", "carbs", "fats"],
          },
          alternatives: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["name", "weight", "calories", "healthRating", "isHealthy", "summary", "nutrients", "alternatives"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}
