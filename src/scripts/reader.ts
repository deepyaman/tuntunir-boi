// Plays a word or a sentence of the story when it is tapped. Each paragraph has one
// clip; a word or sentence is a time range of it (see pipeline/README.md), and the
// page inlines those ranges as JSON. Ranges are already widened to the spoken sound,
// so they are played exactly as given, with the Web Audio API for precise stops.

type Range = { start: number; end: number };
type Paragraph = { clip: string; sentences: (Range & { words: Range[] })[] };
type Target = { clip: string; range: Range; words: { el: Element; range: Range }[] };

const timings: Paragraph[] = JSON.parse(document.getElementById('timings')!.textContent!);
const article = document.querySelector('article')!;
const paragraphs = [...article.querySelectorAll(':scope > p')];
if (paragraphs.length !== timings.length) {
  throw new Error(`${paragraphs.length} paragraphs on the page but ${timings.length} in the timings`);
}

// What each word span and sentence button plays, and which words light up meanwhile.
const targets = new Map<Element, Target>();
paragraphs.forEach((p, i) => {
  const spans = [...p.querySelectorAll('.word')];
  const buttons = [...p.querySelectorAll('.play')];
  const { clip, sentences } = timings[i];
  if (spans.length !== sentences.flatMap((s) => s.words).length || buttons.length !== sentences.length) {
    throw new Error(`paragraph ${i + 1}: the markup and the timings disagree`);
  }
  let k = 0;
  sentences.forEach((s, j) => {
    const words = s.words.map((range) => ({ el: spans[k++], range }));
    for (const w of words) targets.set(w.el, { clip, range: w.range, words: [w] });
    targets.set(buttons[j], { clip, range: s, words });
  });
});

let ctx: AudioContext | undefined;
const buffers = new Map<string, Promise<AudioBuffer>>(); // each clip is fetched and decoded once
function buffer(clip: string) {
  if (!buffers.has(clip)) {
    buffers.set(clip, fetch(clip).then((r) => r.arrayBuffer()).then((b) => ctx!.decodeAudioData(b)));
  }
  return buffers.get(clip)!;
}

let lit: Element | undefined;
let playing: { source: AudioBufferSourceNode; frame: number } | undefined;
let take = 0; // a tap while an earlier clip is still loading supersedes it

function light(el?: Element) {
  lit?.classList.remove('playing');
  el?.classList.add('playing');
  lit = el;
}

function stop() {
  if (!playing) return;
  playing.source.onended = null;
  playing.source.stop();
  cancelAnimationFrame(playing.frame);
  playing = undefined;
  light();
}

async function play(target: Target) {
  stop();
  const mine = ++take;
  ctx ??= new AudioContext(); // created inside the tap, as Safari requires
  light(target.words[0].el); // immediate feedback while the clip loads
  const buf = await buffer(target.clip);
  if (mine !== take) return;

  const source = new AudioBufferSourceNode(ctx, { buffer: buf });
  source.connect(ctx.destination);
  const startedAt = ctx.currentTime;
  source.start(0, target.range.start, target.range.end - target.range.start);
  source.onended = stop;

  // Light the word being spoken: the first one that has not ended yet, so the tint
  // moves on to the next word during the gap between two words instead of blinking off.
  const tick = () => {
    const t = target.range.start + ctx!.currentTime - startedAt;
    const current = target.words.find((w) => t < w.range.end) ?? target.words[target.words.length - 1];
    if (current.el !== lit) light(current.el);
    playing!.frame = requestAnimationFrame(tick);
  };
  playing = { source, frame: requestAnimationFrame(tick) };
}

article.addEventListener('click', (event) => {
  const hit = (event.target as Element).closest('.word, .play');
  if (hit) play(targets.get(hit)!);
});
