const appState = {
  lang: (typeof localStorage !== 'undefined' && localStorage.getItem('waraq-language')) || 'ar'
};

function getCurrentLanguage() {
  return document.documentElement.lang || appState.lang || 'ar';
}

function setFormMessage(message, isError = false) {
  const messageNode = document.getElementById('formMessage');
  if (!messageNode) return;

  messageNode.textContent = message;
  messageNode.style.color = isError ? '#b94a48' : '#c06c54';
}

function validateWaitlistInput(value) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
  const phonePattern = /^\+?[0-9\s\-()]{8,}$/;
  return emailPattern.test(value) || phonePattern.test(value);
}

function initWaitlistForm() {
  const form = document.getElementById('waitlistForm');
  const input = document.getElementById('waitlistInput');
  if (!form || !input) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value.trim();

    if (!validateWaitlistInput(value)) {
      const lang = getCurrentLanguage();
      setFormMessage(
        lang === 'en'
          ? 'Please enter a valid email or phone number.'
          : lang === 'fa'
            ? 'لطفاً یک ایمیل یا شماره تلفن معتبر وارد کنید.'
            : 'يرجى إدخال بريد إلكتروني أو رقم هاتف صحيح.',
        true
      );
      return;
    }

    const payload = { emailOrPhone: value, language: getCurrentLanguage(), timestamp: new Date().toISOString() };
    try {
      localStorage.setItem('waraq-waitlist', JSON.stringify(payload));
    } catch (error) {
      // Ignore storage issues in restricted environments.
    }

    const lang = getCurrentLanguage();
    setFormMessage(
      lang === 'en'
        ? 'You are on the list. We will be in touch soon.'
        : lang === 'fa'
          ? 'شما در لیست قرار گرفتید. بزودی با شما تماس می‌گیریم.'
          : 'أنت الآن في القائمة. سنتواصل معك قريباً.'
    );
    form.reset();
  });
}

function initIdeasForm() {
  const ideasForm = document.getElementById('ideasForm');
  const ideasMessage = document.getElementById('ideasMessage');
  if (!ideasForm || !ideasMessage) return;

  ideasForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('ideaName')?.value.trim() || 'زائر وَرِيقة';
    const message = document.getElementById('ideaMessage')?.value.trim();
    const lang = document.documentElement.lang || 'ar';

    if (!message) {
      ideasMessage.textContent = lang === 'en'
        ? 'Please write your idea first.'
        : lang === 'fa'
          ? 'لطفاً ابتدا ایده خود را بنویسید.'
          : 'يرجى كتابة فكرتك أولاً.';
      ideasMessage.style.color = '#b85f52';
      return;
    }

    const subject = `Wariqa idea from ${name}`;
    const body = `Name: ${name}\n\nIdea:\n${message}\n\nSent from wariqa.app`;
    try {
      localStorage.setItem('wariqa-idea', JSON.stringify({ name, message, timestamp: new Date().toISOString() }));
    } catch (error) {
      // Continue with the email handoff when storage is unavailable.
    }

    ideasMessage.textContent = lang === 'en'
      ? 'Your idea is ready to send. Thank you for helping shape Wariqa.'
      : lang === 'fa'
        ? 'ایده شما آماده ارسال است. برای ساخت ورقه بهتر متشکریم.'
        : 'فكرتك جاهزة للإرسال. شكرًا لمساعدتنا في بناء وَرِيقة.';
    ideasMessage.style.color = '#8B684A';
    window.location.href = `mailto:wriqa.app@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const button = item.querySelector('.faq-question');
    if (!button) return;

    button.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');
      faqItems.forEach((faq) => faq.classList.remove('active'));
      if (!isOpen) item.classList.add('active');
    });
  });
}

function syncPreferredLanguageSelect() {
  const select = document.getElementById('preferredLang');
  if (!select) return;

  const lang = getCurrentLanguage();
  if (['ar', 'fa', 'en'].includes(lang)) {
    select.value = lang;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initWaitlistForm();
  initFaqAccordion();
  syncPreferredLanguageSelect();
  initIdeasForm();

  document.addEventListener('waraq-language-changed', () => {
    syncPreferredLanguageSelect();
  });
});
