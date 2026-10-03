# End-to-end flows (Maestro)

Written against the app's `testID`s. **Not yet run**: they need a development build installed on a phone or emulator (see `docs/STATUS.md`).

```bash
# install Maestro: https://maestro.mobile.dev
maestro test e2e/                 # all flows
maestro test e2e/milestone-a.yaml # the demo path
```

| Flow | Checks |
|---|---|
| `selections.yaml` | All 10 picture selections reach Scripture |
| `tap-count.yaml` | Scripture in 3 taps by pictures, 2 by no words |
| `no-words.yaml` | Psalm 77 + Help link |
| `own-words-local.yaml` | Own words with the relay off: on-device match, "Matched on this phone" |
| `crisis.yaml` | Danger phrasing → Crisis → Help lines → Continue to Scripture |
| `pause-continue.yaml` | ✕ → save for later → reopen → Continue |
| `pause-expire.yaml` | Fast-forward 4 days → paused moment gone, one-time notice |
| `keep-moments-delete.yaml` | Save once, Moments, delete with inline confirmation |
| `arabic-rtl.yaml` | Arabic reload into right-to-left; Van Dyck Nehemiah 1 |
| `panel-toggle.yaml` | Judge panel on/off |
| `milestone-a.yaml` | The 90-second demo in Burmese |

The app id is the development variant (`org.ifiusa.known.dev`). Flows that use the judge panel need a development or preview build.
