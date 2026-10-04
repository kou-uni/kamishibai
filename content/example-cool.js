/* theme:'cool' の見本。ベタ塗りの色面・巨大な見出し・古い OS の窓。
   ふつうの example.js との違いは theme と tones の2行と、labels を英字にしていることだけ。 */
const CONTENT = {
  theme: 'cool',
  tones: ['white', 'sage', 'teal', 'pink'],   // 章ごとの背景色。省くと 白→灰緑→桃→青緑→紫紅 の順に回る
  brand: { name: '紙芝居', sub: 'COOL THEME' },
  sound: true,                                 // theme:'cool' では、低く短い音（'cool'）が既定になる
  chapters: ['序', '色', '窓', '終'],
  labels: { next: 'Next', prev: 'Back', start: 'Start', end: 'Fin' },

  steps: [
    { ch: 0, tag: 'はじめに',
      cover: { num: 'kamishibai ／ theme: cool', title: '色面と、窓。', sub: 'Session 0 ・ 同じ部品のまま、トーンだけを替える。' },
      talk: `<b>これは theme:'cool' の見本です。</b>
             content に1行足すだけで、同じ部品がこのトーンに変わります。` },

    { ch: 1, tag: '章ごとに、背景が替わる',
      talk: `<b>背景は1色のベタ塗りで、章が変わると色も変わります。</b>
             文字は墨色1色のままです。色で強調しないので、背景が何色でも読めます。`,
      html: K.head('背景は、<br><em>1色のベタ塗り。</em>') +
            K.goals([
              { title: '色面は5つ', body: 'white / sage / teal / pink / magenta' },
              { title: '文字は墨色だけ', body: '色で強調しない' },
              { title: 'グラデーションは使わない', body: '影も、ぼかしも' },
            ]) +
            K.memo('本文の強調は、<b>朱色のマーカー</b>で。') },

    { ch: 2, tag: '箱は、古い OS の窓',
      talk: `<b>カードも、数字も、この解説の面も、同じ「窓」です。</b>
             角は直角、黒い線が1本、黒いタイトルバーに等幅の白い字、右下に硬い影。`,
      html: K.head('箱は、<br><em>ぜんぶ窓。</em>') +
            K.nums([
              { n: '31%', label: '前（tone: dn）', tone: 'dn' },
              { n: '92%', label: '後（tone: ok）', tone: 'ok' },
            ]) +
            K.cards([
              { k: 'Window 1.0', v: 'ラベルがタイトルバー', d: '黒地に等幅の白文字' },
              { k: 'Window 1.1', v: '角は直角', d: '線は 1px、影は硬く' },
            ]) +
            K.quote('引用とメモは箱にしない。左に細い線を1本。', 'theme: cool の決まり 4') },

    { ch: 3, tag: 'つかいかた',
      talk: `<b>足すのは2行です。</b>theme で型を選び、tones で章ごとの色を決めます。
             選んだ文字や、マウスを乗せたボタンは紫紅になります。`,
      html: K.head('足すのは、<br><em>2行だけ。</em>') +
            K.todo([
              { title: "theme: 'cool'", body: '書体と音も一緒に切り替わる。' },
              { title: "tones: ['white','sage',…]", body: '章の順に背景色を並べる。省いてもよい。' },
            ]) +
            K.ask('Ask 1.0', '<b>問いかけも、窓で。</b>', ['黄色い吹き出しは使わない']) +
            K.callout('<div class="l1">同じ部品で、</div><div class="l2">トーンだけ替える。</div>') },
  ],
};
