/* ==========================================================================
   Memories — interaction layer
   · Years render newest first; inside each year the photographs travel
     sideways as you scroll down through that year's pinned stage.
   · Narrow screens and "reduce motion" fall back to native swiping.
   ========================================================================== */
(() => {
  "use strict";

  const html = document.documentElement;
  html.classList.add("js");

  const reduceMQ = matchMedia("(prefers-reduced-motion: reduce)");
  const pinMQ    = matchMedia("(min-width: 880px) and (min-height: 540px)");
  const fineMQ   = matchMedia("(hover: hover) and (pointer: fine)");

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const formatDate = (iso) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    const month = MONTHS[Number(m) - 1] || "";
    return d ? `${Number(d)} ${month} ${y}` : `${month} ${y}`;
  };

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  const icon = (paths) => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.6");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = paths;
    return svg;
  };

  const ICONS = {
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    prev:  '<path d="M15 18 9 12l6-6"/>',
    next:  '<path d="m9 18 6-6-6-6"/>',
    sun:   '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon:  '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.6 6.6 0 0 0 10.5 10.5Z"/>',
  };

  /* ------------------------------------------------------------------ theme */
  const THEME_KEY = "memories:theme";
  const readStored = () => { try { return localStorage.getItem(THEME_KEY); } catch { return null; } };
  const writeStored = (v) => { try { localStorage.setItem(THEME_KEY, v); } catch { /* private mode */ } };

  const stored = readStored();
  if (stored === "light" || stored === "dark") html.dataset.theme = stored;

  const currentTheme = () =>
    html.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

  /* ----------------------------------------------------------------- render */
  let site = {};
  let years = [];
  let total = 0;
  let flat = [];     // every photograph, in page order — drives the lightbox
  let heroAnimated = false;   // the title strikes on once, not on every rebuild

  // A year with hundreds of links can't put them all in one rail — that would
  // be hundreds of screen-heights of sideways scrolling. The rail shows a
  // selection spread across the year; the contact sheet and the full-size
  // viewer still reach every one.
  const RAIL_MAX = 40;

  // How far back to look for year files when nothing tells us which exist.
  const PROBE_YEARS_BACK = 60;

  function renderHero() {
    const host = document.getElementById("hero");
    host.replaceChildren();

    const top = el("div", "hero__top");
    top.append(el("p", "eyebrow", site.eyebrow || "A personal archive"));
    if (site.owner) top.append(el("p", "eyebrow", site.owner));
    host.append(top);

    const title = el("h1", "hero__title");
    const name = site.title || "Memories";
    [...name].forEach((c, i) => {
      const s = el("span", "ch", c === " " ? " " : c);
      s.style.setProperty("--d", `${140 + i * 55}ms`);
      title.append(s);
    });
    host.append(title);

    // .hero__title.is-lit is what makes the letters visible at all, so it has
    // to be applied by whatever builds the title — the hero is rebuilt every
    // time the archive reloads, and a rebuilt title with no class stays blank.
    if (heroAnimated || reduceMQ.matches) {
      title.classList.add("is-lit", "is-instant");
    } else {
      heroAnimated = true;
      requestAnimationFrame(() => title.classList.add("is-lit"));
    }

    const grid = el("div", "hero__grid");
    const lede = el("p", "hero__lede reveal", site.lede || "");
    const quote = el("blockquote", "hero__quote reveal");
    quote.style.setProperty("--d", "120ms");
    if (site.quote) {
      quote.append(document.createTextNode(`“${site.quote}”`));
      if (site.author) quote.append(el("cite", null, site.author));
    }
    grid.append(lede, quote);
    host.append(grid);

    const oldest = years.length ? years[years.length - 1].year : "—";
    const newest = years.length ? years[0].year : "—";
    const stats = el("dl", "stats reveal");
    [
      ["Photographs", String(total)],
      ["Years", String(years.length)],
      ["Spanning", years.length ? `${oldest}–${newest}` : "—"],
    ].forEach(([k, v], i) => {
      const cell = el("div");
      cell.append(el("dt", null, k), el("dd", null, v));
      cell.style.setProperty("--d", `${i * 90}ms`);
      stats.append(cell);
    });
    host.append(stats);

    // contact strip: every frame in the archive, drifting past
    const every = years.flatMap((y) => y.photos || []);
    const stride = Math.max(1, Math.ceil(every.length / 16));
    const all = every.filter((_, i) => i % stride === 0);
    if (all.length) {
      const strip = el("div", "strip reveal");
      strip.setAttribute("aria-hidden", "true");
      const track = el("div", "strip__track");
      for (let pass = 0; pass < 2; pass++) {
        all.forEach((p) => {
          const img = el("img");
          img.src = p.src;
          img.alt = "";
          img.loading = "lazy";
          img.decoding = "async";
          track.append(img);
        });
      }
      strip.append(track);
      host.append(strip);
    }
  }

  function buildCard(photo, index, year) {
    const card = el("figure", "card");
    card.style.setProperty("--ar", (photo.w && photo.h ? photo.w / photo.h : 1.5).toFixed(4));

    const inner = el("div", "card__inner");
    const media = el("div", "card__media");

    const img = el("img");
    img.src = photo.src;
    img.alt = `${photo.caption}${photo.date ? `, ${formatDate(photo.date)}` : `, ${year}`}`;
    img.loading = index < 3 ? "eager" : "lazy";
    img.decoding = "async";
    if (photo.w && photo.h) { img.width = photo.w; img.height = photo.h; }
    img.addEventListener("load", () => {
      const ar = img.naturalWidth / img.naturalHeight;
      if (ar && Math.abs(ar - parseFloat(card.style.getPropertyValue("--ar"))) > 0.02) {
        card.style.setProperty("--ar", ar.toFixed(4));
        scheduleMeasure();
      }
    }, { once: true });
    media.append(img);

    const cap = el("figcaption", "card__cap");
    const shown = photo.caption || formatDate(photo.date) || `${year} · ${index + 1}`;
    cap.append(el("span", "card__title", shown));
    if (photo.caption && photo.date) {
      cap.append(el("span", "card__date", formatDate(photo.date)));
    }

    const btn = el("button", "card__btn");
    btn.type = "button";
    btn.setAttribute("aria-label", `View ${shown} full size`);
    btn.addEventListener("click", () => openLightbox(photo.flatIndex));

    inner.append(
      media,
      el("span", "card__num", String(index + 1).padStart(2, "0")),
      cap,
      el("span", "card__sheen"),
      el("span", "card__edge"),
      btn
    );
    card.append(inner);
    bindTilt(card, inner);
    return card;
  }

  function buildYear(entry) {
    const photos = entry.photos || [];
    const section = el("section", "year");
    section.id = `y-${entry.year}`;
    section.setAttribute("aria-labelledby", `h-${entry.year}`);

    const stage = el("div", "year__stage");
    stage.append(el("div", "year__numeral", entry.year));

    const head = el("div", "year__head");
    const id = el("div", "year__id");
    const h2 = el("h2", null, entry.year);
    h2.id = `h-${entry.year}`;
    id.append(h2);
    if (entry.note) id.append(el("p", "year__note", entry.note));
    head.append(id);

    if (entry.quote) {
      const q = el("blockquote", "year__quote");
      q.append(document.createTextNode(`“${entry.quote}”`));
      if (entry.author) q.append(el("cite", null, entry.author));
      head.append(q);
    }
    stage.append(head);

    const viewport = el("div", "year__viewport");
    const rail = el("div", "year__rail");
    rail.setAttribute("role", "list");

    if (photos.length) {
      photos.forEach((p) => {
        p.flatIndex = flat.length;
        p.year = entry.year;
        flat.push(p);
      });

      const picks = (entry.rail && entry.rail.length)
        ? entry.rail
        : photos.map((_, i) => i);

      picks.forEach((idx, i) => {
        const p = photos[idx];
        if (p) {
          const card = buildCard(p, i, entry.year);
          card.setAttribute("role", "listitem");
          rail.append(card);
        }
      });
    } else {
      const empty = el("figure", "card card--empty");
      const inner = el("div", "card__inner");
      const p = el("p");
      p.append(
        document.createTextNode("No links yet. Add them to "),
        el("code", null, `data/years/${entry.year}.json`),
        document.createTextNode(".")
      );
      inner.append(p);
      empty.append(inner);
      rail.append(empty);
    }

    viewport.append(rail);
    stage.append(viewport);

    const foot = el("div", "year__foot");
    const inRail = (entry.rail || photos).length;

    if (photos.length > inRail) {
      const all = el("button", "year__all");
      all.type = "button";
      all.append(
        el("strong", null, `View all ${photos.length}`),
        el("span", null, `${inRail} shown`)
      );
      all.addEventListener("click", () => openGrid(entry.year));
      foot.append(all);
    } else {
      foot.append(el("span", "year__count",
        `${photos.length} ${photos.length === 1 ? "photograph" : "photographs"}`));
    }
    const track = el("div", "year__track");
    track.append(el("i"));
    foot.append(track);
    if (photos.length > 1) {
      const hint = el("span", "year__hint");
      const scrolled = el("span", null, "Keep scrolling");
      scrolled.dataset.scroll = "";
      const swiped = el("span", null, "Swipe");
      swiped.dataset.swipe = "";
      hint.append(scrolled, swiped);
      foot.append(hint);
    }
    stage.append(foot);

    section.append(stage);
    return section;
  }

  function renderYears() {
    const main = document.getElementById("years");
    main.replaceChildren();

    if (!years.length) {
      const note = el("p", "empty-note");
      note.append(
        document.createTextNode("No years yet. Create "),
        el("code", null, "data/years/2026.json"),
        document.createTextNode(" with a list of image links in it and the "
          + "section appears here — no rebuild, no reload.")
      );
      main.append(note);
      return;
    }
    years.forEach((y) => main.append(buildYear(y)));
  }

  function renderNav() {
    const nav = document.getElementById("yearnav");
    nav.replaceChildren();
    years.forEach((y) => {
      const b = el("button", "yearnav__btn", y.year);
      b.type = "button";
      b.dataset.year = y.year;
      b.addEventListener("click", () => {
        document.getElementById(`y-${y.year}`)
          ?.scrollIntoView({ behavior: reduceMQ.matches ? "auto" : "smooth", block: "start" });
      });
      nav.append(b);
    });

    nav.append(el("div", "yearnav__sep"));

    const toggle = el("button", "themetoggle");
    toggle.type = "button";
    toggle.setAttribute("aria-label", "Switch colour theme");
    const paint = () => {
      toggle.replaceChildren(icon(currentTheme() === "dark" ? ICONS.sun : ICONS.moon));
      toggle.title = currentTheme() === "dark" ? "Switch to light" : "Switch to dark";
    };
    toggle.addEventListener("click", () => {
      const next = currentTheme() === "dark" ? "light" : "dark";
      html.dataset.theme = next;
      writeStored(next);
      paint();
    });
    paint();
    nav.append(toggle);
  }

  /* ------------------------------------------------------- scroll mechanics */
  const progressBar = document.getElementById("progress");
  const lightLayer = document.getElementById("light");
  let sections = [];
  let rafId = 0;
  let idleFrames = 99;
  let pointerX = 0, pointerY = 0;
  let rawX = 0.5, rawY = 0.35, smX = 0.5, smY = 0.35;

  function collect() {
    sections = [...document.querySelectorAll(".year")].map((node) => ({
      node,
      stage: node.querySelector(".year__stage"),
      viewport: node.querySelector(".year__viewport"),
      rail: node.querySelector(".year__rail"),
      bar: node.querySelector(".year__track"),
      numeral: node.querySelector(".year__numeral"),
      overflow: 0, travel: 0, x: 0, target: 0, p: 0,
    }));
  }

  let measureTimer = 0;
  function scheduleMeasure() {
    clearTimeout(measureTimer);
    measureTimer = setTimeout(measure, 90);
  }

  function measure() {
    const pinned = pinMQ.matches && !reduceMQ.matches;
    html.classList.toggle("pinned", pinned);

    sections.forEach((s) => {
      s.node.style.height = "";
      if (!pinned) {
        s.overflow = s.travel = s.x = s.target = 0;
        s.rail.style.transform = "";
        s.numeral.style.transform = "";
        return;
      }
      s.overflow = Math.max(0, s.rail.scrollWidth - s.viewport.clientWidth);
      s.travel = s.overflow;
      s.node.style.height = `${s.stage.offsetHeight + s.travel}px`;
    });

    update(true);
  }

  function update(snap) {
    const max = html.scrollHeight - innerHeight;
    progressBar.style.setProperty("--p", max > 0 ? (scrollY / max).toFixed(4) : "0");

    const pinned = html.classList.contains("pinned");
    let moving = false;

    for (const s of sections) {
      if (pinned && s.travel > 0) {
        s.p = clamp(-s.node.getBoundingClientRect().top / s.travel, 0, 1);
        s.target = -s.overflow * s.p;
      } else {
        s.p = 0;
        s.target = 0;
      }

      if (snap) {
        s.x = s.target;
      } else {
        s.x += (s.target - s.x) * 0.17;
        if (Math.abs(s.target - s.x) < 0.1) s.x = s.target;
        else moving = true;
      }

      if (pinned) {
        s.rail.style.transform = `translate3d(${s.x.toFixed(2)}px,0,0)`;
        s.numeral.style.transform =
          `translate3d(${(s.p * -70 + pointerX * 26).toFixed(1)}px,${(pointerY * 16).toFixed(1)}px,0)`;
      }
      if (s.bar) s.bar.style.setProperty("--p", s.p.toFixed(4));
    }
    return moving;
  }

  function pointerTick() {
    const dx = rawX - smX, dy = rawY - smY;
    if (Math.abs(dx) < 0.0006 && Math.abs(dy) < 0.0006) return false;
    smX += dx * 0.12;
    smY += dy * 0.12;
    pointerX = smX - 0.5;
    pointerY = smY - 0.5;
    lightLayer.style.setProperty("--mx", smX.toFixed(4));
    lightLayer.style.setProperty("--my", smY.toFixed(4));
    return true;
  }

  function frame() {
    rafId = 0;
    const busy = pointerTick() | update(false);
    idleFrames = busy ? 0 : idleFrames + 1;
    if (idleFrames < 10) request();
  }

  function request() {
    if (!rafId) rafId = requestAnimationFrame(frame);
  }

  function wake() {
    idleFrames = 0;
    request();
  }

  addEventListener("scroll", wake, { passive: true });
  addEventListener("resize", () => { scheduleMeasure(); wake(); }, { passive: true });
  addEventListener("orientationchange", scheduleMeasure);
  pinMQ.addEventListener("change", measure);
  reduceMQ.addEventListener("change", measure);

  addEventListener("pointermove", (e) => {
    if (!html.classList.contains("has-pointer") && e.pointerType === "mouse") {
      html.classList.add("has-pointer");
    }
    rawX = e.clientX / innerWidth;
    rawY = e.clientY / innerHeight;
    wake();
  }, { passive: true });

  /* ---- trackpad horizontal swipes and mouse dragging move the page along -- */
  addEventListener("wheel", (e) => {
    if (!html.classList.contains("pinned")) return;
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    const over = document.elementFromPoint(e.clientX, e.clientY);
    if (!over || !over.closest(".year__viewport")) return;
    e.preventDefault();
    scrollBy({ top: e.deltaX, behavior: "instant" });
  }, { passive: false });

  let drag = null;
  let swallowClick = false;

  addEventListener("pointerdown", (e) => {
    swallowClick = false;
    if (!html.classList.contains("pinned")) return;
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    if (!e.target.closest?.(".year__viewport")) return;
    drag = { x: e.clientX, moved: 0 };
    html.classList.add("is-dragging");
  });

  addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    drag.x = e.clientX;
    drag.moved += Math.abs(dx);
    scrollBy({ top: -dx, behavior: "instant" });
  });

  const endDrag = () => {
    if (!drag) return;
    swallowClick = drag.moved > 8;
    drag = null;
    html.classList.remove("is-dragging");
  };
  addEventListener("pointerup", endDrag);
  addEventListener("pointercancel", endDrag);

  addEventListener("click", (e) => {
    if (!swallowClick) return;
    swallowClick = false;
    if (e.target.closest(".card__btn")) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  /* ------------------------------------------------------------- tilt on hover */
  function bindTilt(card, inner) {
    if (!fineMQ.matches || reduceMQ.matches) return;
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = clamp((e.clientX - r.left) / r.width, 0, 1);
      const y = clamp((e.clientY - r.top) / r.height, 0, 1);
      card.style.setProperty("--sx", x.toFixed(3));
      card.style.setProperty("--sy", y.toFixed(3));
      card.style.setProperty("--px", (x - 0.5).toFixed(3));
      card.style.setProperty("--py", (y - 0.5).toFixed(3));
      inner.style.transform =
        `rotateY(${((x - 0.5) * 9).toFixed(2)}deg) rotateX(${((0.5 - y) * 7).toFixed(2)}deg) translateZ(16px)`;
    }, { passive: true });

    card.addEventListener("pointerleave", () => {
      inner.style.transform = "";
      card.style.setProperty("--px", "0");
      card.style.setProperty("--py", "0");
    });
  }

  /* --------------------------------------------------------------- reveals */
  let revealIO = null;
  let navIO = null;

  function observeReveals() {
    revealIO?.disconnect();
    if (reduceMQ.matches || !("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal, .card").forEach((n) => n.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 14% -6% 14%", threshold: 0.04 });

    revealIO = io;
    document.querySelectorAll(".reveal, .card").forEach((n) => io.observe(n));
  }

  function observeNav() {
    navIO?.disconnect();
    if (!("IntersectionObserver" in window)) return;
    const buttons = new Map(
      [...document.querySelectorAll(".yearnav__btn")].map((b) => [b.dataset.year, b])
    );
    const nav = document.getElementById("yearnav");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const year = entry.target.id.replace("y-", "");
        const btn = buttons.get(year);
        btn?.classList.toggle("is-active", entry.isIntersecting);

        if (btn && entry.isIntersecting && nav.scrollWidth > nav.clientWidth + 2) {
          nav.scrollTo({
            left: btn.offsetLeft - nav.clientWidth / 2 + btn.offsetWidth / 2,
            behavior: reduceMQ.matches ? "instant" : "smooth",
          });
        }
      });
    }, { rootMargin: "-48% 0px -48% 0px" });

    navIO = io;
    document.querySelectorAll(".year").forEach((n) => io.observe(n));
  }

  /* -------------------------------------------------------------- lightbox */
  const box = document.getElementById("lightbox");
  const boxImg = document.getElementById("lightbox-img");
  const boxTitle = document.getElementById("lightbox-title");
  const boxDate = document.getElementById("lightbox-date");
  const boxYear = document.getElementById("lightbox-year");
  const boxIndex = document.getElementById("lightbox-index");
  let boxAt = -1;
  let lastFocus = null;
  let boxHideTimer = 0;

  function paintLightbox(i) {
    const p = flat[i];
    if (!p) return;
    boxAt = i;
    boxImg.src = p.full || p.src;
    boxImg.alt = `${p.caption}${p.date ? `, ${formatDate(p.date)}` : ""}`;
    boxTitle.textContent = p.caption;
    boxDate.textContent = formatDate(p.date) || p.year;
    boxYear.textContent = p.year;
    boxIndex.textContent = `${i + 1} / ${flat.length}`;
    boxImg.style.animation = "none";
    void boxImg.offsetWidth;
    boxImg.style.animation = "";
  }

  function openLightbox(i) {
    if (!flat.length) return;
    lastFocus = document.activeElement;
    clearTimeout(boxHideTimer);
    box.hidden = false;
    paintLightbox(i);
    requestAnimationFrame(() => box.classList.add("is-open"));
    document.body.style.overflow = "hidden";
    document.getElementById("lightbox-close").focus({ preventScroll: true });
  }

  function closeLightbox() {
    box.classList.remove("is-open");
    document.body.style.overflow = "";
    clearTimeout(boxHideTimer);
    boxHideTimer = setTimeout(() => { box.hidden = true; }, reduceMQ.matches ? 0 : 300);
    lastFocus?.focus?.({ preventScroll: true });
  }

  const step = (d) => paintLightbox((boxAt + d + flat.length) % flat.length);

  document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
  document.getElementById("lightbox-prev").addEventListener("click", () => step(-1));
  document.getElementById("lightbox-next").addEventListener("click", () => step(1));
  box.addEventListener("click", (e) => { if (e.target === box) closeLightbox(); });

  /* touch gestures: the arrows are there, but nobody hunts for them */
  let boxSwipe = null;
  box.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    boxSwipe = { x: e.clientX, y: e.clientY };
  }, { passive: true });

  box.addEventListener("pointerup", (e) => {
    if (!boxSwipe) return;
    const dx = e.clientX - boxSwipe.x;
    const dy = e.clientY - boxSwipe.y;
    boxSwipe = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
    else if (dy > 90 && dy > Math.abs(dx) * 1.5) closeLightbox();
  }, { passive: true });

  box.addEventListener("pointercancel", () => { boxSwipe = null; }, { passive: true });

  addEventListener("keydown", (e) => {
    if (box.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); closeLightbox(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
  });

  /* --------------------------------------------------------- contact sheet */
  const gridPanel = document.getElementById("grid");
  const gridItems = document.getElementById("grid-items");
  const gridTitle = document.getElementById("grid-title");
  let gridHideTimer = 0;
  let gridReturn = null;

  function openGrid(year) {
    const entry = years.find((y) => y.year === year);
    if (!entry || !entry.photos.length) return;

    gridReturn = document.activeElement;
    gridTitle.textContent = `${year} — ${entry.photos.length} photographs`;

    const frag = document.createDocumentFragment();
    entry.photos.forEach((photo) => {
      const cell = el("button", "grid__cell");
      cell.type = "button";
      cell.setAttribute("aria-label",
        `View ${photo.caption || formatDate(photo.date) || "photograph"} full size`);

      const img = el("img");
      img.src = photo.src;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      cell.append(img);

      cell.addEventListener("click", () => {
        closeGrid();
        openLightbox(photo.flatIndex);
      });
      frag.append(cell);
    });

    gridItems.replaceChildren(frag);
    gridItems.scrollTop = 0;

    clearTimeout(gridHideTimer);
    gridPanel.hidden = false;
    requestAnimationFrame(() => gridPanel.classList.add("is-open"));
    document.body.style.overflow = "hidden";
    document.getElementById("grid-close").focus({ preventScroll: true });
  }

  function closeGrid() {
    if (gridPanel.hidden) return;
    gridPanel.classList.remove("is-open");
    if (box.hidden) document.body.style.overflow = "";
    clearTimeout(gridHideTimer);
    gridHideTimer = setTimeout(() => {
      gridPanel.hidden = true;
      gridItems.replaceChildren();      // release the thumbnails
    }, reduceMQ.matches ? 0 : 300);
    gridReturn?.focus?.({ preventScroll: true });
  }

  document.getElementById("grid-close").addEventListener("click", closeGrid);
  addEventListener("keydown", (e) => {
    if (!gridPanel.hidden && box.hidden && e.key === "Escape") {
      e.preventDefault();
      closeGrid();
    }
  });

  /* ------------------------------------------------- live archive syncing */
  /* Served by scripts/serve.py, the page asks whether the image folders have
     changed and rebuilds itself in place — a new year folder becomes a new
     section without a reload. On a plain static host the probe 404s and the
     page quietly stays with the manifest it was shipped with. */

  const LIVE = location.protocol === "http:" || location.protocol === "https:";
  let liveSignature = null;
  let liveMisses = 0;
  let liveTimer = 0;
  let toastTimer = 0;

  function toast(title, detail) {
    const host = document.getElementById("toast");
    if (!host) return;
    host.replaceChildren(el("strong", null, title), el("span", null, detail || ""));
    host.hidden = false;
    requestAnimationFrame(() => host.classList.add("is-up"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      host.classList.remove("is-up");
      setTimeout(() => { host.hidden = true; }, 420);
    }, 4600);
  }

  function captureAnchor() {
    if (scrollY < 12) return null;
    for (const s of sections) {
      const r = s.node.getBoundingClientRect();
      if (r.top <= innerHeight * 0.5 && r.bottom >= innerHeight * 0.5) {
        return { id: s.node.id, offset: -r.top };
      }
    }
    return null;
  }

  function restoreAnchor(anchor) {
    if (!anchor) return;
    const node = document.getElementById(anchor.id);
    if (!node) return;
    scrollTo({ top: node.getBoundingClientRect().top + scrollY + anchor.offset,
               behavior: "instant" });
    update(true);
  }

  function describeChange(freshYears, previousTotal) {
    if (freshYears.length) {
      const label = freshYears.length === 1 ? freshYears[0] : freshYears.join(", ");
      return [`${label} added`, `${total} photographs in the archive`];
    }
    const delta = total - previousTotal;
    if (delta > 0) return [`${delta} photograph${delta === 1 ? "" : "s"} added`, `${total} in the archive`];
    if (delta < 0) return [`${-delta} photograph${delta === -1 ? "" : "s"} removed`, `${total} in the archive`];
    return ["Archive updated", `${total} photographs`];
  }

  function applyData(data, quiet) {
    if (!data || !Array.isArray(data.years)) return;

    const previousYears = new Set(years.map((y) => y.year));
    const previousTotal = total;
    const anchor = captureAnchor();
    if (!box.hidden) closeLightbox();
    if (!gridPanel.hidden) closeGrid();   // its indices are about to go stale

    site = data.site || {};
    years = data.years;
    total = data.total || 0;

    renderAll();
    restoreAnchor(anchor);

    if (quiet) return;
    const fresh = years.filter((y) => !previousYears.has(y.year)).map((y) => y.year);
    toast(...describeChange(fresh, previousTotal));
  }

  async function pollArchive() {
    if (document.hidden) return;
    try {
      const res = await fetch("api/signature", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const { signature } = await res.json();
      liveMisses = 0;

      if (liveSignature === null) { liveSignature = signature; return; }
      if (signature === liveSignature) return;

      liveSignature = signature;
      applyData(await loadArchive());
    } catch {
      if (++liveMisses >= 2 && liveTimer) {
        clearInterval(liveTimer);
        liveTimer = 0;
      }
    }
  }

  function startLiveSync() {
    if (!LIVE || liveTimer) return;
    liveTimer = setInterval(pollArchive, 2000);
    pollArchive();
  }

  /* ------------------------------------------------------------ the archive */
  /* There is no build step and no manifest. The page finds which years exist
     and reads data/years/<year>.json directly, so adding a file is all it
     takes for a section to appear. */

  function railIndices(count) {
    if (count <= RAIL_MAX) return Array.from({ length: count }, (_, i) => i);
    const picks = new Set();
    for (let i = 0; i < RAIL_MAX; i++) {
      picks.add(Math.round((i * (count - 1)) / (RAIL_MAX - 1)));
    }
    return [...picks].sort((a, b) => a - b);
  }

  function normalizePhoto(raw, year) {
    // a bare string is a link; an object may add a caption, date or size
    const o = typeof raw === "string" ? { src: raw } : (raw || {});
    const src = (o.src || o.url || o.link || "").trim();
    if (!src) return null;
    return {
      src,
      full: (o.full || o.large || src).trim(),
      caption: o.caption || o.title || "",
      date: o.date || "",
      w: Number(o.w) || Number(o.width) || 0,
      h: Number(o.h) || Number(o.height) || 0,
      year,
    };
  }

  async function getJSON(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json();
  }

  async function discoverYears() {
    // 1. the dev server knows exactly which files are there
    try {
      const d = await getJSON("api/years");
      if (Array.isArray(d.years) && d.years.length) return d.years;
    } catch { /* not running under scripts/serve.py */ }

    // 2. the index the server keeps current, for plain static hosting
    try {
      const d = await getJSON("data/years/index.json");
      if (Array.isArray(d.years) && d.years.length) return d.years;
    } catch { /* no index published */ }

    // 3. nothing to go on — ask for a range of years directly
    const now = new Date().getFullYear();
    const candidates = [];
    for (let y = now + 1; y >= now - PROBE_YEARS_BACK; y--) candidates.push(String(y));
    const hits = await Promise.all(candidates.map(async (y) => {
      try {
        const res = await fetch(`data/years/${y}.json`, { method: "HEAD" });
        return res.ok ? y : null;
      } catch {
        return null;
      }
    }));
    return hits.filter(Boolean);
  }

  async function loadYear(year) {
    let raw;
    try {
      raw = await getJSON(`data/years/${year}.json`);
    } catch {
      return null;
    }
    // the file may be the full object, or simply an array of links
    const list = Array.isArray(raw) ? raw : (raw.photos || raw.images || raw.links || []);
    const meta = Array.isArray(raw) ? {} : raw;
    const photos = (Array.isArray(list) ? list : [])
      .map((p) => normalizePhoto(p, year))
      .filter(Boolean);

    return {
      year,
      note: meta.note || "",
      quote: meta.quote || "",
      author: meta.author || "",
      photos,
      rail: railIndices(photos.length),
    };
  }

  async function loadArchive() {
    let siteInfo = {};
    try {
      siteInfo = await getJSON("site.json");
    } catch { /* the page has sensible defaults without it */ }

    const found = await discoverYears();
    const loaded = (await Promise.all(found.map(loadYear))).filter(Boolean);
    loaded.sort((a, b) => b.year.localeCompare(a.year));

    return {
      site: siteInfo,
      years: loaded,
      total: loaded.reduce((n, y) => n + y.photos.length, 0),
    };
  }

  /* ------------------------------------------------------------------ boot */
  function renderAll() {
    flat = [];
    renderHero();
    renderYears();
    renderNav();
    collect();
    measure();
    observeReveals();
    observeNav();
    wake();
  }

  async function boot() {
    addEventListener("load", scheduleMeasure);
    if (document.fonts?.ready) document.fonts.ready.then(scheduleMeasure);

    if (location.protocol === "file:") {
      // fetch is blocked on file://, so the JSON can never be read this way
      renderAll();
      document.getElementById("years").replaceChildren(
        Object.assign(el("p", "empty-note"), {
          textContent: "Opened straight from the filesystem, a page can't read "
            + "its own data files. Run python3 scripts/serve.py and open the "
            + "address it prints.",
        })
      );
      return;
    }

    // Read the site's own text first, so the hero is built once, with the real
    // title. Rendering before this resolves would strike the intro on a title
    // that is replaced a moment later.
    try {
      site = await getJSON("site.json");
    } catch { /* the page has sensible defaults without it */ }

    renderAll();

    try {
      applyData(await loadArchive(), true);
    } catch {
      document.getElementById("years").replaceChildren(
        Object.assign(el("p", "empty-note"), {
          textContent: "Could not read the archive. Check that data/years/ "
            + "contains at least one <year>.json file.",
        })
      );
    }
    startLiveSync();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
