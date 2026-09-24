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

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
      throw {
        message: data.message || `Chat endpoint failed (${response.status})`,
        retryable: data.error !== 'DAILY_LIMIT_REACHED'
      };
    }

    return { reply: data.reply || getFallbackAssistantResponse(message, lang) };
  } catch (error) {
    console.error('Chat request failed:', error);
    return {
      error: error.message || getLocalizedAssistantText('assistant.error', lang),
      retryable: Boolean(error.retryable)
    };
  }
}

function initChatAssistant() {
  const assistantForm = document.getElementById('assistantForm');
  const assistantInput = document.getElementById('assistantInput');
  const assistantToggle = document.getElementById('assistantToggle');
  const assistantPanel = document.getElementById('assistantPanel');
  const assistantClose = document.getElementById('assistantClose');
  const assistantSend = document.getElementById('assistantSend');
  const assistantStatus = document.getElementById('assistantStatus');
  const assistantRetry = document.getElementById('assistantRetry');

  if (!assistantForm || !assistantInput || !assistantToggle || !assistantPanel) return;

  let isRequestPending = false;
  let lastSubmittedMessage = '';

  const setStatus = (text = '', visible = false) => {
    if (!assistantStatus) return;
    assistantStatus.textContent = text;
    assistantStatus.hidden = !visible;
  };

  const setBusy = (busy) => {
    isRequestPending = busy;
    assistantInput.disabled = busy;
    if (assistantSend) assistantSend.disabled = busy;
  };

  const sendMessage = async (value, showUserMessage = true) => {
    if (isRequestPending || !value) return;
    lastSubmittedMessage = value;
    if (showUserMessage) addChatMessage(value, 'user');
    assistantInput.value = '';
    setBusy(true);
    setStatus(getLocalizedAssistantText('assistant.thinking'), true);
    if (assistantRetry) assistantRetry.hidden = true;

    const result = await fetchAssistantReply(value);
    setBusy(false);
    setStatus('', false);

    if (result.reply) {
      addChatMessage(result.reply, 'bot');
      return;
    }

    addChatMessage(result.error || getLocalizedAssistantText('assistant.error'), 'bot');
    if (assistantRetry) assistantRetry.hidden = !result.retryable;
  };

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
    await sendMessage(value);
  });

  if (assistantRetry) {
    assistantRetry.addEventListener('click', () => sendMessage(lastSubmittedMessage, false));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initChatAssistant();
  syncAssistantLanguage();
});

document.addEventListener('waraq-language-changed', syncAssistantLanguage);
