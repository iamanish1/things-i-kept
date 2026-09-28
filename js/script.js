/* ==========================================================================
   THINGS I KEPT — BEHAVIOUR
   All personal words, dates and files live in js/content.js.
   ========================================================================== */

(function () {
    'use strict';

    /* ----------------------------------------------------------------------
       Utilities
       ---------------------------------------------------------------------- */

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motionOK = () => !reducedMotionQuery.matches;
    const fromCard = new URLSearchParams(window.location.search).get('from') === 'card';

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, motionOK() ? ms : 0));
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const pad2 = (n) => String(n).padStart(2, '0');

    function makeStore(area) {
        return {
            get(key) {
                try { return JSON.parse(window[area].getItem(key)); } catch (e) { return null; }
            },
            set(key, value) {
                try { window[area].setItem(key, JSON.stringify(value)); } catch (e) { /* private mode — fine */ }
            }
        };
    }
    const local = makeStore('localStorage');
    const session = makeStore('sessionStorage');

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    // Writes text into a node, turning "\n" into <br>. Never uses innerHTML.
    function setLines(node, text) {
        node.textContent = '';
        String(text == null ? '' : text).split('\n').forEach((line, i) => {
            if (i) node.append(document.createElement('br'));
            node.append(line);
        });
        return node;
    }

    // Splits on blank lines into <p> elements.
    function appendParagraphs(container, text, className) {
        String(text || '').split(/\n\s*\n/).forEach((chunk) => {
            if (chunk.trim()) container.append(setLines(el('p', className), chunk.trim()));
        });
        return container;
    }

    function parseLocalDate(value) {
        // "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM:SS" → local time
        const [datePart, timePart = '00:00:00'] = String(value).split('T');
        const [y, m, d] = datePart.split('-').map(Number);
        const [hh = 0, mm = 0, ss = 0] = timePart.split(':').map(Number);
        return new Date(y, m - 1, d, hh, mm, ss).getTime();
    }

    function formatShortDate(value) {
        const d = new Date(parseLocalDate(value));
        return `${pad2(d.getDate())} • ${pad2(d.getMonth() + 1)} • ${d.getFullYear()}`;
    }

    function formatTime(seconds) {
        if (!Number.isFinite(seconds)) return '--:--';
        const s = Math.max(0, Math.floor(seconds));
        return `${Math.floor(s / 60)}:${pad2(s % 60)}`;
    }

    // Small deterministic random, so decorative things look the same every visit.
    function seededRandom(seed) {
        let t = seed >>> 0;
        return function () {
            t += 0x6D2B79F5;
            let r = Math.imul(t ^ (t >>> 15), 1 | t);
            r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
            return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
        };
    }

    let toastTimer;
    function toast(message) {
        const node = $('[data-toast]');
        if (!node) return;
        setLines(node, message);
        node.classList.add('is-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => node.classList.remove('is-visible'), 4200);
    }

    /* ----------------------------------------------------------------------
       Scroll reveal
       ---------------------------------------------------------------------- */

    let revealObserver = null;

    function setupReveal() {
        if (!('IntersectionObserver' in window) || !motionOK()) return;
        document.documentElement.classList.add('has-reveal');
        revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    }

    function observeReveal(root = document) {
        const nodes = $$('[data-reveal]:not(.is-visible)', root);
        if (root !== document && root.matches && root.matches('[data-reveal]')) nodes.unshift(root);
        nodes.forEach((node) => {
            if (revealObserver) revealObserver.observe(node);
            else node.classList.add('is-visible');
        });
    }

    // Marks a list of nodes for staggered reveal.
    function stagger(nodes, step = 90, max = 600) {
        nodes.forEach((node, i) => {
            node.setAttribute('data-reveal', '');
            node.style.setProperty('--reveal-delay', `${Math.min(i * step, max)}ms`);
        });
    }

    /* ----------------------------------------------------------------------
       Sound: optional music + soft interface chime (both off by default)
       ---------------------------------------------------------------------- */

    const sound = {
        enabled: false,
        ctx: null,
        music: null,
        musicMissing: !CONFIG.backgroundMusic,
        fadeTimer: null
    };

    function chime(kind = 'soft') {
        if (!sound.enabled) return;
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        if (!sound.ctx) sound.ctx = new Ctx();
        const ctx = sound.ctx;
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime;
        const notes = kind === 'open' ? [587.33, 880] : kind === 'save' ? [523.25, 659.25, 783.99] : [659.25, 987.77];

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2400;
        filter.connect(ctx.destination);

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + i * 0.09;
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.045, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.4);
            osc.connect(gain).connect(filter);
            osc.start(start);
            osc.stop(start + 1.5);
        });
    }

    function fadeMusic(target, done) {
        const music = sound.music;
        if (!music) return;
        clearInterval(sound.fadeTimer);
        sound.fadeTimer = setInterval(() => {
            const next = music.volume + (target > music.volume ? 0.02 : -0.03);
            if ((target > music.volume && next >= target) || (target <= music.volume && next <= target)) {
                music.volume = Math.max(0, Math.min(1, target));
                clearInterval(sound.fadeTimer);
                if (done) done();
                return;
            }
            music.volume = Math.max(0, Math.min(1, next));
        }, 40);
    }

    function playMusic() {
        if (sound.musicMissing) return;
        if (!sound.music) {
            sound.music = new Audio();
            sound.music.loop = true;
            sound.music.preload = 'auto';
            sound.music.volume = 0;
            sound.music.addEventListener('error', () => {
                sound.musicMissing = true;
                if (sound.enabled) toast(CONFIG.musicMissingMessage);
            });
            sound.music.src = CONFIG.backgroundMusic;
        }
        const attempt = sound.music.play();
        if (attempt && attempt.catch) attempt.catch(() => { /* handled by error event */ });
        fadeMusic(0.32);
    }

    function pauseMusic() {
        if (!sound.music || sound.music.paused) return;
        fadeMusic(0, () => sound.music.pause());
    }

    function setSound(enabled) {
        sound.enabled = enabled;
        const button = $('[data-action="sound"]');
        button.setAttribute('aria-pressed', String(enabled));
        $('[data-sound-state]', button).textContent = enabled ? 'on' : 'off';
        if (enabled) {
            if (sound.musicMissing) toast(CONFIG.musicMissingMessage);
            playMusic();
            chime();
        } else {
            pauseMusic();
        }
    }

    /* ----------------------------------------------------------------------
       Shared building blocks
       ---------------------------------------------------------------------- */

    function createPlaceholder(message, variant) {
        const box = el('div', `placeholder${variant ? ` placeholder--${variant}` : ''}`);
        box.append(el('span', 'placeholder__mark', '✦'));
        box.append(setLines(el('p', 'placeholder__text'), message));
        return box;
    }

    // A photo frame that quietly becomes a placeholder if the file is missing.
    function createMedia({ src, alt, variant = 'photo', fallback = "Some memories don't need a photograph." }) {
        const figure = el('figure', `media media--${variant}`);
        const showPlaceholder = () => {
            figure.classList.add('media--empty');
            figure.replaceChildren(createPlaceholder(fallback, variant));
        };
        if (!src) {
            showPlaceholder();
            return figure;
        }
        const img = el('img', 'media__img');
        img.alt = alt || '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.addEventListener('load', () => figure.classList.add('is-loaded'), { once: true });
        img.addEventListener('error', showPlaceholder, { once: true });
        img.src = src;
        figure.append(img);
        return figure;
    }

    /* ----------------------------------------------------------------------
       Static text + ambient layers
       ---------------------------------------------------------------------- */

    function fillConfigText() {
        $$('[data-text]').forEach((node) => setLines(node, CONFIG[node.dataset.text] || ''));
        if (!fromCard) return;
        const early = $('[data-from-card="early"]');
        const found = $('[data-from-card="found"]');
        if (early && CONFIG.foundEarlyMessage) { setLines(early, CONFIG.foundEarlyMessage); early.hidden = false; }
        if (found && CONFIG.foundMessage) { setLines(found, CONFIG.foundMessage); found.hidden = false; }
    }

    function buildParticles() {
        const host = $('[data-particles]');
        if (!host || !motionOK()) return;
        const random = seededRandom(20261002);
        const count = window.innerWidth < 640 ? 10 : 18;
        for (let i = 0; i < count; i += 1) {
            const dot = el('span', 'particle');
            dot.style.setProperty('--x', `${(random() * 100).toFixed(2)}%`);
            dot.style.setProperty('--size', `${(1 + random() * 2.4).toFixed(2)}px`);
            dot.style.setProperty('--duration', `${(22 + random() * 26).toFixed(1)}s`);
            dot.style.setProperty('--delay', `${(-random() * 40).toFixed(1)}s`);
            dot.style.setProperty('--drift', `${((random() - 0.5) * 80).toFixed(0)}px`);
            host.append(dot);
        }
    }

    // A city silhouette with a few warm windows. Built once, static SVG.
    function buildSkyline(host) {
        const distant = host.dataset.skyline === 'distant';
        const random = seededRandom(distant ? 91 : 2);
        const ns = 'http://www.w3.org/2000/svg';
        const width = 1600;
        const height = distant ? 140 : 260;
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.setAttribute('preserveAspectRatio', 'xMidYMax slice');
        svg.setAttribute('focusable', 'false');

        const buildings = document.createElementNS(ns, 'g');
        buildings.setAttribute('class', 'skyline__buildings');
        const lights = document.createElementNS(ns, 'g');
        lights.setAttribute('class', 'skyline__lights');

        let x = -10;
        while (x < width) {
            const w = (distant ? 18 : 34) + random() * (distant ? 40 : 76);
            const h = (distant ? 20 : 50) + Math.pow(random(), 1.6) * (distant ? 110 : 200);
            const rect = document.createElementNS(ns, 'rect');
            rect.setAttribute('x', x.toFixed(1));
            rect.setAttribute('y', (height - h).toFixed(1));
            rect.setAttribute('width', (w + 1).toFixed(1));
            rect.setAttribute('height', h.toFixed(1));
            buildings.append(rect);

            const cell = distant ? 7 : 11;
            for (let wy = height - h + cell; wy < height - cell; wy += cell) {
                for (let wx = x + 5; wx < x + w - 6; wx += cell) {
                    if (random() > (distant ? 0.9 : 0.93)) {
                        const win = document.createElementNS(ns, 'rect');
                        win.setAttribute('x', wx.toFixed(1));
                        win.setAttribute('y', wy.toFixed(1));
                        win.setAttribute('width', distant ? '2.2' : '3.4');
                        win.setAttribute('height', distant ? '2.6' : '4.6');
                        if (random() > 0.94) win.setAttribute('class', 'skyline__flicker');
                        lights.append(win);
                    }
                }
            }
            x += w + (random() > 0.7 ? random() * 14 : 0);
        }
        svg.append(buildings, lights);
        host.append(svg);
    }

    /* ----------------------------------------------------------------------
       01 · Lock screen + countdown
       ---------------------------------------------------------------------- */

    function getUnlockTime() {
        if (typeof DEV_COUNTDOWN_SECONDS === 'number' && DEV_COUNTDOWN_SECONDS > 0) {
            return Date.now() + DEV_COUNTDOWN_SECONDS * 1000;
        }
        return parseLocalDate(CONFIG.unlockAt);
    }

    function shouldSkipLock() {
        const rehearsing = typeof DEV_COUNTDOWN_SECONDS === 'number' && DEV_COUNTDOWN_SECONDS > 0;
        return !rehearsing && (DEV_MODE || Date.now() >= getUnlockTime());
    }

    function startCountdown(target) {
        const lock = $('#lock');
        const timer = $('[data-countdown]');
        const units = {};
        $$('[data-unit]', timer).forEach((node) => { units[node.dataset.unit] = node; });
        let lastSpoken = '';

        lock.hidden = false;
        requestAnimationFrame(() => lock.classList.add('is-in'));

        const render = (values) => {
            Object.keys(values).forEach((key) => {
                const text = pad2(values[key]);
                const node = units[key];
                if (node.textContent === text) return;
                node.textContent = text;
                if (motionOK() && node.animate) {
                    node.animate(
                        [{ opacity: 0.25, transform: 'translateY(-0.12em)', filter: 'blur(2px)' },
                         { opacity: 1, transform: 'none', filter: 'blur(0)' }],
                        { duration: 650, easing: 'cubic-bezier(.2,.7,.2,1)' }
                    );
                }
            });
            const spoken = `${values.days} days, ${values.hours} hours and ${values.minutes} minutes to go`;
            if (spoken !== lastSpoken) {
                timer.setAttribute('aria-label', spoken);
                lastSpoken = spoken;
            }
        };

        const tick = () => {
            const remaining = target - Date.now();
            if (remaining <= 0) {
                render({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                unlock();
                return;
            }
            const total = Math.floor(remaining / 1000);
            render({
                days: Math.floor(total / 86400),
                hours: Math.floor((total % 86400) / 3600),
                minutes: Math.floor((total % 3600) / 60),
                seconds: total % 60
            });
            // Align the next tick to the start of the next second.
            setTimeout(tick, (remaining % 1000) + 15);
        };
        tick();
    }

    async function unlock() {
        const lock = $('#lock');
        lock.classList.add('is-leaving');
        await wait(1900);
        lock.hidden = true;
        showWelcome();
    }

    /* ----------------------------------------------------------------------
       02 · Welcome → story
       ---------------------------------------------------------------------- */

    function showWelcome() {
        const welcome = $('#welcome');
        document.body.classList.remove('is-locked');
        welcome.hidden = false;
        $('[data-action="sound"]').hidden = false;
        requestAnimationFrame(() => requestAnimationFrame(() => welcome.classList.add('is-in')));

        // Coming back in the same visit (reload): return to the page she was on.
        const saved = window.location.hash.slice(1);
        if (session.get('tik-started') && saved !== 'welcome' && pageExists(saved)) {
            goToPage(saved, { instant: true, history: 'replace' });
        } else {
            goToPage('welcome', { instant: true, history: 'none' });
        }
    }

    function revealStory() {
        const story = $('#story');
        if (!story.hidden) return;
        story.hidden = false;
        $('.progress').hidden = false;
        document.body.classList.add('has-started');
        observeReveal(story);
        session.set('tik-started', true);
    }

    function startStory() {
        chime('soft');
        goToPage('prologue');
    }

    /* ----------------------------------------------------------------------
       Pages — one section at a time
       Every element with data-page="x" belongs to page x. Only the current
       page is displayed; moving between pages is a short cross-fade.
       ---------------------------------------------------------------------- */

    const PAGE_ORDER = ['welcome', 'prologue', 'contents', ...chapters.map((c) => c.id), 'finale'];
    const pager = { current: null, token: 0, listeners: [] };

    const pageExists = (id) => PAGE_ORDER.includes(id) && Boolean($(`[data-page="${id}"]`));
    const pageNodes = (id) => $$(`[data-page="${id}"]`);

    async function goToPage(id, { instant = false, history: historyMode = 'push' } = {}) {
        if (!pageExists(id)) return;
        if (id === pager.current) {
            window.scrollTo({ top: 0, behavior: motionOK() ? 'smooth' : 'auto' });
            return;
        }
        if (id !== 'welcome') revealStory();

        const from = pager.current;
        const direction = PAGE_ORDER.indexOf(id) >= PAGE_ORDER.indexOf(from) ? 1 : -1;
        document.documentElement.style.setProperty('--page-dir', String(direction));
        const token = ++pager.token;

        if (from && !instant && motionOK()) {
            pageNodes(from).forEach((node) => node.classList.add('is-leaving'));
            await wait(420);
            if (token !== pager.token) return;
        }
        $$('[data-page].is-current, [data-page].is-leaving')
            .forEach((node) => node.classList.remove('is-current', 'is-leaving', 'is-entering'));

        pager.current = id;
        pageNodes(id).forEach((node) => {
            node.classList.add('is-current');
            if (from && !instant) node.classList.add('is-entering');
        });
        window.scrollTo({ top: 0, behavior: 'instant' });

        const url = id === 'welcome' ? window.location.pathname + window.location.search : `#${id}`;
        if (historyMode === 'push') window.history.pushState({ page: id }, '', url);
        if (historyMode === 'replace') window.history.replaceState({ page: id }, '', url);

        // Move keyboard / screen-reader focus to the new page's heading.
        const heading = $('h1, h2', pageNodes(id)[0]);
        if (from && heading) {
            if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
            heading.focus({ preventScroll: true });
        }
        pager.listeners.forEach((listener) => listener(id));
    }

    function stepPage(step) {
        const next = PAGE_ORDER[PAGE_ORDER.indexOf(pager.current) + step];
        if (next && next !== 'welcome') goToPage(next);
    }

    function setupPager() {
        // Every in-page link (#id) becomes a page change.
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a[href^="#"]');
            if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
            const target = document.getElementById(link.getAttribute('href').slice(1));
            const page = target && target.closest('[data-page]');
            if (!page) return;
            event.preventDefault();
            goToPage(page.dataset.page);
        });

        // Phone back button → previous page.
        window.addEventListener('popstate', (event) => {
            const id = (event.state && event.state.page) || window.location.hash.slice(1) || 'welcome';
            goToPage(pageExists(id) ? id : 'welcome', { history: 'none' });
        });

        // Left / right keys, unless she is typing, on the timeline, or reading a letter.
        document.addEventListener('keydown', (event) => {
            if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
            if (event.altKey || event.ctrlKey || event.metaKey) return;
            if (pager.current === 'welcome' || $('[data-letter-dialog]').open) return;
            if (event.target.closest('input, textarea, select, [role="tab"], [contenteditable]')) return;
            event.preventDefault();
            stepPage(event.key === 'ArrowRight' ? 1 : -1);
        });

        // Horizontal swipe on phones. Vertical scrolling is untouched.
        let touch = null;
        document.addEventListener('touchstart', (event) => {
            const point = event.touches[0];
            const ignore = event.touches.length > 1
                || event.target.closest('input, textarea, .timeline__rail, dialog');
            touch = ignore ? null : { x: point.clientX, y: point.clientY, t: Date.now() };
        }, { passive: true });
        document.addEventListener('touchend', (event) => {
            if (!touch || pager.current === 'welcome' || document.body.classList.contains('is-reading')) return;
            const point = event.changedTouches[0];
            const dx = point.clientX - touch.x;
            const dy = point.clientY - touch.y;
            const quick = Date.now() - touch.t < 700;
            touch = null;
            if (quick && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8) stepPage(dx < 0 ? 1 : -1);
        }, { passive: true });
    }

    /* ----------------------------------------------------------------------
       Prologue + chapter selector
       ---------------------------------------------------------------------- */

    function renderPrologue() {
        const host = $('[data-prologue]');
        const lines = (CONFIG.prologue || []).map((text, i, all) =>
            setLines(el('p', `prologue__line${i === all.length - 1 ? ' prologue__line--last' : ''}`), text));
        const next = el('a', 'button button--quiet prologue__next');
        next.href = '#contents';
        next.append('Continue ', el('span', 'button__arrow', '→'));
        next.lastChild.setAttribute('aria-hidden', 'true');
        host.append(...lines, next);
        stagger([...lines, next], 650, 3900);
    }

    function renderContents() {
        const list = $('[data-chapter-list]');
        chapters.forEach((chapter, i) => {
            const item = el('li', 'contents__item');
            const link = el('a', 'chapter-card');
            link.href = `#${chapter.id}`;
            link.append(
                el('span', 'chapter-card__number', chapter.number),
                el('span', 'chapter-card__title', chapter.title),
                el('span', 'chapter-card__description', chapter.description || ''),
                el('span', 'chapter-card__arrow', '→')
            );
            link.lastChild.setAttribute('aria-hidden', 'true');
            item.append(link);
            list.append(item);
            item.style.setProperty('--reveal-delay', `${i * 70}ms`);
            item.setAttribute('data-reveal', '');
        });
    }

    function renderChapterHeader(chapter) {
        const header = el('header', 'chapter__header');
        const eyebrow = el('p', 'chapter__eyebrow', `Chapter ${chapter.number}`);
        const title = el('h2', 'chapter__title', chapter.title);
        title.id = `${chapter.id}-title`;
        header.append(eyebrow, title);
        if (chapter.intro) header.append(setLines(el('p', 'chapter__intro'), chapter.intro));
        stagger(Array.from(header.children), 120);
        return header;
    }

    // "← previous · next →" at the end of every chapter.
    function renderChapterFooter(index) {
        const nav = el('nav', 'chapter-footer');
        nav.setAttribute('aria-label', `Chapter ${chapters[index].number} navigation`);
        const prev = index > 0 ? chapters[index - 1] : null;
        const next = index < chapters.length - 1 ? chapters[index + 1] : null;

        const prevLink = el('a', 'chapter-footer__link chapter-footer__link--prev');
        prevLink.href = prev ? `#${prev.id}` : '#contents';
        prevLink.append(el('span', 'chapter-footer__hint', '← Back'), el('span', 'chapter-footer__name', prev ? prev.title : 'Our Story'));

        const nextLink = el('a', 'chapter-footer__link chapter-footer__link--next');
        nextLink.href = next ? `#${next.id}` : '#finale';
        nextLink.append(el('span', 'chapter-footer__hint', 'Continue →'), el('span', 'chapter-footer__name', next ? next.title : 'The last page'));

        nav.append(prevLink, nextLink);
        return nav;
    }

    /* ----------------------------------------------------------------------
       Chapter 01 · Before You
       ---------------------------------------------------------------------- */

    function renderBeforeYou(host) {
        const opening = el('div', 'before__opening');
        (beforeYou.opening || []).forEach((text) => opening.append(setLines(el('p', 'before__line'), text)));
        stagger(Array.from(opening.children), 200);

        const spread = el('div', 'before__spread');

        const diary = el('div', 'diary');
        diary.setAttribute('data-reveal', '');
        appendParagraphs(diary, (beforeYou.paragraphs || []).join('\n\n'), 'diary__text');
        if (beforeYou.marginNote) diary.append(el('p', 'diary__margin', beforeYou.marginNote));

        const day = el('ol', 'ordinary');
        day.setAttribute('aria-label', 'An ordinary day');
        (beforeYou.ordinaryDay || []).forEach((moment) => {
            const item = el('li', 'ordinary__item');
            const head = el('span', 'ordinary__head');
            head.append(el('span', 'ordinary__time', moment.time));
            if (moment.title) head.append(el('span', 'ordinary__title', moment.title));
            item.append(head, setLines(el('span', 'ordinary__text'), moment.text));
            if (moment.note) item.append(setLines(el('span', 'ordinary__note'), moment.note));
            day.append(item);
        });
        stagger(Array.from(day.children), 140);

        spread.append(diary, day);

        const turn = el('div', 'before__turn');
        if (beforeYou.turn) turn.append(setLines(el('p', 'before__then'), beforeYou.turn));
        if (beforeYou.climax) turn.append(setLines(el('p', 'before__climax'), beforeYou.climax));
        if (beforeYou.closing) turn.append(setLines(el('p', 'before__closing'), beforeYou.closing));
        stagger(Array.from(turn.children), 900);
        turn.prepend(el('div', 'before__bloom'));
        turn.firstChild.setAttribute('aria-hidden', 'true');
        turn.firstChild.setAttribute('data-reveal', '');

        host.append(opening, spread, turn);
    }

    /* ----------------------------------------------------------------------
       Chapter 02 · The First Month (timeline)
       ---------------------------------------------------------------------- */

    function renderMoment(moment) {
        const card = el('article', 'moment');
        const body = el('div', 'moment__body');
        body.append(el('p', 'moment__day', `Day ${pad2(moment.day)}`));
        body.append(el('h3', 'moment__title', moment.title || moment.label || ''));
        const meta = [moment.date, moment.time].filter(Boolean).join('  ·  ');
        if (meta) body.append(el('p', 'moment__meta', meta));
        appendParagraphs(body, moment.text, 'moment__text');
        if (moment.note) body.append(el('p', 'moment__note', moment.note));

        if (moment.image) card.append(createMedia({ src: moment.image, alt: moment.imageAlt, variant: 'photo' }));
        else card.classList.add('moment--text');
        card.append(body);
        return card;
    }

    function renderTimeline(host) {
        const wrap = el('div', 'timeline');
        if (!timeline.length) {
            wrap.append(createPlaceholder('The first month is still being written.'));
            host.append(wrap);
            return;
        }

        const rail = el('div', 'timeline__rail');
        rail.setAttribute('role', 'tablist');
        rail.setAttribute('aria-label', 'Days of the first month');
        rail.style.setProperty('--count', String(timeline.length));
        const track = el('div', 'timeline__track');
        track.setAttribute('aria-hidden', 'true');
        track.append(el('div', 'timeline__fill'));
        rail.append(track);

        const panel = el('div', 'timeline__panel');
        panel.id = 'timeline-panel';
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-live', 'polite');

        const tabs = timeline.map((moment, i) => {
            const tab = el('button', 'timeline__node');
            tab.type = 'button';
            tab.id = `timeline-tab-${i}`;
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-controls', panel.id);
            tab.setAttribute('aria-selected', 'false');
            tab.tabIndex = -1;
            // Evenly spaced, so moments a few days apart never crowd each other.
            const position = timeline.length > 1 ? i / (timeline.length - 1) : 0;
            tab.style.setProperty('--pos', position.toFixed(4));
            tab.append(
                el('span', 'timeline__dot'),
                el('span', 'timeline__day', `Day ${pad2(moment.day)}`),
                el('span', 'timeline__label', moment.label || moment.title || '')
            );
            tab.firstChild.setAttribute('aria-hidden', 'true');
            rail.append(tab);
            return tab;
        });

        let current = -1;
        let swapToken = 0;

        async function select(index, { focus = false, fromUser = false } = {}) {
            if (index === current) return;
            current = index;
            tabs.forEach((tab, i) => {
                const selected = i === index;
                tab.setAttribute('aria-selected', String(selected));
                tab.tabIndex = selected ? 0 : -1;
                tab.classList.toggle('is-past', i < index);
            });
            if (focus) tabs[index].focus();
            rail.style.setProperty('--fill', tabs[index].style.getPropertyValue('--pos'));
            panel.setAttribute('aria-labelledby', tabs[index].id);

            const token = ++swapToken;
            if (panel.firstChild) {
                panel.classList.add('is-changing');
                await wait(260);
                if (token !== swapToken) return;
            }
            panel.replaceChildren(renderMoment(timeline[index]));
            panel.classList.remove('is-changing');

            if (fromUser && window.matchMedia('(max-width: 899px)').matches) {
                const rect = panel.getBoundingClientRect();
                if (rect.top > window.innerHeight * 0.6) {
                    panel.scrollIntoView({ behavior: motionOK() ? 'smooth' : 'auto', block: 'start' });
                }
            }
        }

        /* Autoplay: move to the next moment every few seconds, looping.
           Runs only while this page is on screen; pauses for hover, keyboard
           focus, an open letter, a hidden tab, or her own pause button. */
        const seconds = typeof TIMELINE_AUTOPLAY_SECONDS === 'number' ? TIMELINE_AUTOPLAY_SECONDS : 6;
        const duration = Math.max(2, seconds) * 1000;
        const autoplay = { timer: 0, startedAt: 0, remaining: duration, holds: new Set() };
        if (!seconds || timeline.length < 2) autoplay.holds.add('off');
        if (!motionOK()) autoplay.holds.add('user');

        const controls = el('div', 'timeline__controls');
        const toggle = el('button', 'timeline__toggle');
        toggle.type = 'button';
        toggle.append(el('span', 'timeline__toggle-icon'));
        const bar = el('div', 'timeline__progress');
        bar.setAttribute('aria-hidden', 'true');
        bar.style.setProperty('--autoplay', `${duration}ms`);
        controls.append(toggle, bar);
        if (autoplay.holds.has('off')) controls.hidden = true;

        const isActive = () => pager.current === 'first-month' && !document.hidden;
        const running = () => isActive() && autoplay.holds.size === 0;

        function paintControls() {
            const userPaused = autoplay.holds.has('user');
            toggle.setAttribute('aria-label', userPaused ? 'Play the timeline automatically' : 'Pause the timeline');
            toggle.classList.toggle('is-paused', userPaused);
            bar.classList.toggle('is-held', !running());
            // Don't announce every automatic change to screen readers.
            panel.setAttribute('aria-live', running() ? 'off' : 'polite');
        }

        function restartBar() {
            bar.classList.remove('is-running');
            void bar.offsetWidth; // restart the CSS animation
            bar.classList.add('is-running');
        }

        function stopTimer() {
            if (!autoplay.timer) return;
            clearTimeout(autoplay.timer);
            autoplay.timer = 0;
            autoplay.remaining = Math.max(0, autoplay.remaining - (Date.now() - autoplay.startedAt));
        }

        function startTimer() {
            clearTimeout(autoplay.timer);
            autoplay.timer = 0;
            if (!running()) return;
            autoplay.startedAt = Date.now();
            autoplay.timer = setTimeout(() => {
                autoplay.timer = 0;
                autoplay.remaining = duration;
                restartBar();
                select((current + 1) % tabs.length);
                startTimer();
            }, autoplay.remaining);
        }

        // Start a fresh 6 seconds (after a click, or when the page opens).
        function resetTimer() {
            clearTimeout(autoplay.timer);
            autoplay.timer = 0;
            autoplay.remaining = duration;
            restartBar();
            paintControls();
            startTimer();
        }

        function hold(reason, on) {
            const before = running();
            if (on) autoplay.holds.add(reason);
            else autoplay.holds.delete(reason);
            if (before && !running()) stopTimer();
            if (!before && running()) startTimer();
            paintControls();
        }

        toggle.addEventListener('click', () => {
            const resume = autoplay.holds.has('user');
            hold('user', !resume);
            if (resume) resetTimer();
        });
        panel.addEventListener('pointerenter', (event) => { if (event.pointerType === 'mouse') hold('hover', true); });
        panel.addEventListener('pointerleave', (event) => { if (event.pointerType === 'mouse') hold('hover', false); });
        wrap.addEventListener('focusin', (event) => {
            if (event.target.matches(':focus-visible') && event.target !== toggle) hold('focus', true);
        });
        wrap.addEventListener('focusout', (event) => {
            if (!wrap.contains(event.relatedTarget)) hold('focus', false);
        });
        document.addEventListener('visibilitychange', () => hold('hidden', document.hidden));
        pager.listeners.push((id) => {
            if (id === 'first-month') resetTimer();
            else { stopTimer(); paintControls(); }
        });

        // Load every photo up front so each moment appears instantly.
        timeline.forEach((moment) => { if (moment.image) new Image().src = moment.image; });

        rail.addEventListener('click', (event) => {
            const tab = event.target.closest('.timeline__node');
            if (!tab) return;
            select(tabs.indexOf(tab), { fromUser: true });
            resetTimer();
        });
        rail.addEventListener('keydown', (event) => {
            const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
            let next = null;
            if (event.key in keys) next = (current + keys[event.key] + tabs.length) % tabs.length;
            if (event.key === 'Home') next = 0;
            if (event.key === 'End') next = tabs.length - 1;
            if (next === null) return;
            event.preventDefault();
            select(next, { focus: true, fromUser: true });
        });

        wrap.append(rail, controls, panel);
        wrap.setAttribute('data-reveal', '');
        host.append(wrap);
        select(0);
        paintControls();
    }

    /* ----------------------------------------------------------------------
       Chapter 03 · Things I Notice
       ---------------------------------------------------------------------- */

    function renderNotes(host) {
        const list = el('ul', 'notes');
        observations.forEach((text) => {
            const item = el('li', 'notes__item');
            const note = el('figure', 'note');
            const match = /^I notice\s+/i.exec(text);
            if (match) {
                note.append(el('span', 'note__lead', 'I notice'));
                note.append(setLines(el('p', 'note__text'), text.slice(match[0].length)));
            } else {
                note.append(setLines(el('p', 'note__text'), text));
            }
            item.append(note);
            list.append(item);
        });
        // Each note arrives on its own as you scroll — no long cascades.
        stagger(Array.from(list.children), 0);
        host.append(list);
        if (observationsClosing) {
            const closing = el('p', 'notes__closing', observationsClosing);
            closing.setAttribute('data-reveal', '');
            host.append(closing);
        }
    }

    /* ----------------------------------------------------------------------
       Chapter 04 · 12 Letters
       ---------------------------------------------------------------------- */

    const OPENED_KEY = 'tik-opened-letters';
    const openedLetters = new Set(local.get(OPENED_KEY) || []);

    function isSealed(letter) {
        return !DEV_MODE && Boolean(letter.unlockDate) && Date.now() < parseLocalDate(letter.unlockDate);
    }

    function splitLetterTitle(title) {
        const match = /^open\s+(when|on)\s+/i.exec(title || '');
        return match
            ? { lead: `Open ${match[1].toLowerCase()}`, rest: title.slice(match[0].length) }
            : { lead: '', rest: title || '' };
    }

    function paintEnvelope(button, letter, index) {
        const sealed = isSealed(letter);
        const opened = openedLetters.has(index);
        button.classList.toggle('is-sealed', sealed);
        button.classList.toggle('is-opened', opened);
        const status = $('.envelope__status', button);
        status.textContent = sealed ? `Sealed until ${formatShortDate(letter.unlockDate)}` : opened ? 'Opened' : '';
    }

    function renderLetters(host) {
        const grid = el('ul', 'envelopes');
        letters.forEach((letter, i) => {
            const item = el('li', 'envelopes__item');
            const button = el('button', 'envelope');
            button.type = 'button';
            button.dataset.letter = String(i);
            const { lead, rest } = splitLetterTitle(letter.title);
            const label = el('span', 'envelope__label');
            if (lead) label.append(el('span', 'envelope__lead', lead));
            label.append(el('span', 'envelope__rest', rest));
            const top = el('span', 'envelope__top');
            top.append(el('span', 'envelope__number', `No. ${pad2(i + 1)}`), el('span', 'envelope__status'));
            const seal = el('span', 'envelope__seal');
            seal.setAttribute('aria-hidden', 'true');
            button.append(top, seal, label);
            paintEnvelope(button, letter, i);
            item.append(button);
            grid.append(item);
        });
        stagger(Array.from(grid.children), 60, 420);
        grid.addEventListener('click', (event) => {
            const button = event.target.closest('.envelope');
            if (button) openLetter(Number(button.dataset.letter), button);
        });
        host.append(grid);
    }

    const reader = { token: 0, index: -1, trigger: null };

    async function openLetter(index, trigger) {
        const letter = letters[index];
        const dialog = $('[data-letter-dialog]');
        if (!letter || !dialog) return;
        if (isSealed(letter)) {
            toast(`Not yet.\nThis one opens on ${formatShortDate(letter.unlockDate)}.`);
            return;
        }

        $('[data-letter-number]').textContent = `Letter ${pad2(index + 1)} of ${pad2(letters.length)}`;
        $('[data-letter-title]').textContent = letter.title;
        const date = $('[data-letter-date]');
        date.textContent = letter.date || '';
        date.hidden = !letter.date;
        const body = $('[data-letter-body]');
        body.replaceChildren();
        appendParagraphs(body, letter.text, 'letter-paper__text');
        const media = $('[data-letter-media]');
        media.replaceChildren();
        if (letter.image) media.append(createMedia({ src: letter.image, alt: letter.imageAlt || '', variant: 'letter' }));
        media.hidden = !letter.image;
        $('[data-letter-sign]').textContent = CONFIG.signature || '';

        reader.index = index;
        reader.trigger = trigger || null;
        const token = ++reader.token;
        dialog.dataset.mood = letter.mood || 'rose';
        dialog.classList.remove('is-open', 'is-out', 'is-read', 'is-closing');
        dialog.showModal();
        document.body.classList.add('is-reading');
        const paper = $('[data-letter-paper]');
        paper.scrollTop = 0;
        chime('open');

        if (!motionOK()) {
            dialog.classList.add('is-open', 'is-out', 'is-read');
        } else {
            await nextFrame();
            if (token !== reader.token) return;
            dialog.classList.add('is-open');
            await wait(620);
            if (token !== reader.token) return;
            dialog.classList.add('is-out');
            await wait(700);
            if (token !== reader.token) return;
            dialog.classList.add('is-read');
        }
        // The paper only becomes focusable once it is visible.
        paper.focus({ preventScroll: true });

        openedLetters.add(index);
        local.set(OPENED_KEY, Array.from(openedLetters));
    }

    async function closeLetter() {
        const dialog = $('[data-letter-dialog]');
        if (!dialog.open || dialog.classList.contains('is-closing')) return;
        const token = ++reader.token;
        dialog.classList.add('is-closing');
        await wait(480);
        if (token !== reader.token) return;
        dialog.close();
        dialog.classList.remove('is-open', 'is-out', 'is-read', 'is-closing');
        document.body.classList.remove('is-reading');

        const button = reader.trigger || $(`.envelope[data-letter="${reader.index}"]`);
        if (button) {
            paintEnvelope(button, letters[reader.index], reader.index);
            button.focus({ preventScroll: true });
        }
    }

    function setupLetterDialog() {
        const dialog = $('[data-letter-dialog]');
        if (!dialog) return;
        dialog.addEventListener('cancel', (event) => {
            event.preventDefault();
            closeLetter();
        });
        dialog.addEventListener('click', (event) => {
            if (event.target === dialog || event.target === $('[data-letter-stage]')) closeLetter();
        });
    }

    /* ----------------------------------------------------------------------
       Chapter 05 · What You Mean To Me — the virtual bouquet
       Every flower is drawn in SVG here: a stem that grows out of a glass
       vase, leaves that unfurl, petals that open ring by ring.
       ---------------------------------------------------------------------- */

    const SVG_NS = 'http://www.w3.org/2000/svg';

    function svgEl(tag, attrs, className) {
        const node = document.createElementNS(SVG_NS, tag);
        if (attrs) Object.keys(attrs).forEach((key) => node.setAttribute(key, attrs[key]));
        if (className) node.setAttribute('class', className);
        return node;
    }

    // [base, middle, tip] — muted, candle-lit tones.
    const PETAL_COLORS = {
        rose: ['#6e2a36', '#b9707a', '#ecc3bb'],
        burgundy: ['#3f121b', '#7e2c3a', '#c46b75'],
        blush: ['#9c5f63', '#d9a49d', '#f6e0d6'],
        cream: ['#a88c68', '#e4d3b6', '#fbf5ea'],
        lavender: ['#5f5087', '#a898cc', '#e6def3']
    };
    const NATURAL_COLOR = { rose: 'rose', tulip: 'blush', daisy: 'cream', lily: 'cream', wildflower: 'lavender', cosmos: 'rose' };
    const HEAD_SCALE = { rose: 1.35, tulip: 1.35, daisy: 1.3, lily: 1.35, wildflower: 1.2, cosmos: 1.3 };

    // Petal outlines, base at (0,0), pointing up.
    const PETAL_PATHS = {
        round: 'M0 0 C-15 -5 -20 -24 -10 -32 C-4 -36 4 -36 10 -32 C20 -24 15 -5 0 0Z',
        long: 'M0 0 C-8 -10 -8 -34 0 -46 C8 -34 8 -10 0 0Z',
        thin: 'M0 -4 C-3.6 -8 -3.6 -30 0 -34 C3.6 -30 3.6 -8 0 -4Z',
        notch: 'M0 0 C-10 -6 -14 -28 -9 -35 L-4 -32 L0 -36 L4 -32 L9 -35 C14 -28 10 -6 0 0Z',
        small: 'M0 0 C-9 -3 -12 -14 -6 -19 C-2 -22 2 -22 6 -19 C12 -14 9 -3 0 0Z',
        tulipBackLeft: 'M1 2 C-17 -1 -24 -25 -15 -44 C-8 -31 -4 -18 3 -6Z',
        tulipBackRight: 'M-1 2 C17 -1 24 -25 15 -44 C8 -31 4 -18 -3 -6Z',
        tulipFront: 'M-13 -2 C-19 -18 -12 -38 0 -47 C12 -38 19 -18 13 -2 C7 4 -7 4 -13 -2Z'
    };
    const LEAF_PATH = 'M0 0 C7 -7 20 -9 31 -3 C21 2 8 3 0 0Z';

    // Seconds into each flower's growth.
    const GROW = { stem: 1.7, bloom: 1.45, total: 3.9 };

    function petal(parent, shape, color, delay, transform) {
        const wrap = svgEl('g', transform ? { transform } : null);
        const node = svgEl('path', { d: PETAL_PATHS[shape], fill: `url(#bq-petal-${color})` }, 'flower__petal');
        node.style.setProperty('--d', `${delay.toFixed(2)}s`);
        wrap.append(node);
        parent.append(wrap);
    }

    function petalRing(parent, { shape, count, color, delay, scale = 1, offset = 0, step = 0.05 }) {
        for (let i = 0; i < count; i += 1) {
            petal(parent, shape, color, delay + i * step, `rotate(${(offset + (i * 360) / count).toFixed(2)}) scale(${scale})`);
        }
    }

    function flowerCenter(parent, delay, children) {
        const group = svgEl('g', null, 'flower__center');
        group.style.setProperty('--d', `${delay.toFixed(2)}s`);
        children.forEach((child) => group.append(child));
        parent.append(group);
    }

    const HEAD_BUILDERS = {
        rose(head, color, t) {
            petalRing(head, { shape: 'round', count: 5, color, delay: t, scale: 1.12 });
            petalRing(head, { shape: 'round', count: 5, color, delay: t + 0.25, scale: 0.84, offset: 36 });
            petalRing(head, { shape: 'round', count: 4, color, delay: t + 0.5, scale: 0.56, offset: 15 });
            flowerCenter(head, t + 0.8, [
                svgEl('path', {
                    d: 'M-1 -1 C3 -5 7 0 3 4 C-2 8 -8 3 -5 -3 C-2 -9 7 -8 9 -2',
                    fill: 'none', stroke: PETAL_COLORS[color][0], 'stroke-width': 1.4, 'stroke-linecap': 'round'
                })
            ]);
        },
        daisy(head, color, t) {
            petalRing(head, { shape: 'thin', count: 16, color, delay: t, step: 0.03 });
            petalRing(head, { shape: 'thin', count: 16, color, delay: t + 0.2, scale: 0.8, offset: 11.25, step: 0.03 });
            flowerCenter(head, t + 0.7, [
                svgEl('circle', { r: 7.5, fill: 'url(#bq-center-gold)' }),
                svgEl('circle', { r: 3.4, fill: '#8a5a22', opacity: 0.45 })
            ]);
        },
        tulip(head, color, t) {
            petal(head, 'tulipBackLeft', color, t);
            petal(head, 'tulipBackRight', color, t + 0.12);
            petal(head, 'tulipFront', color, t + 0.3);
            flowerCenter(head, t + 0.9, [
                svgEl('path', { d: 'M0 -40 C-2 -28 -2 -14 0 -4', fill: 'none', stroke: 'rgba(255,245,235,0.35)', 'stroke-width': 1 })
            ]);
        },
        lily(head, color, t) {
            petalRing(head, { shape: 'long', count: 3, color, delay: t, scale: 1.05, step: 0.1 });
            petalRing(head, { shape: 'long', count: 3, color, delay: t + 0.25, scale: 0.9, offset: 60, step: 0.1 });
            const stamens = [];
            for (let i = 0; i < 6; i += 1) {
                const angle = ((i * 60 + 30) * Math.PI) / 180;
                const x = Math.sin(angle) * 20;
                const y = -Math.cos(angle) * 20;
                stamens.push(svgEl('path', { d: `M0 0 Q${(x * 0.4).toFixed(1)} ${(y * 0.6).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`, fill: 'none', stroke: '#cdbb8f', 'stroke-width': 0.8 }));
                stamens.push(svgEl('ellipse', { cx: x.toFixed(1), cy: y.toFixed(1), rx: 1.6, ry: 2.6, fill: '#8a4f2a', transform: `rotate(${i * 60 + 30} ${x.toFixed(1)} ${y.toFixed(1)})` }));
            }
            stamens.push(svgEl('circle', { r: 3, fill: '#d8c48e' }));
            flowerCenter(head, t + 0.8, stamens);
        },
        wildflower(head, color, t) {
            petalRing(head, { shape: 'small', count: 5, color, delay: t, scale: 1.25, step: 0.08 });
            flowerCenter(head, t + 0.6, [
                svgEl('path', { d: 'M-4 -6 Q-10 -14 -18 -18 M4 -6 Q10 -16 16 -23', fill: 'none', stroke: '#5b6747', 'stroke-width': 1 }),
                svgEl('circle', { cx: -18, cy: -18, r: 3.4, fill: `url(#bq-petal-${color})` }),
                svgEl('circle', { cx: 16, cy: -23, r: 2.8, fill: `url(#bq-petal-${color})` }),
                svgEl('circle', { r: 4, fill: 'url(#bq-center-gold)' })
            ]);
        },
        cosmos(head, color, t) {
            petalRing(head, { shape: 'notch', count: 8, color, delay: t, scale: 1.05, step: 0.06 });
            const dots = [svgEl('circle', { r: 6.5, fill: 'url(#bq-center-dark)' })];
            for (let i = 0; i < 7; i += 1) {
                const a = (i / 7) * Math.PI * 2;
                dots.push(svgEl('circle', { cx: (Math.cos(a) * 3.4).toFixed(2), cy: (Math.sin(a) * 3.4).toFixed(2), r: 0.9, fill: '#e9c37a' }));
            }
            flowerCenter(head, t + 0.7, dots);
        }
    };

    function cubicPoint(p, t) {
        const u = 1 - t;
        return {
            x: u * u * u * p[0].x + 3 * u * u * t * p[1].x + 3 * u * t * t * p[2].x + t * t * t * p[3].x,
            y: u * u * u * p[0].y + 3 * u * u * t * p[1].y + 3 * u * t * t * p[2].y + t * t * t * p[3].y
        };
    }

    function cubicAngle(p, t) {
        const u = 1 - t;
        const dx = 3 * u * u * (p[1].x - p[0].x) + 6 * u * t * (p[2].x - p[1].x) + 3 * t * t * (p[3].x - p[2].x);
        const dy = 3 * u * u * (p[1].y - p[0].y) + 6 * u * t * (p[2].y - p[1].y) + 3 * t * t * (p[3].y - p[2].y);
        return (Math.atan2(dy, dx) * 180) / Math.PI;
    }

    // Where each flower's head goes. The first grows tall in the middle;
    // the rest alternate left and right, so the bouquet fills out evenly.
    function bouquetSlots(count) {
        const spread = Math.min(34, 6 + count * 4);
        const mid = (count - 1) / 2;
        const byPosition = Array.from({ length: count }, (_, k) => k);
        const growthOrder = byPosition.slice().sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid) || a - b);
        return growthOrder.map((k) => {
            const angle = count > 1 ? -spread + (2 * spread * k) / (count - 1) : 0;
            const shorter = Math.round(Math.abs(k - mid)) % 2 === 1;
            const length = 252 - Math.abs(angle) * 1.8 - (shorter ? 30 : 0);
            const rad = (angle * Math.PI) / 180;
            return { angle, x: 200 + Math.sin(rad) * length, y: 445 - Math.cos(rad) * length };
        });
    }

    function buildFlower(spec, slot, index) {
        const type = HEAD_BUILDERS[spec.type] ? spec.type : 'rose';
        const color = PETAL_COLORS[spec.color] ? spec.color : NATURAL_COLOR[type];
        const flower = svgEl('g', null, `flower flower--${type}`);
        flower.style.setProperty('--sway-duration', `${(6.5 + (index % 3) * 1.4).toFixed(1)}s`);
        flower.style.setProperty('--sway-delay', `${(-index * 1.7).toFixed(1)}s`);

        const dx = slot.x - 200;
        const points = [
            { x: 200 + dx * 0.07, y: 540 },
            { x: 200 + dx * 0.1, y: 440 },
            { x: 200 + dx * 0.62, y: (440 + slot.y) / 2 + 6 },
            { x: slot.x, y: slot.y + 8 }
        ];
        const f = (p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
        flower.append(svgEl('path', { d: `M${f(points[0])} C${f(points[1])} ${f(points[2])} ${f(points[3])}`, pathLength: 1 }, 'flower__stem'));

        [0.5, 0.68].forEach((t, k) => {
            const at = cubicPoint(points, t);
            if (at.y > 420) return; // keep leaves above the vase
            const side = (k === 0 ? 1 : -1) * (dx >= 0 ? 1 : -1);
            const rotate = cubicAngle(points, t) + side * 58;
            const holder = svgEl('g', { transform: `translate(${f(at)}) rotate(${rotate.toFixed(1)}) scale(${(0.95 - k * 0.15).toFixed(2)} ${side})` });
            const leaf = svgEl('path', { d: LEAF_PATH, fill: 'url(#bq-leaf)' }, 'flower__leaf');
            leaf.style.setProperty('--d', `${(GROW.stem * t).toFixed(2)}s`);
            holder.append(leaf);
            flower.append(holder);
        });

        const tilt = type === 'tulip' ? slot.angle * 0.9 : slot.angle * 0.4 + (index % 2 ? 6 : -6);
        const head = svgEl('g', { transform: `translate(${f(slot)}) rotate(${tilt.toFixed(1)}) scale(${HEAD_SCALE[type]})` }, 'flower__head');
        const glow = svgEl('circle', { r: 42, fill: 'url(#bq-glow)' }, 'flower__glow');
        glow.style.setProperty('--d', `${GROW.bloom}s`);
        head.append(glow);
        HEAD_BUILDERS[type](head, color, GROW.bloom);
        flower.append(head);
        return flower;
    }

    function buildBouquetDefs() {
        const defs = svgEl('defs');
        const gradient = (tag, id, attrs, stops) => {
            const node = svgEl(tag, Object.assign({ id }, attrs));
            stops.forEach(([offset, color, opacity = 1]) => node.append(svgEl('stop', { offset, 'stop-color': color, 'stop-opacity': opacity })));
            defs.append(node);
        };
        Object.keys(PETAL_COLORS).forEach((name) => {
            const [base, mid, tip] = PETAL_COLORS[name];
            gradient('linearGradient', `bq-petal-${name}`, { x1: 0, y1: 1, x2: 0, y2: 0 }, [[0, base], [0.45, mid], [1, tip]]);
        });
        gradient('linearGradient', 'bq-leaf', { x1: 0, y1: 0, x2: 1, y2: 0 }, [[0, '#3a4431'], [1, '#7a8762']]);
        gradient('radialGradient', 'bq-center-gold', {}, [[0, '#f6dc9c'], [1, '#b07a33']]);
        gradient('radialGradient', 'bq-center-dark', {}, [[0, '#6b2433'], [1, '#24090f']]);
        gradient('radialGradient', 'bq-glow', {}, [[0, '#ecbe8c', 0.32], [1, '#ecbe8c', 0]]);
        gradient('linearGradient', 'bq-glass', { x1: 0, y1: 0, x2: 1, y2: 0 }, [[0, '#f1e6d6', 0.1], [0.5, '#f1e6d6', 0.02], [1, '#f1e6d6', 0.08]]);
        return defs;
    }

    function buildVase() {
        const vase = svgEl('g', null, 'bouquet__vase');
        vase.append(
            svgEl('ellipse', { cx: 200, cy: 553, rx: 62, ry: 5, fill: 'rgba(0,0,0,0.55)' }),
            svgEl('path', { d: 'M168 432 C160 470 164 515 176 548 L224 548 C236 515 240 470 232 432 Z', fill: 'url(#bq-glass)', stroke: 'rgba(241,230,214,0.3)', 'stroke-width': 1 }),
            svgEl('path', { d: 'M166 470 C180 473 220 473 234 470', fill: 'none', stroke: 'rgba(241,230,214,0.12)', 'stroke-width': 1 }),
            svgEl('path', { d: 'M176 446 C172 475 174 510 181 538', fill: 'none', stroke: 'rgba(255,245,230,0.22)', 'stroke-width': 2, 'stroke-linecap': 'round' }),
            svgEl('ellipse', { cx: 200, cy: 432, rx: 32, ry: 4.5, fill: 'none', stroke: 'rgba(241,230,214,0.35)', 'stroke-width': 1 })
        );
        return vase;
    }

    // The SVG scene plus a simple "camera" that can lean in on one flower
    // or pull back to show the whole bouquet.
    function createBouquetArt(count) {
        const root = svgEl('svg', { viewBox: '0 80 400 480', role: 'img', 'aria-label': 'A bouquet of flowers in a glass vase', focusable: 'false' }, 'bouquet__svg');
        const camera = svgEl('g', null, 'bouquet__camera');
        const flowers = svgEl('g', null, 'bouquet__flowers');
        camera.append(flowers, buildVase());
        root.append(buildBouquetDefs(), camera);
        const slots = bouquetSlots(count);

        const aim = (x, y, zoom) => {
            camera.style.transform = `translate(200px, 320px) scale(${zoom}) translate(${-x}px, ${-y}px)`;
        };
        return {
            root,
            addFlower(spec, index) {
                const node = buildFlower(spec, slots[index], index);
                flowers.append(node);
                return node;
            },
            clear() { flowers.replaceChildren(); },
            focusFlower(index) {
                const slot = slots[index];
                aim(200 + (slot.x - 200) * 0.75, slot.y + 85, 1.25);
            },
            focusVase() { aim(200, 400, 1.12); },
            focusAll() { aim(200, 320, 1); }
        };
    }

    function rainPetals() {
        if (!motionOK()) return;
        const layer = el('div', 'petal-rain');
        layer.setAttribute('aria-hidden', 'true');
        const tones = Object.values(PETAL_COLORS);
        const count = window.innerWidth < 640 ? 24 : 36;
        for (let i = 0; i < count; i += 1) {
            const [, mid, tip] = tones[i % tones.length];
            const fall = el('span', 'petal-rain__petal');
            fall.style.setProperty('--x', `${(Math.random() * 100).toFixed(1)}vw`);
            fall.style.setProperty('--w', `${(9 + Math.random() * 10).toFixed(1)}px`);
            fall.style.setProperty('--duration', `${(6.5 + Math.random() * 4).toFixed(1)}s`);
            fall.style.setProperty('--delay', `${(Math.random() * 3).toFixed(2)}s`);
            fall.style.setProperty('--drift', `${((Math.random() - 0.5) * 160).toFixed(0)}px`);
            fall.style.setProperty('--spin', `${((Math.random() - 0.5) * 600).toFixed(0)}deg`);
            fall.style.setProperty('--c1', tip);
            fall.style.setProperty('--c2', mid);
            layer.append(fall);
        }
        for (let i = 0; i < 14; i += 1) {
            const spark = el('span', 'petal-rain__spark');
            spark.style.setProperty('--x', `${(30 + Math.random() * 40).toFixed(1)}vw`);
            spark.style.setProperty('--delay', `${(Math.random() * 2).toFixed(2)}s`);
            spark.style.setProperty('--duration', `${(4 + Math.random() * 3).toFixed(1)}s`);
            spark.style.setProperty('--drift', `${((Math.random() - 0.5) * 120).toFixed(0)}px`);
            layer.append(spark);
        }
        document.body.append(layer);
        setTimeout(() => layer.remove(), 15000);
    }

    const BOUQUET_KEY = 'tik-bouquet';

    function renderBouquet(host) {
        const copy = whatYouMean;
        const flowers = (flowerMessages || []).filter((item) => item && (item.title || item.message));

        const opening = el('div', 'wym__opening');
        (copy.opening || []).forEach((line) => opening.append(setLines(el('p', 'wym__line'), line)));
        stagger(Array.from(opening.children), 500);
        host.append(opening);

        if (!flowers.length) {
            host.append(createPlaceholder('The flowers are still being picked.'));
            return;
        }

        const bouquet = el('div', 'bouquet');
        bouquet.dataset.state = 'intro';
        bouquet.setAttribute('data-reveal', '');

        const stage = el('div', 'bouquet__stage');
        const random = seededRandom(614);
        for (let i = 0; i < 9; i += 1) {
            const mote = el('span', 'bouquet__mote');
            mote.setAttribute('aria-hidden', 'true');
            mote.style.setProperty('--x', `${(15 + random() * 70).toFixed(1)}%`);
            mote.style.setProperty('--size', `${(1.2 + random() * 2).toFixed(1)}px`);
            mote.style.setProperty('--duration', `${(7 + random() * 6).toFixed(1)}s`);
            mote.style.setProperty('--delay', `${(-random() * 10).toFixed(1)}s`);
            mote.style.setProperty('--drift', `${((random() - 0.5) * 60).toFixed(0)}px`);
            stage.append(mote);
        }
        const art = createBouquetArt(flowers.length);
        stage.append(art.root);
        art.focusVase();

        const makeButton = (label, variant = 'primary') => {
            const button = el('button', `button button--${variant}`);
            button.type = 'button';
            button.append(`${label} `, el('span', 'button__arrow', '→'));
            button.lastChild.setAttribute('aria-hidden', 'true');
            return button;
        };

        const panel = el('div', 'bouquet__panel');
        panel.setAttribute('aria-live', 'polite');

        const invite = el('div', 'bouquet__step bouquet__invite');
        appendParagraphs(invite, copy.invitation, 'bouquet__invite-line');
        const startButton = makeButton(copy.startLabel || 'Start');
        invite.append(startButton);

        const message = el('div', 'bouquet__step bouquet__message');
        const count = el('p', 'bouquet__count');
        const title = el('h3', 'bouquet__title');
        const text = el('p', 'bouquet__text');
        const nextButton = el('button', 'button button--primary');
        nextButton.type = 'button';
        message.append(count, title, text, nextButton);

        const finale = el('div', 'bouquet__step bouquet__finale');
        (copy.finale || []).forEach((line, i) => {
            const node = setLines(el('p', 'bouquet__finale-line'), line);
            node.style.setProperty('--i', String(i));
            finale.append(node);
        });
        const giveButton = el('button', 'button button--primary bouquet__give');
        giveButton.type = 'button';
        giveButton.textContent = copy.giveLabel || 'Take My Bouquet';
        giveButton.style.setProperty('--i', String((copy.finale || []).length + 0.5));
        finale.append(giveButton);

        const given = el('div', 'bouquet__step bouquet__given');
        const givenTitle = el('h3', 'bouquet__given-title');
        const givenDate = el('p', 'bouquet__given-date', CONFIG.anniversaryLabel || '');
        const replayButton = el('button', 'button button--quiet', copy.replayLabel || 'Grow it again');
        replayButton.type = 'button';
        given.append(givenTitle, givenDate, replayButton);

        const steps = [invite, message, finale, given];
        steps.forEach((step) => { step.hidden = true; });
        panel.append(...steps);
        bouquet.append(stage, panel);
        host.append(bouquet);

        const state = { grown: 0, token: 0, busy: false, visible: null };

        async function showStep(next) {
            const token = state.token;
            if (state.visible && state.visible !== next) {
                state.visible.classList.remove('is-in');
                await wait(450);
                if (token !== state.token) return false;
                state.visible.hidden = true;
            }
            state.visible = next;
            if (!next) return true;
            next.hidden = false;
            await nextFrame();
            next.classList.add('is-in');
            return true;
        }

        function fillMessage(index) {
            const spec = flowers[index];
            const last = index === flowers.length - 1;
            count.textContent = `${pad2(index + 1)} / ${pad2(flowers.length)}`;
            title.textContent = spec.title || '';
            setLines(text, spec.message || '');
            nextButton.replaceChildren(`${last ? copy.finishLabel || 'See your bouquet' : copy.nextLabel || 'Next flower'} `, el('span', 'button__arrow', '→'));
            nextButton.lastChild.setAttribute('aria-hidden', 'true');
        }

        async function growNext() {
            if (state.busy) return;
            state.busy = true;
            const token = state.token;
            const index = state.grown;
            if (!(await showStep(null))) return;
            bouquet.dataset.state = 'growing';
            const flower = art.addFlower(flowers[index], index);
            art.focusFlower(index);
            await wait(800);
            if (token !== state.token) return;
            flower.classList.add('is-growing');
            chime('soft');
            await wait(GROW.total * 1000);
            if (token !== state.token) return;
            flower.classList.add('is-grown');
            state.grown += 1;
            fillMessage(index);
            await showStep(message);
            state.busy = false;
            nextButton.focus({ preventScroll: true });
        }

        async function revealBouquet() {
            if (state.busy) return;
            state.busy = true;
            const token = state.token;
            if (!(await showStep(null))) return;
            art.focusAll();
            bouquet.dataset.state = 'complete';
            await wait(2000);
            if (token !== state.token) return;
            await showStep(finale);
            state.busy = false;
        }

        function showGiven() {
            const name = (CONFIG.girlfriendName || '').trim();
            givenTitle.textContent = name ? `${copy.givenTitle}, ${name}` : `${copy.givenTitle}.`;
        }

        async function giveBouquet() {
            if (state.busy) return;
            state.busy = true;
            const token = state.token;
            chime('save');
            rainPetals();
            bouquet.dataset.state = 'given';
            if (!(await showStep(null))) return;
            await wait(900);
            if (token !== state.token) return;
            showGiven();
            await showStep(given);
            local.set(BOUQUET_KEY, 'given');
            state.busy = false;
            replayButton.focus({ preventScroll: true });
        }

        async function replay() {
            state.token += 1;
            state.busy = false;
            state.grown = 0;
            local.set(BOUQUET_KEY, null);
            art.clear();
            art.focusVase();
            bouquet.dataset.state = 'intro';
            await showStep(invite);
            startButton.focus({ preventScroll: true });
        }

        startButton.addEventListener('click', () => {
            chime('soft');
            // On phones, bring the whole stage into view before the first flower grows.
            const top = stage.getBoundingClientRect().top;
            if (top < 0 || top > window.innerHeight * 0.3) {
                window.scrollBy({ top: top - 16, behavior: motionOK() ? 'smooth' : 'auto' });
            }
            growNext();
        });
        nextButton.addEventListener('click', () => {
            if (state.grown < flowers.length) growNext();
            else revealBouquet();
        });
        giveButton.addEventListener('click', giveBouquet);
        replayButton.addEventListener('click', replay);

        // Already given on an earlier visit: show the finished bouquet.
        if (local.get(BOUQUET_KEY) === 'given') {
            flowers.forEach((spec, i) => art.addFlower(spec, i).classList.add('is-grown', 'is-instant'));
            state.grown = flowers.length;
            art.focusAll();
            bouquet.dataset.state = 'given';
            showGiven();
            given.hidden = false;
            given.classList.add('is-in');
            state.visible = given;
        } else {
            invite.hidden = false;
            invite.classList.add('is-in');
            state.visible = invite;
        }
    }

    /* ----------------------------------------------------------------------
       Chapter 06 · Our Future
       ---------------------------------------------------------------------- */

    const FUTURE_KEY = 'tik-future';

    function renderFuture(host) {
        const words = el('div', 'future__words');
        (future.lines || []).forEach((line) => words.append(setLines(el('p', 'future__line'), line)));
        stagger(Array.from(words.children), 260);

        const page = el('div', 'future__page');
        page.setAttribute('data-reveal', '');

        const form = el('form', 'future-form');
        form.noValidate = true;
        form.setAttribute('aria-label', 'The first lines of Chapter 2');
        future.fields.forEach((field) => {
            const row = el('div', 'future-form__row');
            const id = `future-${field.name}`;
            const label = el('label', 'future-form__label', field.label);
            label.htmlFor = id;
            const input = el('input', 'future-form__input');
            input.id = id;
            input.name = field.name;
            input.type = 'text';
            input.maxLength = 160;
            input.autocomplete = 'off';
            input.placeholder = field.placeholder || '';
            row.append(label, input);
            form.append(row);
        });
        const submit = el('button', 'button button--primary future-form__submit');
        submit.type = 'submit';
        submit.append(`${future.submitLabel} `, el('span', 'button__arrow', '→'));
        submit.lastChild.setAttribute('aria-hidden', 'true');
        form.append(submit);

        const saved = el('div', 'future-saved');
        saved.hidden = true;
        saved.tabIndex = -1;

        page.append(form, saved);
        host.append(words, page);

        const showSaved = (values) => {
            saved.replaceChildren();
            saved.append(el('p', 'future-saved__title', future.savedTitle));
            saved.append(el('p', 'future-saved__message', future.savedMessage));
            const list = el('ol', 'future-saved__lines');
            future.fields.forEach((field) => {
                if (!values[field.name]) return;
                const item = el('li', 'future-saved__line');
                item.append(el('span', 'future-saved__label', field.label), el('span', 'future-saved__value', values[field.name]));
                list.append(item);
            });
            saved.append(list);

            const actions = el('div', 'future-saved__actions');
            const edit = el('button', 'button button--quiet', 'Change them');
            edit.type = 'button';
            edit.addEventListener('click', () => {
                saved.hidden = true;
                form.hidden = false;
                future.fields.forEach((field) => { form.elements[field.name].value = values[field.name] || ''; });
                form.elements[future.fields[0].name].focus();
            });
            const send = el('button', 'button button--quiet', 'Send them to me');
            send.type = 'button';
            send.addEventListener('click', () => shareFuture(values));
            actions.append(edit, send);
            saved.append(actions);

            form.hidden = true;
            saved.hidden = false;
        };

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const values = {};
            future.fields.forEach((field) => { values[field.name] = form.elements[field.name].value.trim(); });
            if (!Object.values(values).some(Boolean)) {
                toast('Write at least one line first.');
                form.elements[future.fields[0].name].focus();
                return;
            }
            local.set(FUTURE_KEY, values);
            chime('save');
            showSaved(values);
            saved.focus({ preventScroll: true });
        });

        const previous = local.get(FUTURE_KEY);
        if (previous && typeof previous === 'object') showSaved(previous);
    }

    function shareFuture(values) {
        const text = ['Chapter 2 — the first three lines', '']
            .concat(future.fields.filter((f) => values[f.name]).map((f) => `${f.label}: ${values[f.name]}`))
            .join('\n');
        if (navigator.share) {
            navigator.share({ text }).catch(() => { /* she closed the share sheet */ });
            return;
        }
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text)
                .then(() => toast('Copied.\nSend it to me whenever you like.'))
                .catch(() => toast('A screenshot works too.'));
            return;
        }
        toast('A screenshot works too.');
    }

    /* ----------------------------------------------------------------------
       Chapter 07 · If I Could Be There — the hug
       ---------------------------------------------------------------------- */

    /* The hug · figures
       Two silhouettes drawn facing right with their feet at (0, 0); the girl
       is mirrored in the scene. Each is drawn twice — a warm outline layer
       under a dark fill layer — so only the outer edge glows, like rim light.
       Poses (arm angles, head tilt) live in CSS under "The hug · poses". */

    // A tapered limb hanging straight down from (0, 0), with a rounded end.
    function limbPath(length, top, bottom) {
        const a = top / 2;
        const b = bottom / 2;
        return `M${-a} 0 C${-a} ${length * 0.4} ${-b} ${length * 0.7} ${-b} ${length} `
            + `A${b} ${b} 0 0 0 ${b} ${length} C${b} ${length * 0.7} ${a} ${length * 0.4} ${a} 0 Z`;
    }

    const FIGURES = {
        boy: {
            shoulder: [2, -128], upper: 30, fore: 27, arm: [9, 7, 5.6], hand: 3.1,
            neck: [2, -140],
            head: [
                'M-9.5 -12 C-9.5 -19 -5 -25 1 -25 C8 -25 12 -19 11.5 -11 C11.5 -6 13.5 -4 12 -2 C10.5 -1 10 1 9 2 C6 4 -1 3 -5 1 C-8 -2 -9.5 -6 -9.5 -12 Z',
                'M-11 -13 C-11 -25 -1 -30 7 -27 C12 -25 14 -20 12.5 -16 C8 -21 1 -21 -3 -18 C-6 -15 -8 -13 -11 -13 Z'
            ],
            body: [
                'M-3.5 -142 L4.5 -142 L4.5 -129 L-3.5 -129 Z',
                'M-12 -132 C-16 -127 -15 -113 -13.5 -101 C-12.5 -93 -11.5 -86 -11 -79 L11 -79 C11.5 -87 12 -95 12.5 -103 C13.5 -114 15 -126 11 -132 C6 -135.5 -7 -135.5 -12 -132 Z'
            ],
            hip: -84,
            leg: 'M-5.5 0 C-5.5 28 -5 56 -4.5 79 L-4.5 84 L10 84 C12.5 84 12.5 80.5 10 80 L4.5 79 C5 56 5.5 28 5.5 0 Z'
        },
        girl: {
            shoulder: [1, -114], upper: 25, fore: 23, arm: [7.2, 5.6, 4.6], hand: 2.5,
            neck: [1, -124],
            head: [
                // hair falling down her back, then her face and a soft fringe
                'M-7 -15 C-9 -25 1 -29 8 -24 C12 -20 12 -13 10 -9 C5 -13 0 -12 -3 -8 C-7 -1 -10 12 -8 30 C-15 22 -16 3 -12 -8 C-10 -11 -8 -12 -7 -15 Z',
                'M-8 -11 C-8 -17 -4 -22 1.5 -22 C7 -22 10.5 -17 10 -10 C10 -6 11.5 -4.5 10.5 -3 C9.5 -2 9 0 8 1 C5.5 3 -1 2.5 -4.5 0.5 C-7 -2 -8 -6 -8 -11 Z'
            ],
            body: [
                'M-2.8 -126 L3.2 -126 L3.2 -115 L-2.8 -115 Z',
                'M-10 -117 C-11 -106 -9 -95 -7 -86 L7 -86 C8 -95 10 -106 9 -117 C4 -120 -6 -120 -10 -117 Z'
            ],
            skirt: 'M-7.5 -88 L7.5 -88 C13 -62 19 -32 25 -6 C9 -2 -12 -2 -23 -6 C-17 -32 -12 -62 -7.5 -88 Z',
            hip: -80,
            leg: 'M-3 0 C-3 30 -3 60 -2.5 76 L-2.5 80 L7 80 C9 80 9 77 7 77 L2.5 76 C3 60 3 30 3 0 Z'
        }
    };

    function buildArm(who, side, spec) {
        const shoulder = svgEl('g', { transform: `translate(${spec.shoulder[0]} ${spec.shoulder[1]})` });
        const upper = svgEl('g', null, `hug__limb hug__${who}-${side}-upper`);
        upper.append(svgEl('path', { d: limbPath(spec.upper, spec.arm[0], spec.arm[1]) }));
        const elbow = svgEl('g', { transform: `translate(0 ${spec.upper - 1})` });
        const fore = svgEl('g', null, `hug__limb hug__${who}-${side}-fore`);
        fore.append(
            svgEl('path', { d: limbPath(spec.fore, spec.arm[1], spec.arm[2]) }),
            svgEl('ellipse', { cy: spec.fore + 1.5, rx: spec.hand, ry: spec.hand * 1.35 })
        );
        elbow.append(fore);
        upper.append(elbow);
        shoulder.append(upper);
        return shoulder;
    }

    function buildLeg(who, key, spec) {
        const hip = svgEl('g', { transform: `translate(0 ${spec.hip})` });
        const leg = svgEl('g', null, `hug__leg hug__leg--${key}`);
        leg.append(svgEl('path', { d: spec.leg }));
        hip.append(leg);
        return hip;
    }

    // The whole figure except the arm nearest to us.
    function buildFigureBody(who) {
        const spec = FIGURES[who];
        const g = svgEl('g');
        g.append(buildArm(who, 'far', spec), buildLeg(who, 'a', spec), buildLeg(who, 'b', spec));
        if (spec.skirt) g.append(svgEl('path', { d: spec.skirt }, 'hug__skirt'));
        spec.body.forEach((d) => g.append(svgEl('path', { d })));
        const neck = svgEl('g', { transform: `translate(${spec.neck[0]} ${spec.neck[1]})` });
        const head = svgEl('g', null, `hug__head hug__${who}-head`);
        spec.head.forEach((d) => head.append(svgEl('path', { d })));
        neck.append(head);
        g.append(neck);
        return g;
    }

    // Outline layer + fill layer for one piece of one figure, moved together.
    function inkedLayer(who, build) {
        const layer = svgEl('g', null, `hug__who hug__who--${who}`);
        const line = build();
        line.setAttribute('class', 'hug__line');
        const fill = build();
        fill.setAttribute('class', 'hug__fill');
        layer.append(line, fill);
        return layer;
    }

    function buildCoupleSvg() {
        const root = svgEl('svg', { viewBox: '0 0 400 250', role: 'img', 'aria-label': 'Two silhouettes walking toward each other and hugging', focusable: 'false' }, 'hug__svg');
        const couple = svgEl('g', null, 'hug__couple');
        couple.append(
            svgEl('ellipse', { cx: 200, cy: 233, rx: 150, ry: 5, class: 'hug__ground' }),
            inkedLayer('boy', () => buildFigureBody('boy')),
            inkedLayer('girl', () => buildFigureBody('girl')),
            // The arms nearest to us go over the other person — that's what makes it a hug.
            inkedLayer('boy', () => { const g = svgEl('g'); g.append(buildArm('boy', 'near', FIGURES.boy)); return g; }),
            inkedLayer('girl', () => { const g = svgEl('g'); g.append(buildArm('girl', 'near', FIGURES.girl)); return g; })
        );
        root.append(couple);
        return root;
    }

    // Where they stand (SVG units) at each moment of the scene.
    const HUG_MARKS = {
        apart: { boy: 34, girl: 366 },
        near: { boy: 180, girl: 250 },
        together: { boy: 182, girl: 208 }
    };
    const HUG_KEY = 'tik-hug';

    const hugScene = { root: null, section: null, token: 0, playing: false };

    function setHugMarks(mark, seconds) {
        const svgRoot = $('.hug__svg', hugScene.root);
        svgRoot.style.setProperty('--move', `${seconds}s`);
        svgRoot.style.setProperty('--boy-x', `${HUG_MARKS[mark].boy}px`);
        svgRoot.style.setProperty('--girl-x', `${HUG_MARKS[mark].girl}px`);
    }

    function setHugUi(on) {
        document.body.classList.toggle('is-hug-scene', on && pager.current === 'if-i-could');
    }

    function initHugChapter(host) {
        const copy = hugChapter;
        const section = host.closest('.chapter');
        const root = el('div', 'hug');
        root.dataset.scene = 'off';
        hugScene.root = root;
        hugScene.section = section;

        const opening = el('div', 'hug__opening');
        (copy.intro || []).forEach((line) => opening.append(setLines(el('p', 'hug__intro'), line)));
        const come = el('button', 'button button--primary hug__come');
        come.type = 'button';
        come.textContent = copy.button || 'Come here';
        opening.append(come);
        stagger(Array.from(opening.children), 700, 2100);

        const scene = el('div', 'hug__scene');
        scene.hidden = true;

        const stage = el('div', 'hug__stage');
        const sky = el('div', 'hug__sky');
        sky.setAttribute('aria-hidden', 'true');
        sky.append(el('div', 'sky__stars'), el('div', 'hug__moon'), el('div', 'hug__horizon'), el('div', 'hug__warmth'));
        const banner = el('p', 'hug__banner', copy.banner || '');
        const art = el('div', 'hug__art');
        const motes = el('div', 'hug__motes');
        motes.setAttribute('aria-hidden', 'true');
        const random = seededRandom(802);
        for (let i = 0; i < 12; i += 1) {
            const mote = el('span', 'hug__mote');
            mote.style.setProperty('--x', `${(30 + random() * 40).toFixed(1)}%`);
            mote.style.setProperty('--y', `${(35 + random() * 45).toFixed(1)}%`);
            mote.style.setProperty('--size', `${(1.4 + random() * 2).toFixed(1)}px`);
            mote.style.setProperty('--duration', `${(6 + random() * 5).toFixed(1)}s`);
            mote.style.setProperty('--delay', `${(-random() * 8).toFixed(1)}s`);
            mote.style.setProperty('--drift', `${((random() - 0.5) * 50).toFixed(0)}px`);
            motes.append(mote);
        }
        for (let i = 0; i < 7; i += 1) {
            const petalNode = el('span', 'hug__petal');
            const [, mid, tip] = Object.values(PETAL_COLORS)[i % 5];
            petalNode.style.setProperty('--x', `${(8 + random() * 84).toFixed(1)}%`);
            petalNode.style.setProperty('--w', `${(7 + random() * 6).toFixed(1)}px`);
            petalNode.style.setProperty('--duration', `${(11 + random() * 7).toFixed(1)}s`);
            petalNode.style.setProperty('--delay', `${(-random() * 14).toFixed(1)}s`);
            petalNode.style.setProperty('--drift', `${((random() - 0.5) * 90).toFixed(0)}px`);
            petalNode.style.setProperty('--spin', `${((random() - 0.5) * 400).toFixed(0)}deg`);
            petalNode.style.setProperty('--c1', tip);
            petalNode.style.setProperty('--c2', mid);
            motes.append(petalNode);
        }
        art.append(motes, buildCoupleSvg());
        stage.append(sky, banner, art);

        const poem = el('div', 'hug__poem');
        (copy.poem || []).forEach((verse) => poem.append(setLines(el('p', 'hug__verse'), verse)));
        const finalLine = setLines(el('p', 'hug__final'), copy.finalLine || '');
        const replay = el('button', 'button button--quiet hug__replay', copy.replayLabel || 'Once more');
        replay.type = 'button';

        scene.append(stage, poem, finalLine, replay);
        root.append(opening, scene);
        host.append(root);

        setHugMarks('apart', 0);
        come.addEventListener('click', startHugSequence);
        replay.addEventListener('click', resetChapter08);

        pager.listeners.push((id) => {
            setHugUi(id === 'if-i-could' && root.dataset.scene !== 'off');
        });

        if (local.get(HUG_KEY) === 'done') showHugFinal();
    }

    // Everything at once, for a return visit: already holding each other.
    function showHugFinal() {
        const root = hugScene.root;
        $('.chapter__header', hugScene.section).hidden = true;
        $('.hug__opening', root).hidden = true;
        $('.hug__scene', root).hidden = false;
        hugScene.section.classList.add('is-playing', 'is-done');
        setHugMarks('together', 0);
        root.dataset.scene = 'on';
        root.dataset.pose = 'hug';
        root.dataset.warm = 'true';
        root.classList.add('is-reading');
        $$('.hug__banner, .hug__verse, .hug__final', root).forEach((node) => node.classList.add('is-in'));
    }

    async function startHugSequence() {
        const root = hugScene.root;
        if (!root || hugScene.playing) return;
        hugScene.playing = true;
        const token = ++hugScene.token;
        const alive = () => token === hugScene.token;
        const section = hugScene.section;
        const motion = motionOK();

        // Darkness: the words step back.
        section.classList.add('is-playing');
        setHugUi(true);
        await wait(1000);
        if (!alive()) return;
        $('.chapter__header', section).hidden = true;
        $('.hug__opening', root).hidden = true;
        $('.hug__scene', root).hidden = false;
        window.scrollTo({ top: 0, behavior: 'instant' });

        if (!motion) {
            // Reduced motion: they are simply there, and then they hold each other.
            setHugMarks('together', 0);
            root.dataset.scene = 'on';
            root.dataset.pose = 'hug';
        } else {
            // A warm night slowly appears; two people, far apart.
            await nextFrame();
            root.dataset.scene = 'on';
            await wait(2200);
            if (!alive()) return;

            // They walk toward each other.
            root.classList.add('is-walking');
            setHugMarks('near', 6);
            await wait(6000);
            if (!alive()) return;
            root.classList.remove('is-walking');

            // They stop. A small pause.
            await wait(1200);
            if (!alive()) return;

            // He opens his arms…
            root.dataset.pose = 'open';
            await wait(1300);
            if (!alive()) return;

            // …she comes closer…
            setHugMarks('together', 1.8);
            await wait(1400);
            if (!alive()) return;

            // …and they hug.
            root.dataset.pose = 'hug';
            await wait(1300);
            if (!alive()) return;
        }

        root.dataset.warm = 'true';
        chime('open');
        await wait(1100);
        if (!alive()) return;
        await showHugReveal();
        if (!alive()) return;
        await showLovePoem();
        if (!alive()) return;

        section.classList.add('is-done');
        local.set(HUG_KEY, 'done');
        hugScene.playing = false;
    }

    async function showHugReveal() {
        $('.hug__banner', hugScene.root).classList.add('is-in');
        await wait(1800);
    }

    async function showLovePoem() {
        const token = hugScene.token;
        hugScene.root.classList.add('is-reading');
        await wait(1200);
        if (token !== hugScene.token) return;
        const verses = $$('.hug__verse', hugScene.root);
        for (const verse of verses) {
            verse.classList.add('is-in');
            // Keep each new verse in view on small screens (the hug stays pinned above).
            const rect = verse.getBoundingClientRect();
            if (rect.bottom > window.innerHeight - 24) {
                window.scrollBy({ top: rect.bottom - window.innerHeight + 72, behavior: motionOK() ? 'smooth' : 'auto' });
            }
            const lines = verse.textContent.length;
            await wait(1400 + Math.min(lines, 120) * 16);
            if (token !== hugScene.token) return;
        }
        await wait(900);
        if (token !== hugScene.token) return;
        const final = $('.hug__final', hugScene.root);
        final.classList.add('is-in');
        const rect = final.getBoundingClientRect();
        if (rect.bottom > window.innerHeight - 24) {
            window.scrollBy({ top: rect.bottom - window.innerHeight + 96, behavior: motionOK() ? 'smooth' : 'auto' });
        }
        await wait(2600);
    }

    function resetChapter08() {
        const root = hugScene.root;
        hugScene.token += 1;
        hugScene.playing = false;
        local.set(HUG_KEY, null);
        hugScene.section.classList.remove('is-playing', 'is-done');
        root.classList.remove('is-walking', 'is-reading');
        root.dataset.scene = 'off';
        delete root.dataset.pose;
        delete root.dataset.warm;
        $$('.hug__banner, .hug__verse, .hug__final', root).forEach((node) => node.classList.remove('is-in'));
        setHugMarks('apart', 0);
        $('.hug__scene', root).hidden = true;
        $('.hug__opening', root).hidden = false;
        $('.chapter__header', hugScene.section).hidden = false;
        setHugUi(false);
        window.scrollTo({ top: 0, behavior: 'instant' });
        $('.hug__come', root).focus({ preventScroll: true });
    }

    /* ----------------------------------------------------------------------
       Final page + keepsake
       ---------------------------------------------------------------------- */

    function renderFinale() {
        const host = $('[data-finale]');
        const name = (CONFIG.girlfriendName || '').trim();
        const title = el('h2', 'finale__title', name ? finale.title.replace(/\.$/, `, ${name}.`) : finale.title);
        title.id = 'finale-title';

        const lines = el('div', 'finale__lines');
        finale.lines.forEach((line) => lines.append(el('p', 'finale__line', line)));

        const closing = el('p', 'finale__closing', finale.closing);

        const dates = el('p', 'finale__dates');
        const arrow = el('span', 'finale__arrow', '→');
        arrow.setAttribute('aria-hidden', 'true');
        dates.append(
            el('span', null, CONFIG.startedOn),
            arrow,
            el('span', 'visually-hidden', ' to '),
            el('span', null, CONFIG.anniversaryOn)
        );

        const footnote = setLines(el('p', 'finale__footnote'), finale.footnote);
        const heart = el('span', 'finale__heart', '❤');
        heart.setAttribute('aria-hidden', 'true');

        const button = el('a', 'button button--primary finale__button');
        button.href = '#our-future';
        button.append(`${finale.button} `, el('span', 'button__arrow', '→'));
        button.lastChild.setAttribute('aria-hidden', 'true');

        host.append(title, lines, closing, dates, footnote, heart, button);
        stagger([title], 0);
        stagger(Array.from(lines.children), 380, 1900);
        stagger([closing, dates, footnote, heart, button], 160);
    }

    function renderKeepsake() {
        const host = $('[data-keepsake]');
        const card = el('div', 'card');
        const top = el('div', 'card__top');
        const to = el('p', 'card__field');
        to.append(el('span', 'card__key', 'To'), el('span', 'card__value', keepsake.to));
        const from = el('p', 'card__field');
        from.append(el('span', 'card__key', 'From'), el('span', 'card__value', keepsake.from));
        top.append(to, from);

        const middle = el('div', 'card__middle');
        middle.append(
            el('p', 'card__chapter', keepsake.chapter),
            el('p', 'card__date', CONFIG.anniversaryLabel),
            setLines(el('p', 'card__line'), keepsake.line)
        );

        const qr = el('div', 'card__qr');
        const showText = () => {
            qr.classList.remove('card__qr--photo');
            qr.replaceChildren(setLines(el('span'), 'You’re\nalready here.'));
        };
        if (keepsake.image) {
            // A tiny print tucked onto the card; falls back to the text if the file is missing.
            const img = el('img', 'card__photo');
            img.alt = keepsake.imageAlt || '';
            img.loading = 'lazy';
            img.decoding = 'async';
            img.addEventListener('error', showText, { once: true });
            img.src = keepsake.image;
            qr.classList.add('card__qr--photo');
            qr.append(img);
        } else {
            showText();
        }

        card.append(top, middle, qr);
        const note = setLines(el('p', 'keepsake__note'), keepsake.note);
        host.append(card, note);
        stagger([card, note], 200);
    }

    /* ----------------------------------------------------------------------
       Chapter progress (desktop rail + mobile compact indicator)
       ---------------------------------------------------------------------- */

    function setupProgress() {
        const list = $('[data-progress-list]');
        chapters.forEach((chapter) => {
            const item = el('li', 'progress__item');
            const link = el('a', 'progress__link');
            link.href = `#${chapter.id}`;
            link.dataset.target = chapter.id;
            link.append(el('span', 'progress__number', chapter.number), el('span', 'progress__name', chapter.title));
            item.append(link);
            list.append(item);
        });

        // Ordered stops for prev / next: contents, the seven chapters, the last page.
        const stops = [
            { id: 'contents', label: 'Our Story' },
            ...chapters.map((c) => ({ id: c.id, label: `${c.number} · ${c.title}` })),
            { id: 'finale', label: 'The last page' }
        ];
        const current = $('[data-progress-current]');
        const links = $$('.progress__link', list);
        const nav = $('.progress');
        let active = 0;

        const setActive = (index) => {
            active = index;
            links.forEach((link) => {
                const on = link.dataset.target === stops[index].id;
                link.classList.toggle('is-active', on);
                if (on) link.setAttribute('aria-current', 'step');
                else link.removeAttribute('aria-current');
            });
            current.textContent = stops[index].label;
            current.href = `#${stops[index].id}`;
            $('[data-step="-1"]', nav).disabled = index === 0;
            $('[data-step="1"]', nav).disabled = index === stops.length - 1;
            nav.dataset.stop = stops[index].id;
        };

        $$('[data-step]', nav).forEach((button) => {
            button.addEventListener('click', () => {
                const next = Math.max(0, Math.min(stops.length - 1, active + Number(button.dataset.step)));
                goToPage(stops[next].id);
            });
        });

        pager.listeners.push((id) => {
            nav.classList.toggle('is-quiet', id === 'welcome' || id === 'prologue');
            const index = stops.findIndex((stop) => stop.id === id);
            setActive(index === -1 ? 0 : index);
        });
        setActive(0);
    }

    /* ----------------------------------------------------------------------
       Wiring
       ---------------------------------------------------------------------- */

    const CHAPTER_RENDERERS = {
        'before-you': renderBeforeYou,
        'first-month': renderTimeline,
        'things-i-notice': renderNotes,
        'twelve-letters': renderLetters,
        'what-you-mean': renderBouquet,
        'our-future': renderFuture,
        'if-i-could': initHugChapter
    };

    function renderChapters() {
        chapters.forEach((chapter, index) => {
            const host = $(`[data-chapter-body="${chapter.id}"]`);
            if (!host) return;
            host.append(renderChapterHeader(chapter));
            const render = CHAPTER_RENDERERS[chapter.id];
            const body = el('div', 'chapter__body');
            host.append(body);
            if (render) {
                try {
                    render(body);
                } catch (error) {
                    // One broken entry in content.js should never take the whole story down.
                    console.error(`Chapter "${chapter.title}" could not be built:`, error);
                    body.append(createPlaceholder('This chapter is still being written.'));
                }
            }
            host.append(renderChapterFooter(index));
        });
    }

    function bindActions() {
        document.addEventListener('click', (event) => {
            const trigger = event.target.closest('[data-action]');
            if (!trigger) return;
            const action = trigger.dataset.action;
            if (action === 'start') startStory();
            if (action === 'sound') setSound(!sound.enabled);
            if (action === 'close-letter') closeLetter();
        });
    }

    function init() {
        setupReveal();
        fillConfigText();
        buildParticles();
        $$('[data-skyline]').forEach(buildSkyline);

        renderPrologue();
        renderContents();
        renderChapters();
        renderFinale();
        renderKeepsake();
        setupProgress();
        setupPager();
        setupLetterDialog();
        bindActions();

        if (shouldSkipLock()) showWelcome();
        else startCountdown(getUnlockTime());
    }

    init();
})();
