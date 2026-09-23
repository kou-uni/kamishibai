#!/usr/bin/env bash
# キャラクター画像の背景を抜いて、内側の穴を埋める。
#   使い方: tools/cutout.sh 元画像.png 背景色(例 0x92C4EF) [出力幅=560]
# 単純な色抜きだと、キャラの中にある「背景に近い影の色」まで抜けて穴が開く。
# そこで外周から辿れる透明だけを背景とみなし、辿れない透明＝内側の穴を埋め戻す。
set -euo pipefail
IN="$1"; KEY="${2:-0x92C4EF}"; W="${3:-560}"
T=$(mktemp -d)
ffmpeg -y -loglevel error -i "$IN" -vf "colorkey=${KEY}:0.175:0.06,format=rgba" -frames:v 1 "$T/keyed.png"
read -r CW CH < <(ffprobe -v error -show_entries stream=width,height -of csv=p=0:s=' ' "$T/keyed.png")
ffmpeg -y -loglevel error -i "$T/keyed.png" -f rawvideo -pix_fmt rgba "$T/a.raw"
python3 - "$T" "$CW" "$CH" <<'PY'
import sys; from collections import deque
T,W,H = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
d = bytearray(open(f'{T}/a.raw','rb').read()); TH = 250
out = bytearray(W*H); q = deque()
def push(i):
    if not out[i] and d[i*4+3] < TH: out[i] = 1; q.append(i)
for x in range(W): push(x); push((H-1)*W+x)
for y in range(H): push(y*W); push(y*W+W-1)
while q:
    i = q.popleft(); x, y = i % W, i // W
    for nx, ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
        if 0 <= nx < W and 0 <= ny < H: push(ny*W+nx)
n = 0
for i in range(W*H):
    if not out[i] and d[i*4+3] < 255: d[i*4+3] = 255; n += 1
open(f'{T}/filled.raw','wb').write(bytes(d)); print(f'  内側の穴を {n} px 埋めました')
PY
ffmpeg -y -loglevel error -f rawvideo -pix_fmt rgba -s "${CW}x${CH}" -i "$T/filled.raw" -frames:v 1 "$T/filled.png"
ffmpeg -y -loglevel error -i "$T/filled.png" -vf "scale=${W}:-2:flags=lanczos,palettegen=max_colors=64:reserve_transparent=1" -frames:v 1 "$T/pal.png"
OUT="${IN%.*}-cutout.png"
ffmpeg -y -loglevel error -i "$T/filled.png" -i "$T/pal.png" -lavfi "[0:v]scale=${W}:-2:flags=lanczos[x];[x][1:v]paletteuse=dither=none:alpha_threshold=128" -frames:v 1 "$OUT"
# 確認用（マゼンタ合成）。白で確認すると抜けが見えないので必ずこちらを見る
ffmpeg -y -loglevel error -f lavfi -i "color=magenta:s=${W}x$(ffprobe -v error -show_entries stream=height -of csv=p=0 "$OUT")" -i "$OUT" -filter_complex "[0][1]overlay" -frames:v 1 "${OUT%.*}-check.png"
rm -rf "$T"
echo "✅ $OUT  ($(wc -c < "$OUT") bytes)"
echo "   確認用: ${OUT%.*}-check.png （マゼンタが透けていなければOK）"
