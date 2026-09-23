const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname)));

app.post('/api/chat', async (req, res) => {
  try {
    const { message, locale = 'ar' } = req.body || {};
    const userMessage = String(message || '').trim();

    if (!userMessage) {
      return res.status(400).json({ error: 'Message is required.' });
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
إذا لم تكن المعلومة معلنة، قل: "لم يتم الإعلان عن هذه التفاصيل رسميًا بعد."
إذا كانت ميزة ضمن الخطة المستقبلية وليست متاحة بعد، وضّح أنها: "ميزة مخطط لها / قادمة لاحقًا."

نطاق المساعدة:
إذا سأل المستخدم سؤالًا خارج نطاق تطبيق وَرِيقة أو الـScrapbooking أو حفظ الذكريات، لا تجب عن السؤال نفسه. وجه الحوار بلطف إلى وَرِيقة.

أسلوب الرد:
- ودود.
- قصير نسبيًا.
- واضح.
- غير رسمي بشكل مبالغ فيه.
- لا تدّعي أن ميزة جاهزة وهي لا تزال قيد التطوير.
- استخدم الرموز التعبيرية باعتدال.

عند السؤال "ما هي وَرِيقة؟" اشرح أنها تطبيق Scrapbook رقمي عربي بالدرجة الأولى يسمح للمستخدم بصناعة ذكريات وتصاميم جميلة باستخدام النصوص والصور والقوالب والقصاصات والعناصر الورقية.

عند السؤال عن موعد الإطلاق: إذا لم يوجد تاريخ محدد، قل: "وَرِيقة ما زالت قيد التطوير، وسيتم الإعلان عن موعد الإطلاق عندما يتم تحديده رسميًا."`;

    const languageInstruction = locale === 'en'
      ? 'Reply only in English.'
      : locale === 'fa'
        ? 'فقط به زبان فارسی پاسخ بده.'
        : 'أجب باللغة العربية فقط.';

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        reply: locale === 'en'
          ? 'I can help with Wariqa, memory ideas, scrapbook prompts, and creative inspiration. Launch details were not announced yet.'
          : locale === 'fa'
            ? 'من می‌توانم در مورد ورقه، ایده‌های خاطره‌نگاری و اسکریپ‌بوک به شما کمک کنم. جزئیات عرضه هنوز رسمی اعلام نشده است.'
            : 'أستطيع مساعدتك في وَرِيقة وأفكار الـScrapbook والذكريات. لم يتم الإعلان عن تفاصيل الإطلاق رسميًا بعد.'
      });
    }

    const model = 'gemini-3.6-flash';
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        systemInstruction: {
          parts: [{ text: `${systemPrompt}\n\n${languageInstruction}` }]
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      return res.status(200).json({
        reply: `حدث خطأ في الاتصال بـ Gemini. التفاصيل الفنية: ${errorText.slice(0, 200)}`
      });
    }

    const json = await geminiResponse.json();
    const reply = json?.candidates?.[0]?.content?.parts?.[0]?.text || 'لم يتم الإعلان عن هذه التفاصيل رسميًا بعد.';

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(200).json({
      reply: 'حدث خطأ أثناء معالجة السؤال. الرجاء المحاولة مرة أخرى أو طرح سؤال مختلف.'
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Wariqa API is running' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Wariqa app running at http://localhost:${port}`);
});
