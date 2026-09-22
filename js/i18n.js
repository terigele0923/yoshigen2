// JSONの読み込み・多言語切り替え・各ページの内容表示を管理する。
(function () {
  const LANGS = ["ja", "zh", "en"];
  const labels = { ja: "日本語", zh: "中文", en: "English" };
  let dictionary = null;
  let siteConfig = null;

  // JSONの文字列をHTMLに埋め込む前に、特殊文字をエスケープする。
  const escapeHTML = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        })[char],
    );

  // ドット区切りのキー（例：home.title）から翻訳データの値を取得する。
  function getValue(source, path) {
    return path.split(".").reduce((value, key) => value && value[key], source);
  }

  // URLのlang指定、保存済みの言語、日本語の順で表示言語を決める。
  function currentLang() {
    const param = new URLSearchParams(window.location.search).get("lang");
    let saved = null;
    try {
      saved = window.localStorage.getItem("yoshigen-lang");
    } catch (_) {
      /* Storage may be blocked in local previews. */
    }
    return LANGS.includes(param) ? param : LANGS.includes(saved) ? saved : "ja";
  }

  // 会社概要・連絡先・銀行情報などの項目名と値の一覧を表示する。
  function renderRows(target, rows) {
    if (!target || !Array.isArray(rows)) return;
    target.innerHTML = rows
      .map(
        (row) =>
          `<dl class="info-row"><dt>${escapeHTML(row.label)}</dt><dd>${escapeHTML(row.value)}</dd></dl>`,
      )
      .join("");
  }

  // 事業紹介や企業理念のカードを表示する。
  function renderFeatureCards(target, items, linkLabel) {
    if (!target || !Array.isArray(items)) return;
    target.innerHTML = items
      .map(
        (item, index) =>
          `<article class="feature-card tilt-card"><span class="feature-index">${String(index + 1).padStart(2, "0")}</span><div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.text)}</p></div>${item.link ? `<a class="card-link" href="${escapeHTML(item.link)}">${escapeHTML(linkLabel || "View more")}</a>` : ""}</article>`,
      )
      .join("");
  }

  // トップのメインビジュアル内に、先頭3件の事業紹介リンクを表示する。
  function renderHeroServices(target, items) {
    if (!target || !Array.isArray(items)) return;
    target.innerHTML = items
      .slice(0, 3)
      .map(
        (item) =>
          `<a class="hero-quick-card" href="${escapeHTML(item.link || "products.html")}"><strong>${escapeHTML(item.title)}</strong><span>${escapeHTML(item.text)}</span></a>`,
      )
      .join("");
  }

  // 取引の流れを手順ごとのカードで表示する。
  function renderFlow(target, items) {
    if (!target || !Array.isArray(items)) return;
    target.innerHTML = items
      .map(
        (item) =>
          `<article class="flow-card"><span class="flow-step">${escapeHTML(item.step)}</span><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.text)}</p></article>`,
      )
      .join("");
  }

  // 商品写真・分類・説明・取扱例・問い合わせリンクを商品カードにまとめる。
  function renderProducts(target, items, copy) {
    if (!target || !Array.isArray(items)) return;
    target.innerHTML = items
      .map(
        (item, index) =>
          `<article class="product-card" data-group="${escapeHTML(item.group)}"><div class="product-visual"><img src="${escapeHTML(item.image || "")}" alt="${escapeHTML(item.title)} — ${escapeHTML(copy.illustrationLabel)}" width="420" height="320" loading="lazy"><span class="product-number">${String(index + 1).padStart(2, "0")}</span></div><div class="product-card-content"><span class="category-pill">${escapeHTML(item.category)}</span><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.text)}</p><div class="product-examples"><small>${escapeHTML(copy.examplesLabel)}</small><p>${escapeHTML(item.examples)}</p></div><a class="product-enquiry" href="contact.html">${escapeHTML(copy.enquiryLabel)} <span aria-hidden="true">↗</span></a></div></article>`,
      )
      .join("");
  }

  // 商品分類のボタンを作成し、選択された分類で商品を絞り込む。
  function renderProductFilters(copy) {
    const target = document.querySelector('[data-render="productFilters"]');
    if (!target) return;
    target.innerHTML = copy.filters
      .map(
        (filter, index) =>
          `<button type="button" data-filter="${escapeHTML(filter.id)}" aria-pressed="${index === 0}">${escapeHTML(filter.label)}</button>`,
      )
      .join("");
    target.onclick = (event) => {
      const button = event.target.closest("button[data-filter]");
      if (!button) return;
      target
        .querySelectorAll("button")
        .forEach((node) =>
          node.setAttribute("aria-pressed", String(node === button)),
        );
      document
        .querySelectorAll('[data-render="products"] .product-card')
        .forEach((card) => {
          card.hidden =
            button.dataset.filter !== "all" &&
            card.dataset.group !== button.dataset.filter;
        });
    };
  }

  // 設備の概要と詳細欄へのリンクをカードで表示する。
  function renderCases(target, items, images) {
    if (!target || !Array.isArray(items)) return;
    target.innerHTML = items
      .map((item, index) => {
        const image = images[item.id] || "";
        return `<a class="case-card tilt-card" href="#facility-detail-${index + 1}" style="--case-bg:url('${escapeHTML(image)}')"><div class="case-stat">${escapeHTML(item.stat)}</div><div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.text)}</p></div></a>`;
      })
      .join("");
  }

  // 設備ごとの写真・説明・詳細項目を表示する。
  function renderFacilityDetails(target, items, images) {
    if (!target || !Array.isArray(items)) return;
    target.innerHTML = items
      .map((item, index) => {
        const points = Array.isArray(item.detailItems) ? item.detailItems : [];
        const pointList = points
          .map((point) => `<li>${escapeHTML(point)}</li>`)
          .join("");
        return `<article class="facility-detail" id="facility-detail-${index + 1}"><div class="facility-detail-visual" style="background-image:url('${escapeHTML(images[item.id] || "")}')"></div><div class="facility-detail-body"><p class="section-kicker">${escapeHTML(item.stat || String(index + 1).padStart(2, "0"))}</p><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.detailLead || item.text)}</p>${pointList ? `<ul class="detail-list">${pointList}</ul>` : ""}</div></article>`;
      })
      .join("");
  }

  // 写真と説明文をギャラリーのカードで表示する。
  function renderGallery(target, items, images) {
    if (!target || !Array.isArray(items)) return;
    target.innerHTML = items
      .map(
        (item) =>
          `<article class="gallery-card tilt-card"><div class="gallery-visual" style="background-image:url('${escapeHTML(images[item.id] || "")}')"></div><div class="gallery-card-content"><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.text)}</p></div></article>`,
      )
      .join("");
  }

  // 各ページのdata-render属性に対応する場所へ、JSONの内容を表示する。
  function renderDynamic(data, site, lang) {
    // 商品の共通情報に選択言語の文章を重ねる。翻訳がなければ日本語を使う。
    const products = site.products.map((item) => ({
      ...item,
      ...(item[lang] || item.ja),
    }));
    const media = site.media;
    document
      .querySelectorAll('[data-render="heroServices"]')
      .forEach((target) =>
        renderHeroServices(target, data.home && data.home.services),
      );
    renderFeatureCards(
      document.querySelector('[data-render="homeServices"]'),
      data.home && data.home.services,
      data.common && data.common.viewMore,
    );
    renderFlow(
      document.querySelector('[data-render="homeFlow"]'),
      data.home && data.home.flow,
    );
    renderRows(
      document.querySelector('[data-render="companyOutline"]'),
      data.company && data.company.outline,
    );
    renderFeatureCards(
      document.querySelector('[data-render="companyPhilosophy"]'),
      data.company && data.company.philosophy,
      data.common && data.common.viewMore,
    );
    renderProducts(
      document.querySelector('[data-render="products"]'),
      products,
      data.products,
    );
    renderProducts(
      document.querySelector('[data-render="homeProducts"]'),
      products,
      data.products,
    );
    renderProductFilters(data.products);
    renderCases(
      document.querySelector('[data-render="facilities"]'),
      data.facilities && data.facilities.cases,
      media.facilities,
    );
    renderFacilityDetails(
      document.querySelector('[data-render="facilityDetails"]'),
      data.facilities && data.facilities.cases,
      media.facilities,
    );
    renderGallery(
      document.querySelector('[data-render="gallery"]'),
      data.gallery && data.gallery.sections,
      media.gallery,
    );
    renderRows(
      document.querySelector('[data-render="contactRows"]'),
      data.contact && data.contact.contactRows,
    );
    renderRows(
      document.querySelector('[data-render="bankRows"]'),
      data.contact && data.contact.bankRows,
    );
  }

  // 翻訳文をdata/i18n.jsonから読み込み、ページ内で再利用する。
  async function loadDictionary() {
    if (dictionary) return dictionary;
    const response = await fetch("data/i18n.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`i18n.json: ${response.status}`);
    dictionary = await response.json();
    return dictionary;
  }

  // 商品・画像・地図の設定をdata/site.jsonから読み込み、ページ内で再利用する。
  async function loadSiteConfig() {
    if (siteConfig) return siteConfig;
    const response = await fetch("data/site.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`site.json: ${response.status}`);
    siteConfig = await response.json();
    return siteConfig;
  }

  // 共通設定からメインビジュアル・ページ背景・地図を設定する。
  function renderSite(config) {
    const carousel = document.getElementById("lpCarousel");
    const track = carousel && carousel.querySelector(".hero-track");
    if (
      track &&
      Array.isArray(config.hero.slides) &&
      config.hero.slides.length
    ) {
      const template = track.querySelector(".hero-slide");
      const slides = config.hero.slides.map((image, index) => {
        const slide = template.cloneNode(true);
        slide.classList.toggle("active", index === 0);
        slide.style.backgroundImage = `url(${JSON.stringify(image)})`;
        return slide;
      });
      track.replaceChildren(...slides);
    }
    document.querySelectorAll(".page-hero-bg").forEach((hero) => {
      hero.style.backgroundImage = `url(${JSON.stringify(config.pageHeroImage)})`;
    });
    const map = document.querySelector(".map-frame iframe");
    if (map)
      map.src = `https://www.google.com/maps?q=${encodeURIComponent(config.contact.mapQuery)}&output=embed`;
  }

  // 指定言語の文章・商品一覧・言語ボタンを更新し、表示完了を通知する。
  async function applyLanguage(lang) {
    const [all, site] = await Promise.all([loadDictionary(), loadSiteConfig()]);
    if (!document.body.dataset.siteReady) {
      renderSite(site);
    }
    const data = all[lang] || all.ja;
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem("yoshigen-lang", lang);
    } catch (_) {
      /* Language switching does not require storage. */
    }
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const value = getValue(data, node.dataset.i18n);
      if (value !== undefined) node.textContent = value;
    });
    const title = document.querySelector("title[data-title-key]");
    if (title) {
      const value = getValue(data, title.dataset.titleKey);
      if (value) document.title = value;
    }
    document.querySelectorAll(".lang-switch button").forEach((button) => {
      button.textContent = labels[button.dataset.lang] || button.dataset.lang;
      button.classList.toggle("active", button.dataset.lang === lang);
    });
    renderDynamic(data, site, lang);
    document.body.dataset.siteReady = "true";
    document.querySelector(".content-load-error")?.remove();
    // main.jsに表示完了を知らせ、カードなどの演出を初期化できるようにする。
    window.dispatchEvent(new CustomEvent("yoshigen:i18n-ready"));
  }

  // JSONを読み込めない場合に、案内文と再読み込みボタンを表示する。
  function showLoadError(error) {
    console.error("Content load failed:", error);
    if (document.querySelector(".content-load-error")) return;
    const notice = document.createElement("div");
    notice.className = "content-load-error container";
    notice.setAttribute("role", "alert");
    const message = document.createElement("p");
    message.textContent =
      window.location.protocol === "file:"
        ? "本文のJSONデータを読み込めません。XAMPPのApacheを起動して、http://localhost/yoshigen/ から開いてください。"
        : "本文のJSONデータを読み込めませんでした。再読み込みしてください。";
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "btn btn-primary";
    retry.textContent = "再読み込み";
    retry.addEventListener("click", () => window.location.reload());
    notice.append(message, retry);
    document.querySelector("main").prepend(notice);
  }

  // 初回の言語表示と、言語切り替えボタンのクリック処理を設定する。
  document.addEventListener("DOMContentLoaded", () => {
    applyLanguage(currentLang()).catch(showLoadError);
    document.querySelectorAll(".lang-switch button").forEach((button) => {
      button.addEventListener("click", () =>
        applyLanguage(button.dataset.lang).catch(showLoadError),
      );
    });
  });
})();
