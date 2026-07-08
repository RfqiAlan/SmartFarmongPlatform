import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the API with the key from environment variables
// Note: We use process.env to ensure the key is kept on the server
const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Gemini API key is not configured. Please add GEMINI_API_KEY to your .env.local file.' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // We use gemini-2.5-flash as it's fast, free, and excellent for chat
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: `Anda adalah Smart AWD AI, seorang asisten pertanian virtual cerdas untuk petani padi. 
Tugas utama Anda adalah membantu petani mengelola pengairan sawah berdasarkan data sensor IoT (Internet of Things) yang dipasang di lahan mereka.

Data sawah petani saat ini:
${context || 'Belum ada data sensor terbaru.'}

Panduan menjawab:
1. Selalu gunakan Bahasa Indonesia yang ramah, sopan, dan mudah dipahami oleh petani (jangan terlalu teknis).
2. Jika ditanya tentang kondisi sawah, rujuklah pada Data Sawah Saat Ini di atas.
3. Berikan saran praktis (misal: "Nyalakan pompa", "Biarkan saja karena besok akan hujan", "Buka saluran pembuangan").
4. Jawab dengan ringkas namun solutif (jangan membuat paragraf yang terlalu panjang).
5. Anda juga mengerti teknologi AWD (Alternate Wetting and Drying), yaitu teknik pengairan basah-kering berselang untuk menghemat air.` 
    });

    // Convert frontend messages to Gemini format
    // Gemini requires 'user' or 'model' roles, and STRICTLY requires the first message to be 'user'
    let filteredMessages = messages.slice(0, -1);
    
    // Remove the hardcoded welcome message from history if it's the first message
    if (filteredMessages.length > 0 && filteredMessages[0].role === 'model') {
      filteredMessages = filteredMessages.slice(1);
    }

    const history = filteredMessages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
    
    const latestMessage = messages[messages.length - 1].content;

    // Start a chat session
    const chat = model.startChat({
      history: history,
      generationConfig: {
        temperature: 0.7, // slightly creative but mostly grounded
        maxOutputTokens: 800,
      }
    });

    // Send the latest message
    const result = await chat.sendMessage(latestMessage);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ reply: text });
    
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while generating a response.' },
      { status: 500 }
    );
  }
}
