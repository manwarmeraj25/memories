/* Harvest the image links out of a Google Photos shared album.
   ---------------------------------------------------------------------------
   A shared album page builds itself with JavaScript and only ever keeps the
   visible thumbnails in the document, so nothing outside a real browser can
   read the whole list. This runs inside your own browser session instead.

   IT MATTERS WHICH PAGE YOU RUN THIS ON. Links taken from your own library
   at photos.google.com are tied to your signed-in session: they load for you
   and send everyone else to a Google sign-in page. Links from the public
   share page are readable by anyone. Run this on the share link, the one that
   looks like https://photos.app.goo.gl/… — adding ?_imcp=1 to the end opens
   the album in the browser instead of bouncing you to the app.

   1. Open the SHARED ALBUM link in Safari or Chrome.
   2. Safari needs its developer tools once: Settings → Advanced →
      "Show features for web developers". Then Develop → Show JavaScript Console.
      (Chrome: View → Developer → JavaScript Console.)
   3. Paste this whole file into the console and press Return.
   4. It scrolls the album to the end, collecting as it goes, then copies a
      ready-made year file to your clipboard.
   5. Paste that into data/years/<year>.json.

   Nothing is uploaded anywhere; it only reads the page you already have open.
*/
(async () => {
  const WIDTH = 1800;        // the size suffix asked of Google's CDN
  const PAUSE = 450;         // ms between scroll steps, for lazy loading
  const PATIENCE = 8;        // stop after this many steps find nothing new

  const found = new Map();   // src -> {src, w, h}

  const biggestScroller = () => {
    let best = document.scrollingElement || document.documentElement;
    let bestSize = best ? best.scrollHeight : 0;
    for (const el of document.querySelectorAll("div")) {
      const style = getComputedStyle(el);
      const scrolls = /auto|scroll/.test(style.overflowY);
      if (scrolls && el.scrollHeight > bestSize) {
        best = el;
        bestSize = el.scrollHeight;
      }
    }
    return best;
  };

  const harvest = () => {
    for (const img of document.querySelectorAll("img")) {
      const raw = img.currentSrc || img.src || "";
      if (!raw.includes("googleusercontent.com/pw/")) continue;
      const base = raw.split("=")[0];
      if (found.has(base)) continue;
      const w = img.naturalWidth || 0;
      const h = img.naturalHeight || 0;
      // the thumbnail's own size is not useful, but its shape is
      found.set(base, w && h ? { src: `${base}=w${WIDTH}`, w, h }
                             : { src: `${base}=w${WIDTH}` });
    }
  };

  const scroller = biggestScroller();
  console.log("Collecting… scrolling the album to the end.");

  let idle = 0;
  let last = 0;
  while (idle < PATIENCE) {
    harvest();
    if (found.size > last) {
      last = found.size;
      idle = 0;
      console.log(`  ${found.size} so far…`);
    } else {
      idle++;
    }
    scroller.scrollBy(0, scroller.clientHeight * 0.9);
    await new Promise((r) => setTimeout(r, PAUSE));
  }
  harvest();

  const photos = [...found.values()];
  const yearFile = {
    note: "",
    quote: "",
    author: "",
    photos,
  };
  const text = JSON.stringify(yearFile, null, 2);

  console.log(`Done — ${photos.length} photographs.`);
  if (typeof copy === "function") {
    copy(text);
    console.log("Copied to your clipboard. Paste it into data/years/<year>.json");
  } else {
    console.log("Select and copy the JSON below:");
    console.log(text);
  }
  return photos.length;
})();
