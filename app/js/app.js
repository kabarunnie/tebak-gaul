(function () {
  const B = MiniBoot;
  const root = document.getElementById("screen");
  const KEY = "tebak-gaul-v1";
  let bank = [];
  let extra = 0;

  function today() { return B.wibDateISO(); }
  function hash(s) { var h=0; for (var i=0;i<s.length;i++) h=(h*33+s.charCodeAt(i))>>>0; return h; }
  function itemAt(i) { return bank[i % bank.length]; }
  function dailyBase() { return hash(today()) % bank.length; }
  function choicesFor(item, i) {
    var others = [];
    var start = hash(item.word + today()) % bank.length;
    for (var k = 1; others.length < 3 && k < bank.length; k++) {
      var o = bank[(start + k) % bank.length];
      if (o.word !== item.word) others.push(o.meaning);
    }
    var all = others.concat([item.meaning]);
    var seed = hash("c" + item.word + today() + i);
    all.sort(function (a,b) { return ((seed + a.length) % 7) - ((seed + b.length) % 7); });
    return all;
  }
  function rec() { return B.load(KEY, { days: {} }); }

  function render() {
    var base = dailyBase();
    var i = base + extra;
    var item = itemAt(i);
    var day = rec().days[today()] || { answers: {}, extra: 0 };
    extra = Math.max(extra, day.extra || 0);
    var ch = choicesFor(item, i);
    var picked = day.answers[item.word];
    var html = '<div class="screen-fade"><div class="top"><div><div class="eyebrow">Kamus gaul harian</div><h1>Tebak Gaul</h1></div><div class="date-chip">' + B.escapeHtml(B.formatIdDate()) + "</div></div>";
    html += '<div class="card"><p class="muted">Apa arti kata ini?</p><p class="lead" style="font-size:36px">' + B.escapeHtml(item.word) + "</p>";
    html += '<div class="choices">';
    ch.forEach(function (c, n) {
      var cls = "choice";
      if (picked != null) {
        if (c === item.meaning) cls += " correct";
        else if (c === picked && c !== item.meaning) cls += " wrong";
      }
      html += '<button class="' + cls + '" data-c="' + n + '"' + (picked!=null?" disabled":"") + ">" + B.escapeHtml(c) + "</button>";
    });
    html += "</div>";
    if (picked != null) {
      var ok = picked === item.meaning;
      html += '<p class="' + (ok?"ok-banner":"warn-banner") + '" style="margin-top:12px">' + (ok ? "Pas." : "Arti yang dipakai di sini: " + item.meaning) + "</p>";
      html += '<div data-ad-slot="banner" hidden></div>';
      html += '<div class="btn-row two"><button class="btn" id="share">Bagikan</button><button class="btn secondary" id="lagi">Kata lain</button></div>';
      html += '<div class="affiliate-row"><div data-affiliate="shopee" hidden><a href="#"><span data-affiliate-label>Shopee</span></a></div><div data-affiliate="tokopedia" hidden><a href="#"><span data-affiliate-label>Tokopedia</span></a></div></div>';
      html += '<button class="stars-btn" data-stars hidden><span data-stars-label>Hapus iklan</span></button>';
    }
    html += "</div><p class='footer-links'>Arti disusun sebagai penjelasan aplikasi, bukan kamus resmi. Satu kata utama per hari; kata lain bersifat tambahan.</p></div>";
    root.innerHTML = html;
    if (MiniAds && MiniAds.apply) MiniAds.apply(root);
    Array.prototype.forEach.call(document.querySelectorAll("[data-c]"), function (b) {
      b.onclick = function () {
        var c = ch[Number(b.getAttribute("data-c"))];
        var r = rec();
        r.days[today()] = r.days[today()] || { answers: {}, extra: extra };
        r.days[today()].answers[item.word] = c;
        B.store(KEY, r);
        if (c === item.meaning && extra === 0) B.updateStreak(KEY + "-streak", today());
        render();
      };
    });
    var lg = document.getElementById("lagi");
    if (lg) lg.onclick = function () {
      function go() {
        extra += 1;
        var r = rec();
        r.days[today()] = r.days[today()] || { answers: {}, extra: 0 };
        r.days[today()].extra = extra;
        B.store(KEY, r);
        MiniAds.maybeInterstitial();
        render();
      }
      if (MiniAds.rewardedAvailable()) {
        MiniAds.showRewarded().then(function (res) { if (res.ok) go(); else B.toast("Iklan tambahan belum diatur atau belum selesai. Tetap di kata hari ini."); });
      } else go();
    };
    var sh = document.getElementById("share");
    if (sh) sh.onclick = function () {
      var streak = B.load(KEY + "-streak", { count: 0 });
      var card = B.drawShareCard({
        bg: "#140510", ink: "#FFE8F3", muted: "#E7A0C0", accent: "#FF4F9A", wash: "rgba(255,79,154,0.16)",
        eyebrow: "Tebak Gaul", title: item.word,
        lines: [{ text: B.formatIdDate(), muted: true }, { text: picked === item.meaning ? "Arti pas" : "Belum pas", big: true }, { text: "Beruntun " + (streak.count||0) + " hari" }],
        footer: "kabarunnie.github.io/tebak-gaul"
      });
      B.shareCanvas(card, "Tebak Gaul: " + item.word, "https://kabarunnie.github.io/tebak-gaul/");
    };
  }

  B.setupTelegram();
  Promise.all([fetch("data/gaul.json").then(function (r) { return r.json(); }), MiniAds.load("data/ads.json")]).then(function (res) {
    bank = res[0]; render();
  });
})();
