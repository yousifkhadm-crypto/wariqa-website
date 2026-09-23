const CHAT_ENDPOINT = '/api/chat';
function getLocalizedAssistantText(key, lang = document.documentElement.lang || 'ar') {
  return translations[lang]?.[key] || translations.ar[key] || '';
}

function syncAssistantLanguage() {
  const lang = document.documentElement.lang || 'ar';
  const input = document.getElementById('assistantInput');
  if (input) {
    input.placeholder = getLocalizedAssistantText('assistant.placeholder', lang);
  }

  document.querySelectorAll('.suggestion').forEach((button, index) => {
    const suggestions = translations[lang]?.assistantSuggestions || translations.ar.assistantSuggestions || [];
    if (suggestions[index]) {
      button.textContent = suggestions[index];
      button.dataset.suggestion = suggestions[index];
    }
  });

  const firstBotMessage = document.querySelector('#chatHistory .message.bot p');
  if (firstBotMessage) {
    firstBotMessage.textContent = getLocalizedAssistantText('assistant.greeting', lang);
  }
}

function addChatMessage(text, sender = 'bot') {
  const chatHistory = document.getElementById('chatHistory');
  if (!chatHistory) return;

  const message = document.createElement('div');
  message.className = `message ${sender}`;

  const textNode = document.createElement('p');
  textNode.textContent = text;
  message.appendChild(textNode);

  chatHistory.appendChild(message);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function getFallbackAssistantResponse(message, lang = 'ar') {
  const normalized = (message || '').trim().toLowerCase();
  const defaultMessage = getLocalizedAssistantText('assistant.default', lang);

  if (!normalized) return defaultMessage;

  const unrelated = ['politics', 'math', 'weather', 'sport', 'news', 'game'];
  if (unrelated.some((value) => normalized.includes(value))) {
    return translations[lang]?.['assistant.default'] || defaultMessage;
  }

  if (normalized.includes('launch') || normalized.includes('إطلاق') || normalized.includes('release')) {
    return translations[lang]?.['assistant.noInfo'] || 'لم يتم الإعلان عن هذه التفاصيل رسميًا بعد.';
  }

  if (normalized.includes('widget') || normalized.includes('ويجت') || normalized.includes('widgets')) {
    return lang === 'en'
      ? 'Widget support is a planned future feature and not officially announced yet.'
      : lang === 'fa'
        ? 'پشتیبانی از ویجت یک قابلیت آینده است و هنوز به‌صورت رسمی اعلام نشده.'
        : 'دعم الـ Widget هو خيار مخطط له لاحقًا ولم يتم الإعلان عنه رسميًا بعد.';
  }

  if (normalized.includes('template') || normalized.includes('قالب') || normalized.includes('template')) {
    return lang === 'en'
      ? 'Wariqa is designed around editable memory templates, paper textures, and scrapbook layouts with a warm Arabic-first identity.'
      : lang === 'fa'
        ? 'ورقه حول قالب‌های قابل ویرایش، بافت‌های کاغذی و چیدمان‌های اسکریپ‌بوک با هویت عربی و گرم ساخته شده است.'
        : 'تُصمَّم وَرِيقة حول قوالب قابلة للتعديل، نسيج ورقي، وتصاميم scrapbook ذات هوية عربية دافئة.';
  }

  return defaultMessage;
}

async function fetchAssistantReply(message) {
  const lang = document.documentElement.lang || 'ar';
  try {
    const response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        locale: lang
      })
    });

    if (!response.ok) {
      throw new Error('Chat endpoint failed');
    }

    const data = await response.json();
    return data.reply || getFallbackAssistantResponse(message, lang);
  } catch (error) {
    return getFallbackAssistantResponse(message, lang);
  }
}

function initChatAssistant() {
  const assistantForm = document.getElementById('assistantForm');
  const assistantInput = document.getElementById('assistantInput');
  const assistantToggle = document.getElementById('assistantToggle');
  const assistantPanel = document.getElementById('assistantPanel');
  const assistantClose = document.getElementById('assistantClose');

  if (!assistantForm || !assistantInput || !assistantToggle || !assistantPanel) return;

  const openPanel = () => {
    assistantPanel.hidden = false;
    assistantToggle.setAttribute('aria-expanded', 'true');
  };

  const closePanel = () => {
    assistantPanel.hidden = true;
    assistantToggle.setAttribute('aria-expanded', 'false');
  };

  assistantToggle.addEventListener('click', () => {
    assistantPanel.hidden ? openPanel() : closePanel();
  });

  if (assistantClose) {
    assistantClose.addEventListener('click', closePanel);
  }

  document.querySelectorAll('.suggestion').forEach((button) => {
    button.addEventListener('click', () => {
      assistantInput.value = button.dataset.suggestion || '';
      openPanel();
      assistantInput.focus();
    });
  });

  assistantForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const value = assistantInput.value.trim();
    if (!value) return;

    addChatMessage(value, 'user');
    assistantInput.value = '';

    const reply = await fetchAssistantReply(value);
    addChatMessage(reply, 'bot');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initChatAssistant();
  syncAssistantLanguage();
});

document.addEventListener('waraq-language-changed', syncAssistantLanguage);
