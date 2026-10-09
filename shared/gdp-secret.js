// Goblin Does Puzzles — shared XOR secret-message lock.
//
// Invariant (AGENTS.md #4): every puzzle hides a message XOR-locked against its own solution
// state, so only a correct solve decrypts it. A puzzle turns its solution into a bit string
// (one or more bits per cell/edge, in a fixed order) and locks the message against it.
//
// IMPORTANT: BitSeq.getXOR cycles the shorter sequence, so the key MUST be exactly as long as the
// message or the message gets corrupted. `keystream` repeats the solution bits to that length.
import { BitSeq } from './gdp-bitseq.js?v=13.0.21logic';

// values: array of small ints. bits: how many bits per value.
export function bitsFrom(values, bits = 1) {
  const b = new BitSeq();
  for (const v of values) b.appendNum(v | 0, bits);
  return b.get();
}

function keystream(keyBits, len) {
  if (!keyBits || keyBits.length === 0) return '0'.repeat(len);
  let s = '';
  while (s.length < len) s += keyBits;
  return s.slice(0, len);
}

// msgType 0 = plain text (chars), 1 = alphas (SteamGifts code). keyBits: '0'/'1' string.
export function lockMessage(message, msgType, keyBits) {
  const toEncrypt = new BitSeq();
  if (msgType === 0) toEncrypt.appendChars(message); else toEncrypt.appendAlphas(message);
  return toEncrypt.getXOR(new BitSeq(keystream(keyBits, toEncrypt.length())));
}

export function unlockMessage(enc, msgType, keyBits) {
  const dec = enc.getXOR(new BitSeq(keystream(keyBits, enc.length())));
  return msgType === 0 ? dec.toChars() : dec.toAlphas();
}
