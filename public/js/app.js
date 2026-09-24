document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    mainNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const yearNode = document.getElementById('year');
  if (yearNode) {
    yearNode.textContent = new Date().getFullYear();
  }

  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const question = item.querySelector('.faq-question');
    if (!question) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');
      faqItems.forEach((faq) => faq.classList.remove('active'));
      if (!isOpen) item.classList.add('active');
    });
  });

  const waitlistForm = document.getElementById('waitlistForm');
  const waitlistInput = document.getElementById('waitlistInput');
  const formMessage = document.getElementById('formMessage');

  if (waitlistForm && waitlistInput) {
    waitlistForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = waitlistInput.value.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      const isPhone = /^\+?[0-9\s\-()]{8,}$/.test(value);

      if (!isEmail && !isPhone) {
        formMessage.textContent = document.documentElement.lang === 'en'
          ? 'Please enter a valid email or phone number.'
          : document.documentElement.lang === 'fa'
            ? 'لطفاً یک ایمیل یا شماره تلفن معتبر وارد کنید.'
            : 'يرجى إدخال بريد إلكتروني أو رقم هاتف صحيح.';
        formMessage.style.color = '#b85f52';
        return;
      }

      const payload = {
        emailOrPhone: value,
        preferredLanguage: document.getElementById('preferredLang')?.value || document.documentElement.lang,
        timestamp: new Date().toISOString()
      };

      try {
        localStorage.setItem('waraq-waitlist', JSON.stringify(payload));
      } catch (error) {
        // Ignore storage restrictions in some browsers.
      }

      formMessage.textContent = document.documentElement.lang === 'en'
        ? 'You have been added to the waitlist.'
        : document.documentElement.lang === 'fa'
          ? 'شما به لیست انتظار اضافه شدید.'
          : 'تمت إضافتك إلى قائمة الانتظار.';
      formMessage.style.color = '#8B684A';
      waitlistForm.reset();
    });
  }

  const roadmap = document.getElementById('roadmapList');
  if (roadmap) {
    const roadmapSteps = [
      { phase: 'Concept & Design', ar: 'هوية المشروع وتصميم الفكرة', fa: 'هویت برند و طراحی ایده', en: 'Concept & design' },
      { phase: 'Core App Development', ar: 'تطوير التطبيق الأساسي', fa: 'توسعه اپلیکیشن اصلی', en: 'Core app development' },
      { phase: 'Template & Asset Library', ar: 'مكتبة القوالب والعناصر', fa: 'کتابخانه قالب‌ها و عناصر', en: 'Template and asset library' },
      { phase: 'Beta', ar: 'الإصدار التجريبي', fa: 'نسخه بتا', en: 'Beta test' },
      { phase: 'Version 1.0', ar: 'الإصدار 1.0', fa: 'نسخه 1.0', en: 'Version 1.0' },
      { phase: 'Future Expansion', ar: 'التوسع المستقبلي', fa: 'گسترش آینده', en: 'Future expansion' }
    ];

    const currentLang = document.documentElement.lang || 'ar';
    roadmap.innerHTML = roadmapSteps.map((item) => {
      const label = item[currentLang] || item.ar;
      return `
        <div class="roadmap-item">
          <div class="roadmap-phase">${item.phase}</div>
          <div class="roadmap-info">${label}</div>
        </div>
      `;
    }).join('');
  }
});
