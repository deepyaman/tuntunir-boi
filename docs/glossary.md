# Glossary

Every story has a `glossary.json` next to its text with one entry per word form. It is
for someone who hears a word, knows roughly what it means, and wants to know what it is
made of: a compound split into its parts, a suffixed form traced to its base, an old
spelling tied to the modern one, a sound word named as a sound word. The reader does
not show the entries yet; the file comes first so the content can be reviewed on its own.

The glossary is written by hand, with the whole story in view, and reviewed by a reader
of romanized Bengali. It is not generated: every entry is a judgement about one word in
one sentence, and a generator that rewrote the file would fight the corrections.
Wiktionary is at most a check on a base form; for most of the words that need an entry
it has nothing.

## The unit

One entry per distinct form as printed, with the punctuation around it removed. ছানা,
ছানাও, ছানারা and ছানাগুলি are four forms and four entries, each tracing back to ছানা. A
hyphenated reduplication (ছোট্ট-ছোট্ট, চীঁ-চীঁ) is one form. Every word of
`source.bn.md` has an entry and no entry goes unused; the entries come in order of first
appearance, so reading the file follows the story.

## The fields

The key is the Bengali form. The value has these fields, in this order and no others:

| Field | When | What |
|---|---|---|
| `romanized` | always | The form in the romanization scheme, lowercase, no punctuation. What the reviewer reads, and what the test matches against `index.mdx`. |
| `meaning` | always | What the form means in this story, in English, as the form is used: an inflected verb is glossed as an inflected verb, a possessive as a possessive. |
| `from` | when the form is not its own dictionary form, or is a compound | The base word, or the parts joined with ` + `, each as Bengali, romanization, gloss. For an old spelling, the modern dictionary spelling. |
| `note` | rarely | One sentence that makes the word stick or explains a reference. Not a grammar lesson. |

Rules of thumb:

- Meanings are lowercase and short. Give two or three English words only when one
  misleads: "eggplant, brinjal". No leading article unless the form has one (গাছটার, "the
  tree's").
- A form used in two senses in the story gets both, separated by a semicolon, in order of
  first appearance: আর, "and; any more".
- A grammatical word is glossed by what it does: লা, "rustic vocative particle, roughly
  *hey you*".
- A name is glossed by who it is: টুনটুনি, "the tailorbird, our heroine".
- `from` is the field that earns the entry. A one-word gloss of লক্ষ্মীছাড়ী as "wretched"
  answers nothing; "লক্ষ্মীছাড়া lokkhichhaṛa, literally abandoned by Lakshmi" does.
- Verb forms point at the verbal noun as the dictionary form: খিঁচিয়ে from খিঁচানো,
  বললে from বলা.
- Old spellings (খুশী, মহারানী, ভারী) keep their own entry under the printed form; `from`
  names the modern spelling so a later link or lookup has something to find.

## Worked examples

```json
"খিঁচিয়ে": { "romanized": "khĩchiye", "meaning": "baring (its teeth)", "from": "খিঁচানো khĩchano, bare or grind the teeth, grimace" },
"ছানাও": { "romanized": "chhanao", "meaning": "the chicks either", "from": "ছানা chhana, chick, young one + ও -o, also, even" },
"লক্ষ্মীছাড়ী": { "romanized": "lokkhichhaṛi", "meaning": "wretched, good-for-nothing (feminine)", "from": "লক্ষ্মীছাড়া lokkhichhaṛa, literally abandoned by Lakshmi", "note": "Lakshmi is the goddess of fortune; the feminine -ী is aimed at the she-cat." },
"ফুড়ুক": { "romanized": "phuṛuk", "meaning": "a flutter", "note": "Sound word for a small bird's sudden flight: ফুড়ুক করে উড়ে is flew off with a flutter." },
"মহারানী": { "romanized": "môharani", "meaning": "great queen, Your Majesty", "from": "মহা môha, great + রানী rani, queen; modern spelling মহারানি" },
"বেগুন": { "romanized": "begun", "meaning": "eggplant, brinjal" },
"আর": { "romanized": "ar", "meaning": "and; any more" }
```

## Writing and review

1. Read the whole story first; the glosses depend on who is speaking to whom.
2. Go paragraph by paragraph with `source.bn.md` and `index.mdx` side by side, adding an
   entry the first time a form appears.
3. Run `npm run test:content`. It checks that the keys are exactly the forms of the story
   in order, that every `romanized` field matches the word at the same position in
   `index.mdx`, and that the fields are the four above.
4. Review as a table of romanized form, meaning, from, note. Fixes go straight into the
   file.

## Not used (yet)

- Showing the entries in the reader (a word card).
- Bengali script in the reader; the entries carry it for when that comes.
- Links out, to Wiktionary or elsewhere.
- One glossary shared across stories. Common words repeat in every story's file for now.
