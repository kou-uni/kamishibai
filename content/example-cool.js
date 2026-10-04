/* theme:'cool' の見本。黒背景・細い書体・差し色1つ。
   ふつうの example.js との違いは theme の1行と、labels を英字にしていることだけ。 */
const CONTENT = {
  theme: 'cool',
  brand: { name: '紙芝居', sub: 'COOL THEME' },
  sound: true,                       // theme:'cool' では、低く短い音（'cool'）が既定になる
  chapters: ['序', '型', '終'],
  labels: { next: 'Next →', prev: 'Back', start: 'Start →', end: 'Fin' },

  steps: [
    { ch: 0, tag: 'はじめに',
      cover: { num: 'kamishibai ／ theme: cool', title: '黒で、静かに。', sub: '同じ部品のまま、トーンだけを替える。' },
      talk: `<b>これは theme:'cool' の見本です。</b>
             content に1行足すだけで、同じ部品が黒背景のトーンに変わります。` },

    { ch: 1, tag: '決まりは4つ',
      talk: `<b>このトーンの決まりは4つです。</b>
             色を増やさない、面を白くしない、白は押すものだけ、書体は細く。
             守ると、何を足しても同じ顔になります。`,
      html: K.head('色は、<br><em>ひとつだけ。</em>') +
            K.goals([
              { title: '黒・白・グレーと、差し色1つ', body: '緑と赤は使わない' },
              { title: '面は白くしない', body: '背景より少し明るいグレーと、細い線で分ける' },
              { title: '白い面は「押すもの」だけ', body: 'Next ボタン' },
              { title: '書体は細く', body: '太字は 500 まで。動き続ける演出は止める' },
            ]) },

    { ch: 1, tag: '数字は、良いほうを白に',
      talk: `<b>良い・悪いを緑と赤で分けません。</b>
             良いほうを白、悪いほうをグレーにします。差し色は、いちばん見てほしい1箇所に取っておきます。`,
      html: K.head('良いは白、<br><em>悪いはグレー。</em>') +
            K.nums([
              { n: '31%', label: '前（tone: dn）', tone: 'dn' },
              { n: '92%', label: '後（tone: ok）', tone: 'ok' },
            ]) +
            K.cards([
              { k: 'CARD', v: 'ラベルは差し色', d: '値は白、説明はグレー' },
              { k: 'CARD', v: '影は使わない', d: '細い線1本で囲む' },
            ]) +
            K.memo('強調は<b>白い文字</b>で。色を足さない。') },

    { ch: 1, tag: '解説は、すりガラスの面に',
      talk: `<b>いま開いているこの面が、解説の面です。</b>
             背景より一段明るい半透明のグレーで、後ろがぼけて透けます。
             白い面にすると Next ボタンと競るので、白は押すものにだけ使います。`,
      html: K.head('左下を、<br><em>押してみて。</em>') +
            K.quote('面は色で分けない。線と、ぼかしで分ける。', 'theme: cool の決まり 2') +
            K.ask('ASK', '<b>問いかけは、差し色の細い枠で。</b>', ['黄色い吹き出しは使わない', '揺らさない']) },

    { ch: 2, tag: 'つかいかた',
      talk: `<b>使いかたは1行です。</b>差し色を変えたいときは、extra.css で2つの変数を上書きします。`,
      html: K.head('足すのは、<br><em>1行だけ。</em>') +
            K.todo([
              { title: "theme: 'cool'", body: 'content の先頭に書く。書体と音も一緒に切り替わる。' },
              { title: '差し色を変える', body: '<code>:root{--acc:#…; --accFill:#…}</code> を extra.css に。' },
            ]) +
            K.callout('<div class="l1">同じ部品で、</div><div class="l2">トーンだけ替える。</div>') },
  ],
};
