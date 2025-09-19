import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "" 
});

export interface EmailSummary {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  sentiment: string;
  sentimentScore: number;
  priority: string;
  category: string;
}

export interface GeneratedReply {
  subject: string;
  body: string;
  tone: string;
}

export async function summarizeEmail(emailContent: string, subject: string): Promise<EmailSummary> {
  try {
    const prompt = `Analyze this email and provide a structured summary.

Email Subject: ${subject}
Email Content: ${emailContent}

Please provide a JSON response with the following structure:
{
  "summary": "Brief 2-3 sentence summary",
  "keyPoints": ["Key point 1", "Key point 2", ...],
  "actionItems": ["Action item 1", "Action item 2", ...],
  "sentiment": "positive/negative/neutral",
  "sentimentScore": 1-5,
  "priority": "urgent/high/normal/low",
  "category": "work/personal/customer_service/marketing/sales/other"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            keyPoints: { 
              type: "array",
              items: { type: "string" }
            },
            actionItems: { 
              type: "array",
              items: { type: "string" }
            },
            sentiment: { type: "string" },
            sentimentScore: { type: "number" },
            priority: { type: "string" },
            category: { type: "string" }
          },
          required: ["summary", "keyPoints", "actionItems", "sentiment", "sentimentScore", "priority", "category"]
        }
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || "{}");
    return result as EmailSummary;
  } catch (error) {
    console.error("Error summarizing email:", error);
    throw new Error("Failed to summarize email");
  }
}

export async function generateReply(
  originalEmail: string,
  originalSubject: string,
  context: string,
  tone: string = "professional"
): Promise<GeneratedReply> {
  try {
    const prompt = `Generate a professional email reply based on the following:

Original Email Subject: ${originalSubject}
Original Email: ${originalEmail}
Context/Instructions: ${context}
Desired Tone: ${tone}

Please provide a JSON response with:
{
  "subject": "Reply subject (starting with 'Re: ' if appropriate)",
  "body": "Complete email body including greeting, main content, and closing",
  "tone": "The tone used in the response"
}

Make the reply contextually appropriate, ${tone}, and helpful.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            body: { type: "string" },
            tone: { type: "string" }
          },
          required: ["subject", "body", "tone"]
        }
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || "{}");
    return result as GeneratedReply;
  } catch (error) {
    console.error("Error generating reply:", error);
    throw new Error("Failed to generate reply");
  }
}

export async function improveEmailWriting(emailContent: string, targetTone: string): Promise<string> {
  try {
    const prompt = `Improve this email to make it more ${targetTone} while maintaining the original meaning:

${emailContent}

Return only the improved email content.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || emailContent;
  } catch (error) {
    console.error("Error improving email:", error);
    throw new Error("Failed to improve email");
  }
}

export async function categorizeEmails(emails: Array<{id: string, subject: string, body: string}>): Promise<Array<{id: string, category: string, priority: string}>> {
  try {
    const emailsData = emails.map(email => ({
      id: email.id,
      subject: email.subject,
      snippet: email.body.substring(0, 200)
    }));

    const prompt = `Categorize these emails by type and priority:

${JSON.stringify(emailsData, null, 2)}

Return JSON array with format:
[
  {
    "id": "email_id",
    "category": "work/personal/customer_service/marketing/sales/newsletter/other",
    "priority": "urgent/high/normal/low"
  }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json"
      },
      contents: prompt,
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error categorizing emails:", error);
    throw new Error("Failed to categorize emails");
  }
}
