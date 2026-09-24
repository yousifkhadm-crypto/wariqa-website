const {
  getUserUsage,
  isWithinDailyLimit,
  incrementUserUsage,
  decrementUserUsage
} = require('./usage');

const TRANSIENT_GEMINI_STATUSES = new Set([429, 502, 503, 504]);
const RETRY_DELAYS_MS = [1000, 2000];

module.exports = async function handler(request, response) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  let usage = null;

  try {
    // -----------------------------------------
    // 1. Read request data
    // -----------------------------------------
    const { message, locale = 'ar' } = request.body || {};
    const userMessage = String(message || '').trim();

    if (!userMessage) {
      return response.status(400).json({
        success: false,
        error: 'Message is required.'
      });
    }

    // -----------------------------------------
    // 2. Wariqa system prompt
    // -----------------------------------------
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
- إذا تحدث المستخدم بالفارسية، أجب بالفارسية.
- إذا تحدث المستخدم بالإنجليزية، أجب بالإنجليزية.
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

    // -----------------------------------------
    // 3. Language instruction
    // -----------------------------------------
    const languageInstruction =
      locale === 'en'
        ? 'Reply only in English.'
        : locale === 'fa'
          ? 'فقط به زبان فارسی پاسخ بده.'
          : 'أجب باللغة العربية فقط.';

    // -----------------------------------------
    // 4. Read Gemini API key
    // -----------------------------------------
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error(
        'GEMINI_API_KEY is missing from server environment.'
      );

      return response.status(500).json({
        success: false,
        error: 'AI is not configured on the server.'
      });
    }

    usage = getUserUsage(request, response);
    if (!isWithinDailyLimit(usage)) {
      const message = usage.plan === 'premium'
        ? 'وصلت إلى حد رسائل وريقة Premium اليوم ✨ حاول مرة أخرى غدًا.'
        : 'وصلت إلى حد رسائل وريقة اليوم 🌿 يمكنك العودة غدًا ومتابعة حديثك مع مساعد وريقة.';

      return response.status(429).json({
        success: false,
        error: 'DAILY_LIMIT_REACHED',
        message,
        usage: usage.usage,
        limit: usage.limit
      });
    }

    // Reserve the slot before the external request to prevent concurrent overuse.
    incrementUserUsage(usage);

    // -----------------------------------------
    // 5. Gemini model
    // -----------------------------------------
    // Use the current Gemini model directly.
    // Do not use GEMINI_MODEL from Vercel environment.
    const model = 'gemini-3.8-flash';

    // -----------------------------------------
    // 6. Send request to Gemini
    // -----------------------------------------
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
    for (let attempt = 0; attempt < 3; attempt += 1) {
      geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        geminiRequest
      );

      if (!TRANSIENT_GEMINI_STATUSES.has(geminiResponse.status) || attempt === 2) break;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
    }

    // -----------------------------------------
    // 7. Read Gemini response
    // -----------------------------------------
    const rawResponse = await geminiResponse.text();

    let data = null;

    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = null;
    }

    // -----------------------------------------
    // 8. Handle Gemini API errors
    // -----------------------------------------
    if (!geminiResponse.ok) {
      console.error(
        'Gemini API error:',
        geminiResponse.status,
        rawResponse
      );

      decrementUserUsage(usage);

      if (TRANSIENT_GEMINI_STATUSES.has(geminiResponse.status)) {
        return response.status(503).json({
          success: false,
          error: 'AI_TEMPORARILY_UNAVAILABLE',
          message: 'يبدو أن وريقة تحتاج لحظة هدوء... حاول مرة أخرى بعد قليل ✨'
        });
      }

      return response.status(502).json({
        success: false,
        error: 'Gemini API request failed.',
        message: 'تعذر إكمال الطلب الآن. حاول مرة أخرى بعد قليل.',
        geminiStatus: geminiResponse.status
      });
    }

    // -----------------------------------------
    // 9. Extract AI response
    // -----------------------------------------
    const reply = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || '')
      .join('')
      .trim();

    // -----------------------------------------
    // 10. Handle empty Gemini response
    // -----------------------------------------
    if (!reply) {
      console.error(
        'Gemini returned an empty response:',
        rawResponse
      );

      decrementUserUsage(usage);

      return response.status(502).json({
        success: false,
        error: 'Gemini returned an empty response.',
        message: 'لم تصل إجابة كاملة من وريقة. حاول مرة أخرى.'
      });
    }

    // -----------------------------------------
    // 11. Return successful response
    // -----------------------------------------
    return response.status(200).json({
      success: true,
      reply,
      usage: usage.usage + 1,
      limit: usage.limit
    });

  } catch (error) {
    // -----------------------------------------
    // 12. Unexpected server error
    // -----------------------------------------
    console.error('Chat API error:', error);

    if (usage) decrementUserUsage(usage);

    return response.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'حدث خطأ غير متوقع. حاول مرة أخرى.'
    });
  }
}