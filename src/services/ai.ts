import { GoogleGenAI } from "@google/genai";
import { AIModel } from "../store";

const geminiAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const PROMPT_TEMPLATE = (text: string, context?: string) => `
你是一个阅读助手。请根据以下选中的文本进行解读：

选中文本：
"${text}"

${context ? `上下文信息：\n${context}` : ''}

请提供：
1. 简洁明了的解释（适合阅读理解能力较弱的用户）。
2. 如果有难词，请解释难词。
3. 如果是段落，请总结核心大意。

请使用 Markdown 格式回复。
`;

async function callOpenAICompatible(apiKey: string, baseUrl: string, model: string, prompt: string) {
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error(`Error calling ${model}:`, error);
    throw error;
  }
}

export const explainText = async (text: string, modelType: AIModel, apiKey?: string, context?: string) => {
  const prompt = PROMPT_TEMPLATE(text, context);

  try {
    switch (modelType) {
      case 'gemini':
        const geminiClient = apiKey ? new GoogleGenAI({ apiKey }) : geminiAI;
        const response = await geminiClient.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
        });
        return response.text;

      case 'deepseek':
        return await callOpenAICompatible(
          apiKey || process.env.DEEPSEEK_API_KEY || '',
          'https://api.deepseek.com/v1',
          'deepseek-chat',
          prompt
        );

      case 'openai':
        return await callOpenAICompatible(
          apiKey || process.env.OPENAI_API_KEY || '',
          'https://api.openai.com/v1',
          'gpt-4o-mini',
          prompt
        );

      case 'minimax':
        return await callOpenAICompatible(
          apiKey || process.env.MINIMAX_API_KEY || '',
          'https://api.minimax.chat/v1',
          'abab6.5-chat',
          prompt
        );

      default:
        return "不支持的模型类型";
    }
  } catch (error) {
    console.error("AI Error:", error);
    return `抱歉，使用 ${modelType} 解读时出现错误。请检查 API Key 是否配置正确。`;
  }
};

export const summarizeChapter = async (text: string, modelType: AIModel) => {
  const prompt = `
    请对以下章节内容进行简要总结，帮助读者快速理解核心内容：
    
    内容：
    "${text.substring(0, 10000)}"
    
    请使用 Markdown 格式回复。
  `;

  try {
    if (modelType === 'gemini') {
      const response = await geminiAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return response.text;
    }
    // Fallback to gemini for summary if others not configured for simplicity in this demo
    // or implement similar switch as explainText
    return "摘要功能目前主要支持 Gemini 模型。";
  } catch (error) {
    console.error("AI Error:", error);
    return "抱歉，生成摘要出现错误。";
  }
};
