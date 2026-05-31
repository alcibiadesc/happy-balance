/* happy-balance demo — vanilla JS, no dependencies.
 * Implements the interactive "Tinder mode" with two card types:
 *  - categorize: a transaction + suggested category (Accept / Skip)
 *  - reimbursement: a shared-expense link suggestion (Link / Skip)
 * Drag via Pointer Events + button actions both trigger the same swipe.
 */
(function () {
  'use strict';

  /* ---------- Placeholder data ---------- */
  var euro = function (n) {
    var s = Math.abs(n).toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return s + ' €';
  };

  var categorizeCards = [
    { merchant: 'Mercadona', amount: -64.2, date: '28 may 2025', emoji: '🛒', category: 'Groceries', catEmoji: '🛒' },
    { merchant: 'Netflix', amount: -13.99, date: '26 may 2025', emoji: '🎬', category: 'Subscriptions', catEmoji: '📺' },
    { merchant: 'Starbucks', amount: -4.85, date: '25 may 2025', emoji: '☕', category: 'Coffee & Snacks', catEmoji: '☕' },
    { merchant: 'Repsol', amount: -58.4, date: '23 may 2025', emoji: '⛽', category: 'Transport', catEmoji: '🚗' },
    { merchant: 'Nómina Northius', amount: 2150.0, date: '01 may 2025', emoji: '💼', category: 'Salary', catEmoji: '💰' },
  ];

  var reimbursementCards = [
    {
      income: { merchant: 'Isabel González Matos', desc: 'Lo que me debes de Mercadona', amount: 72.25, date: '29 may 2025' },
      expense: { merchant: 'MERCADONA SANTIDAD', desc: 'Compra semanal', amount: -144.51, date: '28 may 2025' },
      split: 50,
      reasons: ['Importe ≈ 50% del gasto', 'Concepto menciona "Mercadona"', '1 día de diferencia'],
    },
    {
      income: { merchant: 'Isa', desc: 'Cena del sábado 🍽️', amount: 31.5, date: '24 may 2025' },
      expense: { merchant: 'LA TAGLIATELLA', desc: 'Restaurante', amount: -63.0, date: '24 may 2025' },
      split: 50,
      reasons: ['Importe exacto 50%', 'Mismo día', 'Patrón recurrente con Isa'],
    },
  ];

  /* ---------- Card rendering ---------- */
  function categorizeCardHTML(c) {
    return (
      '<div class="card-body">' +
        '<span class="card-tag">✨ Smart categorize</span>' +
        '<div class="tc-merchant-row">' +
          '<div class="tc-emoji">' + c.emoji + '</div>' +
          '<div>' +
            '<div class="tc-merchant">' + c.merchant + '</div>' +
            '<div class="tc-date">' + c.date + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="tc-amount ' + (c.amount < 0 ? 'neg' : 'pos') + ' mono">' +
          (c.amount < 0 ? '-' : '+') + euro(c.amount) +
        '</div>' +
        '<div class="tc-suggest">' +
          '<div class="lbl">Suggested category</div>' +
          '<div class="cat">' + c.catEmoji + ' ' + c.category + '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function reimbursementCardHTML(c) {
    var reasons = c.reasons
      .slice(0, 3)
      .map(function (r) { return '<span class="reason-chip">' + r + '</span>'; })
      .join('');
    return (
      '<div class="card-body">' +
        '<span class="card-tag">🔗 Shared expense</span>' +
        '<div class="leg">' +
          '<div class="leg-top">' +
            '<span class="leg-merchant">' + c.income.merchant + '</span>' +
            '<span class="leg-amount income mono">+' + euro(c.income.amount) + '</span>' +
          '</div>' +
          '<span class="leg-desc">' + c.income.desc + '</span>' +
          '<span class="leg-date">' + c.income.date + '</span>' +
        '</div>' +
        '<div class="link-row">' +
          '<div class="link-line"></div>' +
          '<div class="link-badge">⇄ ' + c.split + '% / ' + (100 - c.split) + '%</div>' +
          '<div class="link-line"></div>' +
        '</div>' +
        '<div class="leg">' +
          '<div class="leg-top">' +
            '<span class="leg-merchant">' + c.expense.merchant + '</span>' +
            '<span class="leg-amount expense mono">-' + euro(c.expense.amount) + '</span>' +
          '</div>' +
          '<span class="leg-desc">' + c.expense.desc + '</span>' +
          '<span class="leg-date">' + c.expense.date + '</span>' +
        '</div>' +
        '<div class="reasons">' + reasons + '</div>' +
      '</div>'
    );
  }

  /* ---------- Tinder engine ---------- */
  function TinderDeck(opts) {
    this.stage = opts.stage;
    this.progressEl = opts.progressEl;
    this.cards = opts.cards;
    this.renderCard = opts.renderCard;
    this.acceptLabel = opts.acceptLabel;
    this.rejectLabel = opts.rejectLabel;
    this.acceptCaption = opts.acceptCaption;
    this.skipCaption = opts.skipCaption;

    this.index = 0;
    this.dragX = 0;
    this.dragging = false;
    this.startX = 0;
    this.pointerId = null;
    this.cardEl = null;
    this.threshold = 100;

    this.render();
  }

  TinderDeck.prototype.updateProgress = function () {
    if (!this.progressEl) return;
    if (this.index >= this.cards.length) {
      this.progressEl.textContent = 'All done';
    } else {
      this.progressEl.textContent = (this.index + 1) + ' of ' + this.cards.length;
    }
  };

  TinderDeck.prototype.doneHTML = function () {
    return (
      '<div class="tinder-done card">' +
        '<div class="big">🎉</div>' +
        '<h3>All caught up!</h3>' +
        '<p>You reviewed every suggestion. In the real app this trains the smart categorizer.</p>' +
        '<button class="btn btn-primary" data-restart>Replay demo</button>' +
      '</div>'
    );
  };

  TinderDeck.prototype.render = function () {
    var self = this;
    this.updateProgress();

    if (this.index >= this.cards.length) {
      this.stage.innerHTML = this.doneHTML();
      var restart = this.stage.querySelector('[data-restart]');
      if (restart) {
        restart.addEventListener('click', function () {
          self.index = 0;
          self.render();
        });
      }
      this.setActionsEnabled(false);
      return;
    }

    var card = document.createElement('div');
    card.className = 'tinder-card';
    card.innerHTML =
      '<div class="swipe-overlay accept" data-accept-overlay style="opacity:0;display:none;">' +
        '<span class="overlay-label">' + this.acceptLabel + '</span>' +
      '</div>' +
      '<div class="swipe-overlay reject" data-reject-overlay style="opacity:0;display:none;">' +
        '<span class="overlay-label">' + this.rejectLabel + '</span>' +
      '</div>' +
      this.renderCard(this.cards[this.index]);

    this.stage.innerHTML = '';
    this.stage.appendChild(card);
    this.cardEl = card;
    this.acceptOverlay = card.querySelector('[data-accept-overlay]');
    this.rejectOverlay = card.querySelector('[data-reject-overlay]');

    this.dragX = 0;
    this.dragging = false;
    this.setActionsEnabled(true);
    this.attachPointer(card);
  };

  TinderDeck.prototype.applyTransform = function (animating) {
    if (!this.cardEl) return;
    var x = this.dragX;
    var rotateZ = this.dragging ? x * 0.04 : 0;
    var scale = this.dragging ? 1.02 : 1;
    this.cardEl.classList.toggle('animating', !!animating);
    this.cardEl.classList.toggle('dragging', this.dragging);
    this.cardEl.style.transform =
      'translateX(' + x + 'px) rotateZ(' + rotateZ + 'deg) scale(' + scale + ')';

    var accept = Math.max(0, Math.min(1, x / 120));
    var reject = Math.max(0, Math.min(1, -x / 120));
    if (this.acceptOverlay) {
      this.acceptOverlay.style.display = accept > 0.05 ? 'flex' : 'none';
      this.acceptOverlay.style.opacity = accept;
    }
    if (this.rejectOverlay) {
      this.rejectOverlay.style.display = reject > 0.05 ? 'flex' : 'none';
      this.rejectOverlay.style.opacity = reject;
    }
  };

  TinderDeck.prototype.attachPointer = function (card) {
    var self = this;
    card.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      self.dragging = true;
      self.startX = e.clientX;
      self.dragX = 0;
      self.pointerId = e.pointerId;
      try { card.setPointerCapture(e.pointerId); } catch (err) {}
      self.applyTransform(false);
    });
    card.addEventListener('pointermove', function (e) {
      if (!self.dragging || e.pointerId !== self.pointerId) return;
      self.dragX = e.clientX - self.startX;
      self.applyTransform(false);
    });
    var end = function (e) {
      if (!self.dragging || e.pointerId !== self.pointerId) return;
      self.dragging = false;
      try { card.releasePointerCapture(self.pointerId); } catch (err) {}
      self.pointerId = null;
      if (self.dragX > self.threshold) {
        self.swipe(1);
      } else if (self.dragX < -self.threshold) {
        self.swipe(-1);
      } else {
        self.dragX = 0;
        self.applyTransform(true); // spring back
      }
    };
    card.addEventListener('pointerup', end);
    card.addEventListener('pointercancel', function (e) {
      if (e.pointerId !== self.pointerId) return;
      self.dragging = false;
      self.pointerId = null;
      self.dragX = 0;
      self.applyTransform(true);
    });
  };

  // direction: 1 = right (accept), -1 = left (reject/skip)
  TinderDeck.prototype.swipe = function (direction) {
    if (!this.cardEl || this.index >= this.cards.length) return;
    var self = this;
    var card = this.cardEl;
    this.dragging = false;
    var flyX = direction * (window.innerWidth || 800);
    card.classList.add('animating');
    card.classList.remove('dragging');
    card.style.transform =
      'translateX(' + flyX + 'px) rotateZ(' + direction * 18 + 'deg)';
    card.style.opacity = '0';
    this.setActionsEnabled(false);

    var advanced = false;
    var advance = function () {
      if (advanced) return;
      advanced = true;
      self.index += 1;
      self.render();
    };
    card.addEventListener('transitionend', advance, { once: true });
    // Fallback in case transitionend doesn't fire.
    setTimeout(advance, 450);
  };

  TinderDeck.prototype.setActions = function (acceptBtn, skipBtn) {
    // Buttons are shared across decks; only keep references here. The click
    // listeners are bound once in bootstrap and always target the live deck.
    this.acceptBtn = acceptBtn;
    this.skipBtn = skipBtn;
  };

  TinderDeck.prototype.setActionsEnabled = function (on) {
    if (this.acceptBtn) this.acceptBtn.disabled = !on;
    if (this.skipBtn) this.skipBtn.disabled = !on;
  };

  /* ---------- Bootstrap ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var stage = document.getElementById('tinder-stage');
    var progress = document.getElementById('tinder-progress');
    var acceptBtn = document.getElementById('act-accept');
    var skipBtn = document.getElementById('act-skip');
    var acceptCap = document.getElementById('cap-accept');
    var skipCap = document.getElementById('cap-skip');
    var tabCat = document.getElementById('tab-categorize');
    var tabReimb = document.getElementById('tab-reimbursement');

    if (!stage) return;

    var deck = null;

    function buildDeck(mode) {
      if (mode === 'reimbursement') {
        deck = new TinderDeck({
          stage: stage,
          progressEl: progress,
          cards: reimbursementCards,
          renderCard: reimbursementCardHTML,
          acceptLabel: 'Link',
          rejectLabel: 'Skip',
        });
        if (acceptCap) acceptCap.textContent = 'Link';
        if (skipCap) skipCap.textContent = 'Skip';
      } else {
        deck = new TinderDeck({
          stage: stage,
          progressEl: progress,
          cards: categorizeCards,
          renderCard: categorizeCardHTML,
          acceptLabel: 'Accept',
          rejectLabel: 'Skip',
        });
        if (acceptCap) acceptCap.textContent = 'Accept';
        if (skipCap) skipCap.textContent = 'Skip';
      }
      deck.setActions(acceptBtn, skipBtn);
      deck.setActionsEnabled(true);
    }

    function selectTab(mode) {
      if (tabCat) tabCat.classList.toggle('active', mode === 'categorize');
      if (tabReimb) tabReimb.classList.toggle('active', mode === 'reimbursement');
      buildDeck(mode);
    }

    // Bind the shared action buttons once; they always act on the live deck.
    if (acceptBtn) acceptBtn.addEventListener('click', function () { if (deck) deck.swipe(1); });
    if (skipBtn) skipBtn.addEventListener('click', function () { if (deck) deck.swipe(-1); });

    if (tabCat) tabCat.addEventListener('click', function () { selectTab('categorize'); });
    if (tabReimb) tabReimb.addEventListener('click', function () { selectTab('reimbursement'); });

    selectTab('categorize');
  });
})();
