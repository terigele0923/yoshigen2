const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const site = readJson('data/site.json');
const translations = readJson('data/i18n.json');
const groups = {
    products: (lang) => translations[lang].products.items,
    facilities: (lang) => translations[lang].facilities.cases,
    gallery: (lang) => translations[lang].gallery.sections
};

function checkImage(image, label) {
    if (typeof image !== 'string' || !image.startsWith('images/')) {
        throw new Error(`${label}: images/ から始まる画像パスを指定してください`);
    }
    if (!fs.existsSync(path.join(root, image))) {
        throw new Error(`${label}: ${image} が見つかりません`);
    }
}

if (!Array.isArray(site.hero.slides) || site.hero.slides.length === 0) {
    throw new Error('hero.slides に画像を1枚以上指定してください');
}
site.hero.slides.forEach((image, index) => checkImage(image, `hero.slides[${index}]`));
checkImage(site.pageHeroImage, 'pageHeroImage');
if (!site.contact.mapQuery) throw new Error('contact.mapQuery がありません');

for (const [group, getItems] of Object.entries(groups)) {
    const images = site.media[group];
    if (!images || typeof images !== 'object') throw new Error(`media.${group} がありません`);
    const expected = Object.keys(images).sort().join(',');
    for (const [id, image] of Object.entries(images)) checkImage(image, `media.${group}.${id}`);
    for (const lang of ['ja', 'zh', 'en']) {
        const ids = getItems(lang).map((item) => item.id);
        if (new Set(ids).size !== ids.length || ids.slice().sort().join(',') !== expected) {
            throw new Error(`${lang}.${group}: id が media.${group} と一致しません`);
        }
    }
}

console.log('JSON と画像パスを確認しました。');
