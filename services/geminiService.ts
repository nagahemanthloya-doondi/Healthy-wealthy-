
import { GoogleGenAI, Type } from "@google/genai";
import { ProductAnalysis, WeeklyPlan } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Helper function to extract a JSON string from a response that might include markdown.
const extractJson = (text: string): string => {
  // Matches the content inside a ```json ... ``` block.
  const markdownMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    return markdownMatch[1];
  }

  // If no markdown block is found, find the first '{' and the last '}' to extract the JSON object.
  // This is a fallback for cases where the JSON is not in a markdown block but might have surrounding text.
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return text.substring(firstBrace, lastBrace + 1);
  }
  
  return text; // Return original text if no JSON object is found.
};


const fileToGenerativePart = (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error("Failed to read file as base64 string."));
      }
      const base64Data = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};


const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    productName: { type: Type.STRING },
    imageUrl: { type: Type.STRING },
    score: { type: Type.NUMBER, description: "Health score from 0 to 100, 100 is healthiest." },
    recommendation: { type: Type.STRING },
    organizedData: {
      type: Type.OBJECT,
      properties: {
        calories: { type: Type.STRING },
        fat: { type: Type.STRING },
        carbohydrates: { type: Type.STRING },
        sugar: { type: Type.STRING },
        protein: { type: Type.STRING },
        ingredients: { type: Type.STRING },
      },
      description: "Key nutritional facts. Values should be strings (e.g., '10g')."
    },
  },
  required: ["productName", "score", "recommendation", "organizedData"]
};

export const analyzeProductWithGemini = async (productData: any): Promise<ProductAnalysis> => {
    const prompt = `You are an expert food nutritionist. Based on the following data for a food product, provide a detailed analysis. The data is: ${JSON.stringify(productData)}. Your response must be a single JSON object adhering to the provided schema. 'productName' and 'imageUrl' should be extracted from the data.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: analysisSchema
        }
    });

    const result = JSON.parse(response.text);
    return {
        ...result,
        imageUrl: productData.image_url || result.imageUrl || 'https://picsum.photos/300/200'
    };
};

export const findAndAnalyzeWithGoogleSearch = async (barcode: string): Promise<ProductAnalysis> => {
    const prompt = `Using Google Search, find nutritional information for the food product with barcode: ${barcode}. After finding the data, act as an expert food nutritionist. Your response must be a single JSON object with the following structure: { "productName": "...", "score": ..., "recommendation": "...", "organizedData": { "calories": "...", "fat": "...", "carbohydrates": "...", "sugar": "...", "protein": "...", "ingredients": "..." } }. The score should be a health score from 0 to 100, where 100 is healthiest. The organizedData values should be strings (e.g., '10g').`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources = groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web)
      .filter(Boolean) || [];

    const jsonText = extractJson(response.text);
    const result = JSON.parse(jsonText);
    return { ...result, sources, imageUrl: result.imageUrl || 'https://picsum.photos/300/200' };
};

export const analyzeImageWithGemini = async (imageFile: File): Promise<ProductAnalysis> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const textPart = {
        text: `From the provided image of a food product, identify the product. Then, use this identification to search for its nutritional information using Google Search. After finding the data, act as an expert food nutritionist. Your response must be a single JSON object with the following structure: { "productName": "...", "score": ..., "recommendation": "...", "organizedData": { "calories": "...", "fat": "...", "carbohydrates": "...", "sugar": "...", "protein": "...", "ingredients": "..." } }. The score should be a health score from 0 to 100, where 100 is healthiest. The organizedData values should be strings (e.g., '10g').`
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources = groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web)
      .filter(Boolean) || [];

    const jsonText = extractJson(response.text);
    const result = JSON.parse(jsonText);
    return { ...result, sources, imageUrl: result.imageUrl || URL.createObjectURL(imageFile) };
};

const mealSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        recipe: { type: Type.STRING, description: "A brief recipe or preparation steps." },
        nutrition: {
            type: Type.OBJECT,
            properties: {
                calories: { type: Type.STRING },
                protein: { type: Type.STRING },
                fat: { type: Type.STRING },
                carbohydrates: { type: Type.STRING },
            },
            required: ["calories", "protein", "fat", "carbohydrates"]
        },
    },
    required: ["name", "recipe", "nutrition"]
};

const weeklyPlanSchema = {
    type: Type.OBJECT,
    properties: {
        weeklyPlan: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.STRING },
                    meals: {
                        type: Type.OBJECT,
                        properties: {
                            breakfast: mealSchema,
                            lunch: mealSchema,
                            dinner: mealSchema,
                        },
                        required: ["breakfast", "lunch", "dinner"]
                    },
                },
                required: ["day", "meals"]
            }
        },
        shoppingList: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    item: { type: Type.STRING },
                    quantity: { type: Type.STRING },
                    category: { type: Type.STRING, description: "e.g., Produce, Dairy, Protein, Pantry" },
                },
                required: ["item", "quantity", "category"]
            }
        }
    },
    required: ["weeklyPlan", "shoppingList"]
};

export const generateMealPlanWithGemini = async (
    scannedHistory: ProductAnalysis[],
    healthGoals: string,
    favoriteFoods: string,
    dietaryRestrictions: string
): Promise<WeeklyPlan> => {

    const historyPrompt = scannedHistory.length > 0
        ? `The user has recently scanned these items, which can indicate their preferences: ${scannedHistory.map(p => p.productName).join(', ')}.`
        : 'The user has not scanned any items yet.';

    const prompt = `
        You are an expert nutritionist and meal planner. Create a balanced and healthy 7-day meal plan based on the user's preferences.

        User's Health Goals: "${healthGoals}"
        User's Favorite Foods: "${favoriteFoods}"
        User's Dietary Restrictions/Preferences: "${dietaryRestrictions}"
        ${historyPrompt}

        Your task is to generate a complete 7-day meal plan (Breakfast, Lunch, Dinner) and a corresponding shopping list.
        - The meal plan should be varied and aligned with the user's goals.
        - Provide simple recipe ideas for each meal.
        - Estimate nutritional information for each meal.
        - The shopping list should be categorized and include quantities.
        
        Your response must be a single JSON object that adheres to the provided schema.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: weeklyPlanSchema,
        }
    });

    return JSON.parse(response.text);
};
