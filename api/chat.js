export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, locale = 'ar' } = request.body || {};
    const userMessage = String(message || '').trim();

    if (!userMessage) {
      return response.status(400).json({ error: 'Message is required.' });
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
      const fallback = locale === 'en'
        ? 'I can help with Wariqa, memories, scrapbook ideas, and creative prompts. The exact launch details have not been officially announced yet.'
        : locale === 'fa'
          ? 'من می‌توانم در مورد ورقه، خاطرات و ایده‌های اسکریپ‌بوک به شما کمک کنم. جزئیات دقیق عرضه هنوز به‌صورت رسمی اعلام نشده است.'
          : 'أستطيع مساعدتك في وَرِيقة وأفكار الـScrapbook والذكريات. لم يتم الإعلان عن تفاصيل الإطلاق رسميًا بعد.';
      return response.status(200).json({ reply: fallback });
    }

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
      throw new Error('Gemini request failed');
    }

    const json = await geminiResponse.json();
    const reply = json?.candidates?.[0]?.content?.parts?.[0]?.text || 'لم يتم الإعلان عن هذه التفاصيل رسميًا بعد.';

    return response.status(200).json({ reply });
  } catch (error) {
    return response.status(200).json({
      reply: 'أنا هنا لمساعدتك في كل ما يتعلق بتطبيق «وَرِيقة» وصناعة الذكريات الجميلة 📜✨ هل تحب أن أعرّفك على مميزات وَرِيقة أو أعطيك فكرة لتصميم ذكرى؟'
    });
  }
}
