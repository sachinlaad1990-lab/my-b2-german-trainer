/* Version 4.4: accessible touch swipe navigation.
 * Only deliberate horizontal gestures on non-interactive study areas activate
 * existing Previous/Next buttons. Vertical scroll and answer input remain intact.
 * Works in both main app and Article Trainer iframe (same source, separate DOM).
 */
(function () {
  'use strict';

  const rules = [
    { surface: '#wordList', prev: '#v4VocabPrev', next: '#v4VocabNext' },
    { surface: '#flashcards .panel.flash', prev: '#prevCard', next: '#nextCard', rate: { left: '#markDifficult', right: '#markLearned' } },
    { surface: '#verbTrainer .vt-card:not(.vt-mcq)', prev: '#vtPrev', next: '#vtNext', rate: { left: '#vtNeedPractice', right: '#vtSwipeLearned' } },
    { surface: '#bhWorkspace', prev: '#bhPrev', next: '#bhNext' },
    { surface: '#v4PhraseCard', prev: '#v4PhrasePrev', next: '#v4PhraseNext' },
    { surface: '#browse', prev: '#articlePrevDeck', next: '#articleNextDeck',
      enabled: () => document.getElementById('browseCluster')?.value === 'deck' },
    { surface: '#quizCard', prev: null, next: '#next',
      enabled: () => document.getElementById('quiz')?.classList.contains('active') }
  ];
  const excluded = 'input,textarea,select,button,a,summary,label,[contenteditable="true"],[role="button"],[role="slider"],[role="tab"],[data-no-swipe],.bh-table-scroll,.b2-table-scroll,.bh-table,.b2-reference-table,table,.article-memory,.lookup-results,pre,code';
  let start = null;
  let animating = false;
  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function snapBack(gesture) {
    const surface = gesture?.surface;
    if (!gesture?.rule.rate || !surface?.isConnected) return;
    surface.classList.remove('swipe-card-dragging');
    if (prefersReducedMotion()) {
      surface.style.removeProperty('transform');
      surface.style.removeProperty('opacity');
      return;
    }
    surface.style.transition = 'transform 190ms cubic-bezier(.2,.8,.3,1), opacity 190ms ease';
    surface.style.removeProperty('transform');
    surface.style.removeProperty('opacity');
    window.setTimeout(() => {
      if (surface.isConnected) surface.style.removeProperty('transition');
    }, 200);
  }


  function usableButton(selector) {
    if (!selector) return null;
    const button = document.querySelector(selector);
    if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true') return null;
    return button;
  }

  function visible(element) {
    if (!element || !element.isConnected || !element.getClientRects().length) return false;
    const view = element.closest('.view');
    if (view && (view.classList.contains('hidden') || (document.body.contains(document.getElementById('browse')) && !view.classList.contains('active') && !view.classList.contains('hidden')))) return false;
    return true;
  }

  function ruleAt(target) {
    if (!target || target.closest(excluded)) return null;
    for (const rule of rules) {
      const surface = target.closest(rule.surface);
      if (surface && visible(surface) && (!rule.enabled || rule.enabled())) {
        return { rule, surface };
      }
    }
    return null;
  }

  document.addEventListener('touchstart', event => {
    start = null;
    if (animating || event.touches.length !== 1) return;
    const touch = event.touches[0];
    // Respect iOS / Android system edge-navigation gestures.
    if (touch.clientX < 26 || touch.clientX > window.innerWidth - 26) return;
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    const matched = ruleAt(target);
    if (!matched) return;
    start = { x: touch.clientX, y: touch.clientY, time: Date.now(), ...matched };
  }, { passive: true });

  document.addEventListener('touchmove', event => {
    if (!start?.rule.rate || event.touches.length !== 1 || prefersReducedMotion()) return;
    const touch = event.touches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.35) return;
    const card = start.surface;
    if (!card.isConnected) return;
    card.classList.add('swipe-card-dragging');
    const distance = Math.max(-210, Math.min(210, dx * .78));
    const rotation = Math.max(-10, Math.min(10, dx * .042));
    card.style.transform = 'translate3d(' + distance + 'px,' + Math.min(35,Math.abs(dx)*.10) + 'px,0) rotate(' + rotation + 'deg)';
    card.style.opacity = String(Math.max(.75,1-Math.abs(dx)/850));
  }, { passive: true });

  document.addEventListener('touchcancel', () => {
    snapBack(start);
    start = null;
  }, { passive: true });

  document.addEventListener('touchend', event => {
    const gesture = start;
    start = null;
    if (!gesture || event.changedTouches.length !== 1) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - gesture.x;
    const dy = touch.clientY - gesture.y;

    // A swipe must be intentional, primarily horizontal, and quick.
    // Never cancel touch/scroll events; simply trigger existing navigation.
    if (Math.abs(dx) < 65 || Math.abs(dx) < Math.abs(dy) * 1.5 ||
        Date.now() - gesture.time > 1300 || !visible(gesture.surface)) {
      snapBack(gesture);
      return;
    }
    if (gesture.rule.enabled && !gesture.rule.enabled()) {
      snapBack(gesture);
      return;
    }

    const rating = gesture.rule.rate;
    const direction = dx < 0 ? 'left' : 'right';
    const button = usableButton(rating ? rating[direction] : (dx < 0 ? gesture.rule.next : gesture.rule.prev));
    // A mastered flashcard can still move on using right swipe.
    const masteredFlash = Boolean(rating && direction === 'right' && gesture.rule.surface.includes('flashcards') && !button);
    if (!button && !masteredFlash) { snapBack(gesture); return; }

    const announce = () => {
      const live = document.getElementById('swipeNavigationStatus');
      if (live) live.textContent = rating
        ? (direction === 'left' ? 'Needs practice. Next card.' : 'Good recall. Next card.')
        : (direction === 'left' ? 'Next item' : 'Previous item');
    };
    const navigate = () => {
      // Changing the card happens only after the old one flies away.
      document.documentElement.dataset.studySwipe = direction;
      if (button) button.click();
      if (rating && gesture.rule.surface.includes('flashcards')) {
        const next = usableButton(gesture.rule.next) || usableButton('#nextDeck');
        if (next) next.click();
      }
      announce();
      window.setTimeout(() => { delete document.documentElement.dataset.studySwipe; }, 330);
    };

    if (!rating || prefersReducedMotion()) {
      snapBack(gesture);
      navigate();
      return;
    }

    animating = true;
    const card = gesture.surface;
    card.classList.remove('swipe-card-dragging');
    card.style.removeProperty('transform');
    card.style.removeProperty('opacity');
    card.style.removeProperty('transition');
    const exitClass = direction === 'left' ? 'swipe-card-fall-left' : 'swipe-card-fall-right';
    card.classList.add(exitClass);
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      card.classList.remove(exitClass);
      navigate();
      animating = false;
    };
    card.addEventListener('animationend', event => {
      if (event.target === card) finish();
    }, { once: true });
    // Ensure learning never gets stuck if a browser suppresses animationend.
    window.setTimeout(finish, 390);
  }, { passive: true });

  // Avoid adding duplicate screen-reader announcers if this script is reloaded.
  if (!document.getElementById('swipeNavigationStatus')) {
    const announcer = document.createElement('div');
    announcer.id = 'swipeNavigationStatus';
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.className = 'swipe-sr-only';
    document.body.append(announcer);
  }
})();