# content の書きかた

## 全体の形

```js
const CONTENT = {
  brand:    { name:'紙芝居', sub:'KAMISHIBAI' },   // 左上の名前
  guide:    { still:'@@assets/guide.png@@',        // 飛び出す絵（背景を抜いたPNG）
              face: '@@assets/guide-face.png@@',    // 丸ボタン用の静止画（省略可）
              loop: '@@assets/guide-loop.mp4@@' },  // 丸ボタンの動画（省略可・face より優先）
  sound:    true,                                   // false で音を切る／'chip' でぴこぴこ（矩形波）
  chapters: ['序','1','2','終'],                    // 上のバーの区切り
  labels:   { next:'つぎへ', prev:'もどる', start:'はじめる', end:'おわり！' },
  steps:    [ /* 1画面 = 1オブジェクト */ ],
};
```

`CONTENT` という名前でグローバルに置いてください。ビルド後に `Kamishibai.init(CONTENT)` が呼ばれます。

## 1画面

| キー | 必須 | 中身 |
|---|---|---|
| `ch` | ○ | 何章目か（0始まり）。`chapters` の添字 |
| `tag` | ○ | 左上に出る見出し。**このページで何を伝えたいか**をひとことで |
| `talk` | | ガイドの解説。◆ を押すと下から出る。**主語のある文章で書く** |
| `html` | | 画面の中身。`K.〜` を `+` でつなぐ |
| `cover` | | `{num, title, sub}` を渡すと章の扉になる（`html` は無視される） |
| `onShow` | | `(el, {chime,burst,squish}) => {}` 表示された瞬間に走る。凝ったことをしたいとき |

## 書くときのこつ

**`tag` を先に書く。** 画面の中身より先に「このページで何を言うか」を決めると、内容が締まります。

**`talk` は省略しない。** 大きい文字は俯瞰のため、`talk` は理解のためにあります。
見出しだけだと主語が抜けて、読む人が補完を強いられます。

**1画面に1つ。** カードを4枚以上並べたくなったら、たぶん2画面に割るべきです。

**★の確認ポイントは4〜5個まで。** 相手に考えてもらう場所を絞ると、実際に答えが返ってきます。

## 見出しの強調

```js
K.head('配信者は、権利を<span class="o">全部は持っていない。</span>')
```

| | 色 |
|---|---|
| `<em>` | 青 |
| `<span class="o">` | 橙 |
| `<span class="r">` | 赤 |

白抜き＋下に影がつくので、**背景の上でも読めます。** 使うのは1画面につき1箇所まで。

## 画面固有のCSS

`content/mine.js` に対して `content/mine.extra.css` を置くと、ビルド時に足されます。
その画面だけの図やイラストを描きたいときに。

## アセット

引用符で囲んだ `@@相対パス@@` が data URI になります。

```js
guide: { still: '@@assets/guide.png@@' }
html: `<img src="@@assets/zu.png@@" alt="">`
```

対応: png / jpg / webp / svg / gif / mp4 / webm。**コメントの中に書くとそれも展開されるので注意。**
