

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { EmailStatus, AiAnalysisResult, BulkDraft, Template, Attachment, Email, AppSettings } from '../types';
import { parseJsonWithFence } from "../utils/helpers";

const API_KEY = process.env.API_KEY;

// APIキーがない場合や初期化に失敗した場合でもアプリがクラッシュしないように、aiインスタンスを安全に初期化します。
let ai: GoogleGenAI | null = null;
if (API_KEY) {
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  } catch (error) {
    console.error("GoogleGenAI client initialization failed:", error);
    ai = null; // 初期化に失敗した場合は、aiをnullに設定します。
  }
} else {
  console.warn("API_KEY environment variable is not set. AI features will be disabled.");
}

const buildBaseSystemInstruction = (appSettings: AppSettings): string => {
    const knowledgeBaseString = appSettings.knowledgeBase && appSettings.knowledgeBase.length > 0
        ? `【ナレッジベース】\n以下の情報を最優先で参照し、質問に答える際に利用してください:\n${appSettings.knowledgeBase.map(item => `- ${item.key}: ${item.value}`).join('\n')}\n`
        : '';

    return `あなたは「${appSettings.officeName}」の非常に有能でプロフェッショナルなアシスタントです。
【あなたの振る舞い】
- コミュニケーションのトーンは「${appSettings.communicationStyle}」に設定されています。常にそのトーンを維持してください。
- 常に丁寧かつ明確に対応してください。

${knowledgeBaseString}
【イベント基本情報】
- イベント名: ${appSettings.eventName}
- 事務局名: ${appSettings.officeName}
- イベント概要: ${appSettings.eventSummary}
- 公式サイト: ${appSettings.websiteUrl}`;
};


