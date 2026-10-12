# Romanization

The romanized text is for people who *speak* Bengali but cannot read the script. So it
is phonemic: it writes the sounds a Kolkata-standard speaker says, not the letters the
book prints. Spelling is preserved separately in each story's `source.bn.md`, so the
romanization never needs to be reversible.

The scheme is ordinary "Benglish" (the way Bengalis text each other in Roman letters)
plus a small set of marks for the sounds plain ASCII cannot tell apart. The marks are
part of the stored text. If they ever prove more clutter than help, a build-time filter
can hide some of them; that is not built yet.

## Vowels

| Bengali | Romanized | Notes |
|---|---|---|
| অ (and the inherent vowel) | `ô` or `o` | `ô` when it sounds like the *o* in *hot* ([ɔ]): kôtha, bôṛo, kôre. `o` when it sounds like the *o* in *go* ([o]): bolle, hoyechhe, shundor. See below. |
| আ | `a` | tar, basha |
| ই ঈ | `i` | tinṭi, bhari |
| উ ঊ | `u` | khub, dur |
| ঋ | `ri` | grihôsther |
| এ | `e` or `ê` | `ê` when it sounds like the *a* in *cat* ([æ]): êkdin, dêkh, gêlo. `e` otherwise: dekhi, eshe. |
| ঐ | `oi` | oi (ঐ) |
| ও | `o` | roj, tora |
| ঔ | `ou` | |
| য-ফলা + আ (্যা) | `ê` | hễ (হ্যাঁ) |

**Silent inherent vowels are not written.** Write what is said: bolle, not bolole;
gachh, not gachha. A final inherent vowel that *is* pronounced is written `o`:
khabo, chhoṭṭo, parlo.

**ô or o?** Say the word aloud. Rules of thumb that cover almost every case:

- Before a syllable with i, u, or a pronounced final o, the vowel raises to `o`:
  bolle, korchhish, hoyechhe, shundor, boshlo, chokho.
- Verb forms that come from older forms with an ই (past tense -l-, perfect -echh-,
  progressive -chh-, infinitive -te) have `o`: bolle, bollam, korle, korte, dhorte, hoyechhe, bolechhe.
- Otherwise it is `ô`: kôre, bôle, chôle, ghôre, tôbe, prônam, môharani.
- Before ক্ষ it is `o`: lokkhi.

## Nasalization

Chandrabindu (ঁ) becomes a tilde on the vowel: `ã ẽ ĩ õ ũ`, and `ỗ` for a nasal ô,
`ễ` for a nasal ê. Examples: hã, ṭhõṭ, chĩ-chĩ, bẽdhechhe, dãt, kãṭar, hễ.

Anusvara (ং) is `ng`. Visarga (ঃ) is `h` where it is heard, otherwise omitted.

## Consonants

| Bengali | Romanized | Bengali | Romanized |
|---|---|---|---|
| ক খ গ ঘ ঙ | k kh g gh ng | ত থ দ ধ ন | t th d dh n |
| চ ছ জ ঝ ঞ | ch chh j jh n | প ফ ব ভ ম | p ph b bh m |
| ট ঠ ড ঢ ণ | ṭ ṭh ḍ ḍh n | য র ল | j r l |
| ড় ঢ় য় | ṛ ṛh y | শ ষ স | sh (or s, see below) |
| হ | h | ৎ | t |

- Retroflex ট ঠ ড ঢ ড় ঢ় carry an underdot (ṭ ḍ ṛ) to keep them apart from dental
  ত থ দ ধ. ণ is written plain `n` because it sounds like ন.
- শ ষ স are all `sh` ([ʃ]), which is how they are said: she, shei, basha, boshlo.
  Write `s` only where the sound really is [s], typically before t, r, l, n in a
  cluster: sthan, sri.
- Doubled consonants are written doubled: chhoṭṭo, lokkhi. ক্ষ is `kkh` in the
  middle of a word and `kh` at the start.
- য-ফলা and ব-ফলা follow pronunciation: where they double the consonant, double it;
  where ্যা makes an [æ], write `ê`; where they are silent, omit them.

## Punctuation and typography

- Keep the book's quotation marks (‘single’ as printed, “double” only if printed).
- Keep hyphens in reduplications: chhoṭṭo-chhoṭṭo, chĩ-chĩ.
- Sentence-case capitalization, as in English. Capitalize names and titles used as
  names (Ṭunṭuni, Môharani).
- Danda (।) becomes a full stop.

## Normalization

Store text as NFC. Beyond ASCII, the romanized text may contain only:

- vowels with marks: `ô ê ã ẽ ĩ õ ũ ỗ ễ` and their capitals
- retroflex consonants: `ṭ ḍ ṛ` and their capitals
- punctuation: `‘ ’ “ ” –  —`

`tests/content.test.mjs` enforces this list.

## Worked example

| Bengali | Romanized |
|---|---|
| গৃহস্থের ঘরের পিছনে বেগুন গাছ আছে। | Grihôsther ghôrer pichhone begun gachh achhe. |
| সেই বেগুন গাছের পাতা ঠোঁট দিয়ে সেলাই করে টুনটুনি পাখিটি তার বাসা বেঁধেছে। | Shei begun gachher pata ṭhõṭ diye shelai kôre Ṭunṭuni pakhiṭi tar basha bẽdhechhe. |
| টুনটুনি বললে, ‘তবে দেখ তো দেখি, ঐ তাল গাছটার ডালে গিয়ে বসতে পারিস কিনা।’ | Ṭunṭuni bolle, ‘Tôbe dêkh to dekhi, oi tal gachhṭar ḍale giye boshte parish kina.’ |

## Not used (yet)

- Marks that encode spelling rather than sound: vowel length (ī ū), ṇ for ণ, ś/ṣ for শ/ষ.
  The Bengali source already preserves spelling.
- A build-time filter that hides a chosen subset of marks.
- Word-level glosses for old or dialectal words.
