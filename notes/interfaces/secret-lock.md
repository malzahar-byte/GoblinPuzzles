# Interface — the shared secret lock

`shared/gdp-secret.js` exports `bitsFrom`, `lockMessage` and `unlockMessage`.

## Contract

- **The XOR key is padded to exactly the message length.** `BitSeq.getXOR` cycles a shorter key,
  which would corrupt the message — the padding is what prevents that.
- The key is derived from the puzzle's **solution state**, so any renderer works as long as the
  state is a plain data structure that gives the same bits for the solution and for the player's
  board, ignoring pencil marks (invariant 4).
- A second valid solution decrypts to garbage — which is why the generator must guarantee exactly
  one (invariant 4).

## Known state

- Akari, Skyscrapers, Binairo and Futoshiki use this shared lock.
- Pictogram and Hashi keep their own codecs; their published links are unaffected.