export const analyzeEmail = async (email: Email): Promise<AiAnalysisResult | null> => {
  if (!ai) return null;

  const plainTextBody = email.body.replace(/<[^>]*>?/gm, ' ');
  const attachmentInfo = email.attachments && email.attachments.length > 0
    ? `添付ファイル: ${email.attachments.map(a => a.name).join(', ')}`
    : '添付ファイル: なし';

  const prompt = `
    あなたはイベント事務局の優秀なアシスタントです。
    以下のメールを分析し、指定されたJSON形式で結果を返してください。

    【分析対象のメール情報】
    件名: ${email.subject}
    本文:
    ---
    ${plainTextBody}
    ---
    ${attachmentInfo}

    【指示】
    1.  **status**: メールの状態を "${EmailStatus.NeedsReply}", "${EmailStatus.InfoReceived}", "${EmailStatus.Replied}", "${EmailStatus.Archived}" のいずれかで判断してください。
    2.  **tags**: メールの内容を要약する、1〜3個の短いキーワードを小文字で抽出してください。
    3.  **suggestedTasks**: メールから発生する、実行すべき具体的なタスクを注意深く抽出してください。
        - **最重要**: 依頼、指示、期限に関する記述（例：「〜をお願いします」「〜してください」「〜を提出してください」「明日中に」「〜日までにお願いします」）は**必ず**タスクとして抽出してください。
        - 誰が読んでも何をすべきか明確にわかるように、具体的かつ簡潔なタスク名を付けてください。
        - 添付ファイル名や件名も考慮して、タスクの内容を補完してください。
        - タスクが全くない場合のみ、空配列 \`[]\` を返してください。

    【出力フォーマット】
    {
      "status": "string",
      "tags": ["string"],
      "suggestedTasks": [{ "title": "string", "details": "string" }]
    }

    【例1】
    メール:
      件名: プレゼン資料について
      本文: こんにちは、佐藤です。プレゼン資料の提出期限はいつでしょうか？また、フォーマットの指定はありますか？
      添付ファイル: なし
    レスポンス:
    {
      "status": "要返信",
      "tags": ["プレゼン", "提出期限", "質問"],
      "suggestedTasks": [
        {
          "title": "佐藤様にプレゼン提出期限とフォーマットを返信する",
          "details": "プレゼンテーション資料の提出期限と、指定フォーマットの有無について回答する。"
        }
      ]
    }

    【例2】
    メール:
      件名: FW: 最終フロアプラン添付
      本文: チーム各位。添付にて、メイン展示ホールの最終フロアプランをご確認ください。明日中に全出展者へ配布をお願いします。
      添付ファイル: NT2024_FloorPlan_Final.pdf
    レスポンス:
    {
        "status": "情報受領",
        "tags": ["フロアプラン", "配布依頼", "確定"],
        "suggestedTasks": [
            {
                "title": "全出展者に最終フロアプランを配布する",
                "details": "添付の「NT2024_FloorPlan_Final.pdf」を、明日中に全出展者へメールで送付する。"
            }
        ]
    }
    
    【例3】
    メール:
        件名: ホテル予約確認
        本文: イベント事務局ご担当者様。お世話になっております。まだホテルの予約確認書を受け取っておりません。ご確認いただけますでしょうか。
        添付ファイル: なし
    レスポンス:
    {
        "status": "要返信",
        "tags": ["ホテル", "予約確認", "問い合わせ"],
        "suggestedTasks": [
            {
                "title": "ホテル予約状況を確認し、返信する",
                "details": "ホテルの予約状況を確認し、予約確認書について返信する。"
            }
        ]
    }
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            temperature: 0.1,
        }
    });
    
    const parsedData = parseJsonWithFence<AiAnalysisResult>(response.text);
    if (parsedData && Object.values(EmailStatus).includes(parsedData.status)) {
        return parsedData;
    }
    console.warn("AI分析が無効なデータを返しました", parsedData);
    return null;

  } catch (error) {
    console.error("Geminiでのメール分析中にエラーが発生しました:", error);
    return null;
  }
};

export const generateReplyDraft = async (originalEmail: string, prompt: string, recipientName: string, attachments: Attachment[] | undefined, appSettings: AppSettings): Promise<string | null> => {
    if (!ai) return "AI機能は現在利用できません。APIキーが設定されているか確認してください。";

    const baseInstruction = buildBaseSystemInstruction(appSettings);
    const systemInstruction = `${baseInstruction}
【役割】
これから「${recipientName}さん」からのメールに返信します。与えられた指示と元のメールの文脈に基づいて、適切な返信を作成してください。指示がない場合は、元のメールの内容から最も適切と思われる一般的な返信を生成してください。

【重要】
返信の最後には、必ず以下の署名をそのままの形で挿入してください。
---署名---
${appSettings.signature}
---署名終---`;
    
    let attachmentInfo = '';
    if (attachments && attachments.length > 0) {
        attachmentInfo = '\n\nこちらのメールには以下のファイルが添付されています:\n' + attachments.map(a => `- ${a.name}`).join('\n');
    }
    
    const plainTextOriginalEmail = originalEmail.replace(/<[^>]*>?/gm, ' ');

    const userPrompt = `
${prompt.trim() ? `指示: "${prompt}"\n\n` : ''}元のメール:
---
${plainTextOriginalEmail}
---
${attachmentInfo}

この情報に基づいて、返信を作成してください。`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.6,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Geminiでの返信ドラフト生成中にエラーが発生しました:", error);
        return "申し訳ありませんが、現在ドラフトを生成できませんでした。";
    }
};

export const generateBulkDraft = async (prompt: string, appSettings: AppSettings): Promise<BulkDraft | null> => {
    if (!ai) return null;

    const baseInstruction = buildBaseSystemInstruction(appSettings);
    const systemInstruction = `${baseInstruction}
【役割】
一括送信用のプロフェッショナルなメールの下書きを作成してください。
レスポンスは、「subject」（文字列）と「body」（文字列）の2つのキーを持つJSONオブジェクトでなければなりません。
本文では、各受信者宛にメールをパーソナライズするために、プレースホルダー「{{name}}」を使用してください。
【重要】
- 件名にはイベント名を必ず含めてください。
- 本文の最後には共通署名を必ず含めてください。`;

    const userPrompt = `以下の目的に合ったメールの下書きを作成してください: ${prompt}`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
            },
        });

        const parsedData = parseJsonWithFence<BulkDraft>(response.text);
        return parsedData;
    } catch (error) {
        console.error("Geminiでの一括ドラフト生成中にエラーが発生しました:", error);
        return null;
    }
};

export const generateTemplateDraft = async (prompt: string, appSettings: AppSettings): Promise<Pick<Template, 'title' | 'body' | 'tags'> | null> => {
    if (!ai) return null;

    const baseInstruction = buildBaseSystemInstruction(appSettings);
    const systemInstruction = `${baseInstruction}
【役割】
ユーザーの指示に基づき、ビジネス用の再利用可能なメールテンプレートを作成してください。
レスポンスは、「title」（文字列、テンプレートのタイトル）、「body」（文字列、テンプレートの本文）、「tags」（文字列の配列、関連する1〜3個の短いキーワード）の3つのキーを持つJSONオブジェクトでなければなりません。
本文では、受信者の名前を挿入するためのプレースホルダーとして「{{name}}」を使用してください。`;
    
    const userPrompt = `以下の指示に合ったメールテンプレートを作成してください: "${prompt}"`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
            },
        });

        const parsedData = parseJsonWithFence<Pick<Template, 'title' | 'body' | 'tags'>>(response.text);
        return parsedData;

    } catch (error) {
        console.error("Geminiでのテンプレートドラフト生成中にエラーが発生しました:", error);
        return null;
    }
};

export const generateTagsForTemplate = async (title: string, body: string): Promise<string[] | null> => {
    if (!ai) return null;

    const systemInstruction = `ユーザーが提供するメールテンプレートのタイトルと本文に基づいて、関連性の高いキーワードタグを1〜3個生成してください。
レスポンスは、「tags」（文字列の配列）という単一のキーを持つJSONオブジェクトでなければなりません。タグは短く、小文字にしてください。`;
    
    const plainTextBody = body.replace(/<[^>]*>?/gm, ' ');

    const userPrompt = `
タイトル: ${title}
本文:
---
${plainTextBody}
---
`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
            },
        });

        const parsedData = parseJsonWithFence<{ tags: string[] }>(response.text);
        return parsedData?.tags || null;

    } catch (error) {
        console.error("Geminiでのタグ生成中にエラーが発生しました:", error);
        return null;
    }
};

export const searchEmailsWithAi = async (query: string, emails: Email[]): Promise<string[] | null> => {
    if (!ai) return null;

    const systemInstruction = `You are an intelligent email search assistant.
    Analyze the user's query and the provided list of emails.
    The emails are in a JSON array format. Each email has an 'id', 'subject', 'sender', and 'body'.
    Your task is to identify the emails that are most relevant to the user's query.
    You MUST return a JSON object with a single key "emailIds", which is an array of strings representing the IDs of the relevant emails.
    If no emails are relevant, return an empty array.
    Return ONLY the JSON object.`;

    const plainTextEmails = emails.map(e => ({
        id: e.id,
        subject: e.subject,
        sender: e.sender.name,
        body: e.body.replace(/<[^>]*>?/gm, ' ').substring(0, 500) // snippet of plain text body
    }));

    const userPrompt = `
    User Query: "${query}"

    Emails:
    ---
    ${JSON.stringify(plainTextEmails, null, 2)}
    ---
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                temperature: 0.1,
            },
        });
        
        const parsedData = parseJsonWithFence<{ emailIds: string[] }>(response.text);
        
        if (parsedData && Array.isArray(parsedData.emailIds)) {
            // Validate that returned IDs actually exist in the original list to prevent hallucinations
            const emailIdSet = new Set(emails.map(e => e.id));
            const validIds = parsedData.emailIds.filter(id => emailIdSet.has(id));
            return validIds;
        }

        console.warn("AI search returned invalid data", parsedData);
        return null;

    } catch (error) {
        console.error("GeminiでのAI検索中にエラーが発生しました:", error);
        return null;
    }
};
