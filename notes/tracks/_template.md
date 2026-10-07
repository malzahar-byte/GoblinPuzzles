# Track: <name>

Copy this to `tracks/<name>.md` when you hand out a job. Delete it when the round ends — job
sheets are ephemeral, not history.

```
BASE: <the version handed out — do not change it>
JOB: <what to build, one short paragraph>
TOUCH: <the only paths you may change>
MUST NOT: <frozen interfaces and other tracks' paths>
BUILT AGAINST: <the notes/interfaces/ files you depend on>
DONE: <the exact gate command you run, and the result that counts>
RETURN: the report at the end of notes/AGENTS.md
```

Notes for whoever hands this out:

- One track = one job. If two tracks would change the same file, either split the file's ownership
  or run them one after the other.
- `shared/` is the highest-collision surface. A style/chrome track owns it; logic tracks must not
  touch it.
- Everything a track needs to know lives in `AGENTS.md`, `README.md`, its sheet, and the interface
  files it names. Nothing else.
