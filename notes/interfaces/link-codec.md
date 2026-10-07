# Interface — link codecs

Every puzzle's `*-logic.js` exports `parseLink(id)` and `encodeLink(...)`. The link is the whole
save file: a puzzle's entire state lives in the URL (invariant 1) and old links never break
(invariant 2).

## Contract

- An id is URL-safe and self-contained; `parseLink('')` must not throw — a page shows "not a valid
  puzzle" instead.
- Formats are **versioned**. New fields may be added inside a version; a breaking change means a
  new version, and the old one stays readable forever.
- `encodeLink` also carries the hidden message (invariant 4): the creator encrypts against the
  solution state, the player decrypts against the board's current state. Pencil marks must not
  change the bits (e.g. two cell states that both mean "empty" count the same).
- A generator MUST guarantee exactly one solution; a second solution decrypts to garbage.

## Known state

- Pictogram has three versions (v1 legacy random, v2/v3 picture-based) and keeps its own codec.
- Hashi keeps its own codec (its published links are unaffected by the shared helper).
- Akari, Skyscrapers, Binairo and Futoshiki use the shared secret lock (`secret-lock.md`).
- The five codecs currently repeat the same framing. Extracting one shared link-header helper is a
  `proposed` backlog item — a `shared/` change, so it needs the owner (R6).
