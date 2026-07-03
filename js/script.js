/* ============================================================
   Своя Кухня — пиклбол-клуб · script.js
   Меню, табы локаций, FAQ-аккордеон, видео, модалка записи
   Vanilla JS, без зависимостей
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Telegram: КУДА ПРИХОДЯТ ЗАЯВКИ ----------
     1) Создайте бота у @BotFather → получите ТОКЕН.
     2) Узнайте CHAT_ID (свой — через @userinfobot, либо id группы/канала).
     Вставьте оба значения ниже. Пока не заполнено — форма просто
     показывает «Спасибо», ничего не отправляя.                        */
  var TG_BOT_TOKEN = 'ВСТАВЬТЕ_ТОКЕН_БОТА';
  var TG_CHAT_ID   = 'ВСТАВЬТЕ_CHAT_ID';

  function fieldLabel(name){
    var m={name:'Имя',phone:'Телефон',branch:'Филиал',format:'Формат',date:'Дата',guests:'Гостей',contact:'Контакт'};
    return m[name]||name;
  }
  function sendToTelegram(data){
    var lines=Object.keys(data).filter(function(k){return data[k];})
      .map(function(k){return '<b>'+k+':</b> '+String(data[k]);});
    var text='🎾 <b>Новая заявка — Своя Кухня</b>\n\n'+lines.join('\n');
    if(!TG_BOT_TOKEN || TG_BOT_TOKEN.indexOf('ВСТАВЬТЕ')===0 || TG_CHAT_ID.indexOf('ВСТАВЬТЕ')===0){
      console.warn('[Telegram] не настроен: укажите TG_BOT_TOKEN и TG_CHAT_ID в js/script.js');
      return Promise.resolve(false);
    }
    return fetch('https://api.telegram.org/bot'+TG_BOT_TOKEN+'/sendMessage',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({chat_id:TG_CHAT_ID,text:text,parse_mode:'HTML'})
    }).then(function(r){return r.ok;}).catch(function(){return false;});
  }

  /* ---------- Mobile menu ---------- */
  var hamburger = document.getElementById('hamburger');
  var mobileNav = document.getElementById('mobileNav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('is-open');
      hamburger.classList.toggle('is-open', open);
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileNav.classList.remove('is-open');
        hamburger.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Location tabs ---------- */
  var tabs = document.querySelectorAll('.tab');
  var panels = document.querySelectorAll('.tab-panel');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var id = tab.getAttribute('data-tab');
      tabs.forEach(function (t) { t.classList.toggle('is-active', t === tab); });
      panels.forEach(function (p) {
        var match = p.getAttribute('data-panel') === id;
        p.classList.toggle('is-active', match);
        p.hidden = !match;
      });
    });
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.faq-item');
      var alreadyOpen = item.classList.contains('is-open');
      document.querySelectorAll('.faq-item').forEach(function (i) { i.classList.remove('is-open'); });
      if (!alreadyOpen) item.classList.add('is-open');
    });
  });

  /* ---------- Embedded video (демо-плеер) ---------- */
  var videoPlay = document.getElementById('videoPlay');
  var videoPlaying = document.getElementById('videoPlaying');
  var videoPoster = document.querySelector('.video-poster');
  var videoNote = document.querySelector('.video-note');
  var videoPause = document.getElementById('videoPause');
  function setVideo(playing) {
    if (videoPlaying) videoPlaying.hidden = !playing;
    if (videoPlay) videoPlay.style.display = playing ? 'none' : '';
    if (videoPoster) videoPoster.style.display = playing ? 'none' : '';
    if (videoNote) videoNote.style.display = playing ? 'none' : '';
  }
  if (videoPlay) videoPlay.addEventListener('click', function () { setVideo(true); });
  if (videoPause) videoPause.addEventListener('click', function () { setVideo(false); });

  /* ---------- Booking / party modal ---------- */
  var modal = document.getElementById('modal');
  var modalClose = document.getElementById('modalClose');
  var modalTitle = document.getElementById('modalTitle');
  var modalKicker = document.getElementById('modalKicker');
  var modalPrice = document.getElementById('modalPrice');
  var modalFormWrap = document.getElementById('modalFormWrap');
  var modalSuccess = document.getElementById('modalSuccess');
  var bookForm = document.getElementById('bookForm');
  var bookFields = bookForm ? bookForm.querySelector('[data-fields="book"]') : null;
  var partyFields = bookForm ? bookForm.querySelector('[data-fields="party"]') : null;

  function setRequired(container, on) {
    if (!container) return;
    container.querySelectorAll('input,select').forEach(function (el) {
      if (on) {
        if (el.dataset.req === '1') el.required = true;
      } else {
        if (el.required) el.dataset.req = '1';
        el.required = false;
      }
    });
  }
  // mark originally-required fields once
  if (bookForm) {
    bookForm.querySelectorAll('input[required],select[required]').forEach(function (el) { el.dataset.req = '1'; });
  }

  function openModal(opts) {
    opts = opts || {};
    var isParty = opts.type === 'party';
    modalKicker.textContent = isParty ? 'ПРАЗДНИК' : 'ЗАПИСЬ';
    modalTitle.textContent = opts.title || (isParty ? 'Ваш праздник в клубе' : 'Бесплатное пробное занятие');
    if (opts.price) {
      modalPrice.textContent = opts.price;
      modalPrice.hidden = false;
    } else {
      modalPrice.hidden = true;
    }
    if (bookFields) { bookFields.hidden = isParty; setRequired(bookFields, !isParty); }
    if (partyFields) { partyFields.hidden = !isParty; setRequired(partyFields, isParty); }
    modalFormWrap.hidden = false;
    modalSuccess.hidden = true;
    if (bookForm) bookForm.reset();
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-book]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openModal({ type: 'book', title: btn.getAttribute('data-book'), price: btn.getAttribute('data-price') });
    });
  });
  document.querySelectorAll('[data-party]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openModal({ type: 'party' });
    });
  });

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal && !modal.hidden) closeModal(); });

  if (bookForm) {
    bookForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var isParty = partyFields && !partyFields.hidden;
      var active = isParty ? partyFields : bookFields;
      var data = {};
      data['Тип'] = isParty ? 'Праздник' : 'Запись';
      data['Заявка'] = modalTitle.textContent;
      if (modalPrice && !modalPrice.hidden) data['Тариф'] = modalPrice.textContent;
      if (active) active.querySelectorAll('input,select').forEach(function (el) {
        if (el.value) data[fieldLabel(el.name)] = el.value;
      });
      var btn = bookForm.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      sendToTelegram(data).then(function () {
        if (btn) btn.disabled = false;
        modalFormWrap.hidden = true;
        modalSuccess.hidden = false;
      });
    });
  }
  var successClose = document.getElementById('successClose');
  if (successClose) successClose.addEventListener('click', closeModal);

  /* ---------- Final CTA form ---------- */
  var ctaForm = document.getElementById('ctaForm');
  var ctaSuccess = document.getElementById('ctaSuccess');
  if (ctaForm) {
    ctaForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = { 'Заявка': 'Быстрая запись (форма внизу страницы)' };
      ctaForm.querySelectorAll('input,select').forEach(function (el) {
        if (el.value) data[fieldLabel(el.name)] = el.value;
      });
      var btn = ctaForm.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      sendToTelegram(data).then(function () {
        ctaForm.hidden = true;
        if (ctaSuccess) ctaSuccess.hidden = false;
      });
    });
  }

  /* ---------- Кнопка «наверх» ---------- */
  var toTop = document.getElementById('toTop');
  if (toTop) {
    var toggleTop = function () { toTop.classList.toggle('is-visible', window.scrollY > 500); };
    window.addEventListener('scroll', toggleTop, { passive: true });
    toggleTop();
    toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }
})();
