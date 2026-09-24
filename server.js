const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const publicDir = path.join(__dirname, 'public');

// -----------------------------------------
// Middleware
// -----------------------------------------
app.use(express.json({ limit: '1mb' }));

// Serve all static website files from /public
app.use(express.static(publicDir));

// -----------------------------------------
// AI Chat API
// -----------------------------------------
app.post('/api/chat', async (req, res) => {
  try {
    const { message, locale = 'ar' } = req.body || {};
    const userMessage = String(message || '').trim();

    if (!userMessage) {
      return res.status(400).json({
        error: 'Message is required.'
      });
    }

    const systemPrompt = `أنت "مساعد وَرِيقة"، المساعد الرسمي لموقع وتطبيق "وَرِيقة — قصاصات وكلمات".

هويتك:
أنت مساعد دافئ، بسيط، إبداعي، ومختص بتجربة وَرِيقة والذكريات الرقمية والـScrapbook.

مهمتك هي مساعدة الزائر فقط في المواضيع المتعلقة بـ:
1. التعريف بتطبيق وَرِيقة.
2. شرح مميزات وَرِيقة الموجودة أو المعلنة رسميًا.
3. القوالب القابلة للتعديل.
4. القصاصات الورقية والزخارف.
5. صور Polaroid.
6. Washi Tape.
7. الخطوط والطباعة العربية.
8. تصميم صفحات وذكريات Scrapbook.
9. تصدير التصاميم.
10. Widgets الخاصة بتطبيق وَرِيقة.
11. اقتراح أفكار لاستخدام وَرِيقة مثل: ذكريات السفر، الرسائل، الصور العائلية، اليوميات، الاقتباسات، الأشعار، اللحظات المهمة.

قواعد اللغة:
- إذا تحدث المستخدم بالعربية، أجب بالعربية.
- إذا تحدث بالفارسية، أجب بالفارسية.
- إذا تحدث بالإنجليزية، أجب بالإنجليزية.
- إذا كانت اللغة غير واضحة، استخدم العربية.

قواعد الدقة:
لا تخترع أبدًا معلومات غير موجودة في بيانات وَرِيقة الرسمية.
إذا لم تكن المعلومة معلنة، قل:
"لم يتم الإعلان عن هذه التفاصيل رسميًا بعد."

إذا كانت ميزة ضمن الخطة المستقبلية وليست متاحة بعد، وضّح أنها:
"ميزة مخطط لها / قادمة لاحقًا."

نطاق المساعدة:
إذا سأل المستخدم سؤالًا خارج نطاق تطبيق وَرِيقة أو الـScrapbooking أو حفظ الذكريات، لا تجب عن السؤال نفسه.
وجه الحوار بلطف إلى وَرِيقة.

أسلوب الرد:
- ودود.
- قصير نسبيًا.
- واضح.
- غير رسمي بشكل مبالغ فيه.
- لا تدّعي أن ميزة جاهزة وهي لا تزال قيد التطوير.
- استخدم الرموز التعبيرية باعتدال.

عند السؤال "ما هي وَرِيقة؟":
اشرح أنها تطبيق Scrapbook رقمي عربي بالدرجة الأولى يسمح للمستخدم بصناعة ذكريات وتصاميم جميلة باستخدام النصوص والصور والقوالب والقصاصات والعناصر الورقية.

عند السؤال عن موعد الإطلاق:
إذا لم يوجد تاريخ محدد، قل:
"وَرِيقة ما زالت قيد التطوير، وسيتم الإعلان عن موعد الإطلاق عندما يتم تحديده رسميًا."`;

    const languageInstruction =
      locale === 'en'
        ? 'Reply only in English.'
        : locale === 'fa'
          ? 'فقط به زبان فارسی پاسخ بده.'
          : 'أجب باللغة العربية فقط.';

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('GEMINI_API_KEY is missing.');

      return res.status(500).json({
        error: 'AI is not configured on the server.'
      });
    }

    const model = 'gemini-3.8-flash';

    const geminiRequest = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: `${systemPrompt}\n\n${languageInstruction}` }]
        },
        contents: [{ parts: [{ text: userMessage }] }]
      })
    };

    let geminiResponse;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        geminiRequest
      );

      if (geminiResponse.status !== 503 || attempt === 1) break;
      await new Promise((resolve) => setTimeout(resolve, 700));
    }

    const rawResponse = await geminiResponse.text();

    let data = null;

    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = null;
    }

    if (!geminiResponse.ok) {
      console.error(
        'Gemini API error:',
        geminiResponse.status,
        rawResponse
      );

      return res.status(502).json({
        error: 'Gemini API request failed.'
      });
    }

    const reply = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || '')
      .join('')
      .trim();

    if (!reply) {
      console.error(
        'Gemini returned an empty response:',
        rawResponse
      );

      return res.status(502).json({
        error: 'Gemini returned an empty response.'
      });
    }

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error('Chat API error:', error);

    return res.status(500).json({
      error: 'Internal server error.'
    });
  }
});

// -----------------------------------------
// Health check
// -----------------------------------------
app.get('/api/health', (req, res) => {
  res.status(200).json({
    ok: true,
    message: 'Wariqa API is running'
  });
});

// -----------------------------------------
// SPA fallback
// -----------------------------------------
// IMPORTANT:
// API routes are defined above this.
// Unknown website routes receive public/index.html.
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// -----------------------------------------
// Start server
// -----------------------------------------
app.listen(port, () => {
  console.log(`Wariqa app running at http://localhost:${port}`);
});