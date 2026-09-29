/* ==========================================================================
   Memories — the plane.
   Every year is a run of photographs threaded on one cord. Scrolling pulls
   the cord: what you are on opens out, everything else gathers toward the
   ends and falls into shadow. Phones, short windows and "reduce motion" lay
   the plane flat and scroll it.
   ========================================================================== */
(() => {
  "use strict";

  const M = window.Motion;
  const DATA = window.MEMORIES || { site: {}, years: [], total: 0 };
  const html = document.documentElement;

  const reduceMQ = matchMedia("(prefers-reduced-motion: reduce)");
  const wideMQ = matchMedia("(min-width: 881px) and (min-height: 541px)");
  const isFlat = () => !wideMQ.matches || reduceMQ.matches || !M;

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

  const svg = (d) => {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("aria-hidden", "true");
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", d);
    s.append(p);
    return s;
  };

  const SUN = "M12 7.6a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8M12 2.6v2M12 19.4v2M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2.6 12h2M19.4 12h2M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5";
  const MOON = "M20 14.6A8.6 8.6 0 1 1 9.4 4a6.7 6.7 0 0 0 10.6 10.6Z";

  /* ----------------------------------------------------------------- theme */

  const THEME_KEY = "memories:theme";
  const stored = (() => { try { return localStorage.getItem(THEME_KEY); } catch { return null; } })();
  if (stored === "light" || stored === "dark") html.dataset.theme = stored;

  const theme = () =>
    html.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

  /* ----------------------------------------------------------------- state */

  let site = DATA.site || {};
  let years = Array.isArray(DATA.years) ? DATA.years : [];
  let total = DATA.total || 0;
  let flat = [];          // every photograph in page order — drives the open view
  let runs = [];          // one per year
  let stopStrip = null;   // the hero strip's scroll driver

  /* ---------------------------------------------------------------- build */

  function buildPane(photo, index, year) {
    const pane = el("div", "pane");

    const frame = el("button", "pane__frame");
    frame.type = "button";
    frame.style.setProperty("--ar", (photo.w && photo.h ? photo.w / photo.h : 1.5).toFixed(4));
    frame.setAttribute("aria-label", `Open ${photo.caption}`);

    const img = el("img");
    img.src = photo.src;
    img.alt = `${photo.caption}${photo.date ? `, ${formatDate(photo.date)}` : `, ${year}`}`;
    img.loading = index < 2 ? "eager" : "lazy";
    img.decoding = "async";
    if (photo.w && photo.h) { img.width = photo.w; img.height = photo.h; }
    img.draggable = false;
    frame.append(img);
    frame.addEventListener("click", () => { if (!swallow) openView(photo.flatIndex, frame); });

    const cap = el("div", "pane__cap");
    cap.append(el("b", null, photo.caption));
    if (photo.date) cap.append(el("span", "d", formatDate(photo.date)));

    pane.append(el("i", "pane__node"), frame, cap);
    pane._frame = frame;
    return pane;
  }

  function buildRun(entry) {
    const photos = entry.photos || [];
    const run = el("section", "run");
    run.id = `y-${entry.year}`;
    run.setAttribute("aria-labelledby", `h-${entry.year}`);

    const stage = el("div", "run__stage");
    stage.append(el("div", "run__cord"));

    const h2 = el("h2", "run__year", entry.year);
    h2.id = `h-${entry.year}`;
    stage.append(h2);

    const said = el("div", "run__said");
    if (entry.note) said.append(el("p", "run__note", entry.note));
    if (entry.quote) {
      const q = el("blockquote", "run__quote");
      q.append(document.createTextNode("\u201C" + entry.quote + "\u201D"));
      if (entry.author) q.append(el("cite", null, entry.author));
      said.append(q);
    }
    if (said.childElementCount) stage.append(said);

    const thread = el("div", "thread");
    const panes = [];
    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      p.flatIndex = flat.length;
      p.year = entry.year;
      flat.push(p);
      const pane = buildPane(p, i, entry.year);
      panes.push(pane);
      thread.append(pane);
    }
    if (!photos.length) {
      run.classList.add("run--empty");
      const note = el("p", "run__note");
      note.append(
        document.createTextNode("Nothing threaded here yet. Drop photographs into "),
        el("code", null, `assets/images/${entry.year}/`),
        document.createTextNode("."));
      stage.append(note);
    }

    stage.append(thread);
    run.append(stage);
    return { run, panes };
  }

  function renderPlane() {
    const host = document.getElementById("plane");
    host.replaceChildren();
    runs = [];

    if (!years.length) {
      const empty = el("section", "run run--empty");
      const stage = el("div", "run__stage");
      stage.append(el("p", "run__note",
        "No year folders yet. Create assets/images/2026/, drop photographs in, and the first run threads itself on."));
      empty.append(stage);
      host.append(empty);
      return;
    }

    for (const y of years) {
      const built = buildRun(y);
      host.append(built.run);
      runs.push({ run: built.run, panes: built.panes, stop: null });
    }
  }

  function renderAnchors() {
    const nav = document.getElementById("anchors");
    nav.replaceChildren();

    for (const y of years) {
      const b = el("button", "anchor");
      b.type = "button";
      b.dataset.year = y.year;
      b.append(el("i"), el("span", null, y.year));
      b.addEventListener("click", () => {
        document.getElementById(`y-${y.year}`)?.scrollIntoView({
          behavior: reduceMQ.matches ? "auto" : "smooth", block: "start",
        });
      });
      nav.append(b);
    }

    const lamp = el("button", "lamp");
    lamp.type = "button";
    const paint = () => {
      lamp.replaceChildren(svg(theme() === "dark" ? SUN : MOON));
      const to = theme() === "dark" ? "daylight" : "night";
      lamp.setAttribute("aria-label", `Switch to ${to}`);
      lamp.title = `Switch to ${to}`;
    };
    lamp.addEventListener("click", () => {
      const next = theme() === "dark" ? "light" : "dark";
      html.dataset.theme = next;
      try { localStorage.setItem(THEME_KEY, next); } catch { /* private mode */ }
      paint();
    });
    paint();
    nav.append(lamp);
  }

  /* ------------------------------------------------------------- the hero */
  /* What the archive is, before you start pulling it: the name, the words,
     the measure of it, and the whole plane drifting past edge-on. */

  function renderHero() {
    const host = document.getElementById("hero");
    if (!host) return;
    host.replaceChildren();

    const title = el("h1", "hero__title");
    const name = site.title || "Memories";
    for (const ch of name) {
      const span = el("span", "ch", ch === " " ? "\u00A0" : ch);
      title.append(span);
    }
    host.append(title);

    const what = (site.eyebrow || "A personal archive").replace(/\.$/, "");
    host.append(el("p", "hero__by", site.owner ? `${what}, kept by ${site.owner}` : what));

    if (site.lede) host.append(el("p", "hero__lede", site.lede));

    if (site.quote) {
      const q = el("blockquote", "hero__quote");
      q.append(document.createTextNode("\u201C" + site.quote + "\u201D"));
      if (site.author) q.append(el("cite", null, site.author));
      host.append(q);
    }

    /* the measure of the archive, read off the cord */
    const cord = el("div", "hero__cord");
    const read = el("p", "hero__read");
    const oldest = years.length ? years[years.length - 1].year : null;
    const newest = years.length ? years[0].year : null;
    const bits = [
      `${total} held`,
      `${years.length} ${years.length === 1 ? "year" : "years"}`,
      oldest && newest ? (oldest === newest ? oldest : `${oldest}\u2013${newest}`) : null,
    ].filter(Boolean);
    for (const b of bits) read.append(el("span", "d", b));
    cord.append(read);
    host.append(cord);

    /* the plane edge-on: every photograph in the archive, drifting */
    const every = years.flatMap((y) => y.photos || []);
    if (every.length) {
      const strip = el("div", "hero__strip");
      strip.setAttribute("aria-hidden", "true");
      const track = el("div", "hero__track");
      for (let pass = 0; pass < 2; pass++) {
        for (const ph of every) {
          const img = el("img");
          img.src = ph.src;
          img.alt = "";
          img.loading = "lazy";
          img.decoding = "async";
          img.draggable = false;
          track.append(img);
        }
      }
      strip.append(track);
      host.append(strip);

      /* the plane moves because you pull it, not on a timer: the whole
         archive slides as the hero scrolls away */
      stopStrip?.();
      stopStrip = null;
      if (M && !reduceMQ.matches) {
        stopStrip = M.scroll((p) => {
          track.style.transform = `translate3d(${(-p * 50).toFixed(3)}%,0,0)`;
        }, { target: host, offset: ["start start", "end start"] });
      }
    }

    if (M && !reduceMQ.matches) {
      M.animate(title.querySelectorAll(".ch"),
        { opacity: [0, 1], y: [18, 0] },
        { delay: M.stagger(0.04, { startDelay: 0.1 }), duration: 0.5, ease: "easeOut" });
      M.animate(host.querySelectorAll(".hero__by, .hero__lede, .hero__quote, .hero__cord, .hero__strip"),
        { opacity: [0, 1] },
        { delay: M.stagger(0.08, { startDelay: 0.34 }), duration: 0.6, ease: "easeOut" });
    }
  }

  /* ------------------------------------------------------------ the gather
     Distance from the one you are on decides everything. The offset is
     asymptotic, so far photographs pile toward the ends instead of marching
     off the screen — cloth bunching on a cord rather than a filmstrip. */

  const PULL = 0.8;     // how fast the gather closes
  const FADE = 0.95;    // how fast it shrinks
  const LEAN = 2.4;     // degrees of pleat per step
  const PLEAT = 7;      // px of separation kept between gathered panes

  function gather(panes, p, spread) {
    for (let i = 0; i < panes.length; i++) {
      const pane = panes[i];
      const d = i - p;
      const ad = d < 0 ? -d : d;
      const close = 1 - Math.exp(-ad * PULL);

      const u = (d < 0 ? -1 : 1) * spread * close + d * PLEAT;
      const s = 1 - 0.4 * (1 - Math.exp(-ad * FADE));
      const r = clamp(-d * LEAN, -9, 9);
      const lit = ad < 0.5 ? 1 - ad * 2 : 0;

      pane.style.transform =
        `translate(-50%,-50%) translateX(${u.toFixed(1)}px) scale(${s.toFixed(3)}) rotate(${r.toFixed(2)}deg)`;
      pane.style.zIndex = 1000 - Math.round(ad * 100);
      pane.style.setProperty("--dim", (0.62 * close).toFixed(3));
      pane.style.setProperty("--lit", lit.toFixed(3));

      const busy = ad < 1.6;
      if (busy !== pane._busy) {
        pane._busy = busy;
        pane.style.willChange = busy ? "transform" : "auto";
      }
    }
  }

  function layout() {
    const flatNow = isFlat();
    html.classList.toggle("flat", flatNow);

    for (const r of runs) {
      r.stop?.();
      r.stop = null;

      if (flatNow) {
        r.run.style.height = "";
        for (const pane of r.panes) {
          pane.style.transform = "";
          pane.style.zIndex = "";
          pane.style.willChange = "auto";
          pane.style.removeProperty("--dim");
          pane.style.removeProperty("--lit");
        }
        continue;
      }

      const n = r.panes.length;
      if (!n) { r.run.style.height = ""; continue; }

      const steps = Math.max(0, n - 1);
      const travel = Math.round(innerHeight * 0.62);
      r.run.style.height = `${innerHeight + steps * travel}px`;

      const spread = innerWidth * 0.42;
      const panes = r.panes;
      const apply = (progress) => gather(panes, progress * steps, spread);

      apply(steps > 0
        ? clamp(-r.run.getBoundingClientRect().top / (steps * travel), 0, 1)
        : 0);

      if (steps > 0) {
        r.stop = M.scroll(apply, { target: r.run, offset: ["start start", "end end"] });
      }
    }
  }

  /* ------------------------------------------------- pull the cord by hand */

  let drag = null;
  let swallow = false;

  addEventListener("pointerdown", (e) => {
    swallow = false;
    if (html.classList.contains("flat")) return;
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    if (!e.target.closest?.(".run__stage")) return;
    drag = { x: e.clientX, moved: 0 };
  });

  addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    drag.x = e.clientX;
    drag.moved += Math.abs(dx);
    scrollBy({ top: -dx * 1.5, behavior: "instant" });
  }, { passive: true });

  const endDrag = () => {
    if (!drag) return;
    swallow = drag.moved > 8;
    drag = null;
  };
  addEventListener("pointerup", endDrag);
  addEventListener("pointercancel", endDrag);

  addEventListener("wheel", (e) => {
    if (html.classList.contains("flat")) return;
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    if (!e.target.closest?.(".run__stage")) return;
    e.preventDefault();
    scrollBy({ top: e.deltaX, behavior: "instant" });
  }, { passive: false });

  /* Focus must be able to reach a photograph that is currently gathered. */
  document.getElementById("plane").addEventListener("focusin", (e) => {
    if (html.classList.contains("flat")) return;
    const pane = e.target.closest?.(".pane");
    if (!pane) return;
    const r = runs.find((x) => x.run.contains(pane));
    if (!r) return;
    const i = r.panes.indexOf(pane);
    const steps = r.panes.length - 1;
    if (i < 0 || steps <= 0) return;
    scrollTo({
      top: r.run.offsetTop + (i / steps) * (r.run.offsetHeight - innerHeight),
      behavior: reduceMQ.matches ? "instant" : "smooth",
    });
  });

  /* A photograph is a place you can send someone: the address bar carries
     whichever one is open, so a link opens straight onto it. */
  const slug = (p) =>
    `${p.year}-${(p.caption || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

  const findBySlug = (want) => {
    if (!want) return -1;
    for (let i = 0; i < flat.length; i++) if (slug(flat[i]) === want) return i;
    return -1;
  };

  /* -------------------------------------------------------- the open view */

  const view = document.getElementById("open");
  const viewImg = document.getElementById("open-img");
  const viewTitle = document.getElementById("open-title");
  const viewDate = document.getElementById("open-date");
  const viewWhere = document.getElementById("open-where");
  let viewAt = -1;
  let lastFocus = null;
  let anim = null;

  function paintView(i) {
    const p = flat[i];
    if (!p) return;
    viewAt = i;
    viewImg.src = p.src;
    viewImg.alt = `${p.caption}${p.date ? `, ${formatDate(p.date)}` : ""}`;
    viewTitle.textContent = p.caption;
    viewDate.textContent = formatDate(p.date) || p.year;
    viewWhere.textContent = `${p.year} / ${String(i + 1).padStart(2, "0")} of ${flat.length}`;
  }

  function openView(i, from) {
    if (!flat.length || i == null) return;
    lastFocus = document.activeElement;
    view.hidden = false;
    paintView(i);
    document.body.style.overflow = "hidden";
    view.classList.add("is-open");
    document.getElementById("open-close").focus({ preventScroll: true });
    try { history.replaceState(null, "", "#" + slug(flat[i])); } catch { /* file:// */ }

    if (!M || reduceMQ.matches) { view.style.opacity = "1"; return; }
    M.animate(view, { opacity: [0, 1] }, { duration: 0.22, ease: "easeOut" });

    const settle = () => {
      if (!from) return;
      const a = from.getBoundingClientRect();
      const b = viewImg.getBoundingClientRect();
      if (!a.width || !b.width) return;
      anim?.stop?.();
      anim = M.animate(viewImg, {
        x: [(a.left + a.width / 2) - (b.left + b.width / 2), 0],
        y: [(a.top + a.height / 2) - (b.top + b.height / 2), 0],
        scaleX: [a.width / b.width, 1],
        scaleY: [a.height / b.height, 1],
      }, { type: "spring", bounce: 0.12, visualDuration: 0.4 });
    };
    if (viewImg.complete) requestAnimationFrame(settle);
    else viewImg.addEventListener("load", () => requestAnimationFrame(settle), { once: true });
  }

  function closeView() {
    try { history.replaceState(null, "", location.pathname + location.search); }
    catch { /* file:// */ }
    document.body.style.overflow = "";
    lastFocus?.focus?.({ preventScroll: true });
    if (!M || reduceMQ.matches) {
      view.classList.remove("is-open"); view.hidden = true; return;
    }
    M.animate(view, { opacity: [1, 0] }, { duration: 0.18, ease: "easeIn" }).then(() => {
      view.classList.remove("is-open");
      view.hidden = true;
      viewImg.style.transform = "";
    });
  }

  const step = (d) => {
    if (!flat.length) return;
    const next = (viewAt + d + flat.length) % flat.length;
    paintView(next);
    try { history.replaceState(null, "", "#" + slug(flat[next])); } catch { /* file:// */ }
    if (M && !reduceMQ.matches) {
      anim?.stop?.();
      anim = M.animate(viewImg, { opacity: [0, 1], x: [d * 30, 0] },
        { type: "spring", bounce: 0, visualDuration: 0.28 });
    }
  };

  document.getElementById("open-close").addEventListener("click", closeView);
  document.getElementById("open-prev").addEventListener("click", () => step(-1));
  document.getElementById("open-next").addEventListener("click", () => step(1));
  view.addEventListener("click", (e) => {
    if (e.target === view || e.target.classList.contains("open__stage")) closeView();
  });

  let swipe = null;
  view.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    swipe = { x: e.clientX, y: e.clientY };
  }, { passive: true });
  view.addEventListener("pointerup", (e) => {
    if (!swipe) return;
    const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
    else if (dy > 90 && dy > Math.abs(dx) * 1.5) closeView();
  }, { passive: true });
  view.addEventListener("pointercancel", () => { swipe = null; }, { passive: true });

  addEventListener("keydown", (e) => {
    if (view.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); closeView(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    else if (e.key === "Tab") {
      const stops = view.querySelectorAll("button");
      const first = stops[0], last = stops[stops.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* --------------------------------------------------- which year you are on */

  let atIO = null;
  function watchAnchors() {
    atIO?.disconnect();
    if (!("IntersectionObserver" in window)) return;
    const nodes = new Map([...document.querySelectorAll(".anchor")].map((b) => [b.dataset.year, b]));
    const nav = document.getElementById("anchors");

    atIO = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const node = nodes.get(entry.target.id.replace("y-", ""));
        if (!node) continue;
        node.classList.toggle("is-at", entry.isIntersecting);
        if (entry.isIntersecting && nav.scrollWidth > nav.clientWidth + 2) {
          nav.scrollTo({
            left: node.offsetLeft - nav.clientWidth / 2 + node.offsetWidth / 2,
            behavior: reduceMQ.matches ? "instant" : "smooth",
          });
        }
      }
    }, { rootMargin: "-46% 0px -46% 0px" });

    for (const s of document.querySelectorAll(".run")) atIO.observe(s);
  }

  /* --------------------------------------------------- live archive syncing */

  const LIVE = location.protocol === "http:" || location.protocol === "https:";
  let signature = DATA.signature || null;
  let misses = 0, timer = 0, slipTimer = 0;

  function slip(title, detail) {
    const host = document.getElementById("slip");
    if (!host) return;
    host.replaceChildren(el("strong", null, title), el("span", null, detail || ""));
    host.hidden = false;
    requestAnimationFrame(() => host.classList.add("is-up"));
    clearTimeout(slipTimer);
    slipTimer = setTimeout(() => {
      host.classList.remove("is-up");
      setTimeout(() => { host.hidden = true; }, 400);
    }, 4600);
  }

  function anchorNow() {
    if (scrollY < 12) return null;
    for (const r of runs) {
      const b = r.run.getBoundingClientRect();
      if (b.top <= innerHeight * 0.5 && b.bottom >= innerHeight * 0.5) {
        return { id: r.run.id, offset: -b.top };
      }
    }
    return null;
  }

  function restore(a) {
    if (!a) return;
    const node = document.getElementById(a.id);
    if (!node) return;
    scrollTo({ top: node.getBoundingClientRect().top + scrollY + a.offset, behavior: "instant" });
  }

  function describe(fresh, was) {
    if (fresh.length) return [`${fresh.join(", ")} threaded on`, `${total} photographs held`];
    const d = total - was;
    if (d > 0) return [`${d} photograph${d === 1 ? "" : "s"} added`, `${total} held`];
    if (d < 0) return [`${-d} photograph${d === -1 ? "" : "s"} removed`, `${total} held`];
    return ["Archive updated", `${total} photographs`];
  }

  function apply(data) {
    if (!data || !Array.isArray(data.years)) return;
    const had = new Set(years.map((y) => y.year));
    const was = total;
    const at = anchorNow();
    if (!view.hidden) closeView();

    site = data.site || {};
    years = data.years;
    total = data.total || 0;

    paint();
    restore(at);
    slip(...describe(years.filter((y) => !had.has(y.year)).map((y) => y.year), was));
  }

  async function poll() {
    if (document.hidden) return;
    try {
      const res = await fetch("api/signature", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const { signature: next } = await res.json();
      misses = 0;
      if (signature === null) { signature = next; return; }
      if (next === signature) return;
      signature = next;
      const fresh = await fetch("api/memories", { cache: "no-store" });
      if (!fresh.ok) throw new Error(String(fresh.status));
      apply(await fresh.json());
    } catch {
      if (++misses >= 2 && timer) { clearInterval(timer); timer = 0; }
    }
  }

  /* ------------------------------------------------------------------ boot */

  function paint() {
    flat = [];
    renderHero();
    renderPlane();
    renderAnchors();
    layout();
    watchAnchors();
  }

  let resizeTimer = 0;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layout, 120);
  }, { passive: true });
  addEventListener("orientationchange", () => setTimeout(layout, 160));
  wideMQ.addEventListener("change", layout);
  reduceMQ.addEventListener("change", layout);

  function openFromHash() {
    const i = findBySlug(decodeURIComponent(location.hash.replace(/^#/, "")));
    if (i < 0) return;
    const pane = document.querySelectorAll(".pane")[i];
    openView(i, pane?.querySelector(".pane__frame"));
  }

  function boot() {
    paint();
    openFromHash();
    addEventListener("hashchange", () => {
      if (!location.hash && !view.hidden) closeView();
      else if (location.hash) openFromHash();
    });
    addEventListener("load", layout);
    if (document.fonts?.ready) document.fonts.ready.then(layout);
    if (LIVE && !timer) { timer = setInterval(poll, 2000); poll(); }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
