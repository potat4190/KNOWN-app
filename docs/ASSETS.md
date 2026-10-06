# Assets

The hackathon rules ask for a list of AI-generated assets and where they came from (judges' critique). The **tool** column is for the team to fill in.

## AI-generated illustrations

The 14 scenes are extracted unchanged from `reference/KNOWN_Design_Lab.html` by `scripts/extract-design-lab.ts`. Since 2026-10-06 the 4 Feel pictures are team-supplied replacements: the extraction copies `assets/images/picture-overrides/<S|F|A|J>.jpg` (resized to 520 px from Rhidaya's WebP files) over the Design Lab's pictures.

| File | Used for | Source | Tool (team to fill) |
|---|---|---|---|
| `assets/images/pictures/S.jpg` | Feel picture: a figure sitting on a window seat by a rainy window at dusk | Team-supplied (`assets/images/picture-overrides/S.jpg`, 2026-10-06) | |
| `assets/images/pictures/F.jpg` | Feel picture: a figure wrapped in a red blanket on a bed while lightning flashes outside | Team-supplied (`assets/images/picture-overrides/F.jpg`, 2026-10-06) | |
| `assets/images/pictures/A.jpg` | Feel picture: a figure standing with clenched fists over a crumpled sheet of paper | Team-supplied (`assets/images/picture-overrides/A.jpg`, 2026-10-06) | |
| `assets/images/pictures/J.jpg` | Feel picture: a figure dancing on a sunny balcony with flowers | Team-supplied (`assets/images/picture-overrides/J.jpg`, 2026-10-06) | |
| `assets/images/scenes/welcome.jpg` | Home hero (not shown since the 2026-10-06 Night Home; still bundled) | Design Lab `SCENE.welcome` | |
| `assets/images/scenes/done.jpg` | Done hero | Design Lab `SCENE.done` | |
| `assets/images/scenes/close.jpg` | Fallback scene (lament psalms) | Design Lab `SCENE.close` | |
| `assets/images/scenes/ps77.jpg` | Asaph (Psalm 77) | Design Lab `SCENE.ps77` | |
| `assets/images/scenes/neh.jpg` | Nehemiah | Design Lab `SCENE.neh` | |
| `assets/images/scenes/ruth.jpg` | Ruth | Design Lab `SCENE.ruth` | |
| `assets/images/scenes/ps142.jpg` | David (Psalm 142) | Design Lab `SCENE.ps142` | |
| `assets/images/scenes/hab.jpg` | Habakkuk | Design Lab `SCENE.hab` | |
| `assets/images/scenes/hannah.jpg` | Hannah | Design Lab `SCENE.hannah` | |
| `assets/images/scenes/hagar.jpg` | Hagar | Design Lab `SCENE.hagar` | |
| `assets/images/scenes/mary.jpg` | Mary of Bethany | Design Lab `SCENE.mary` | |
| `assets/images/scenes/elijah.jpg` | Elijah | Design Lab `SCENE.elijah` | |
| `assets/images/scenes/samaritan.jpg` | The Samaritan | Design Lab `SCENE.samaritan` | |
| `assets/images/scenes/joseph.jpg` | Joseph | Design Lab `SCENE.joseph` | |

## Fonts

| Font | Licence | Bundled via |
|---|---|---|
| Noto Sans Myanmar | SIL OFL 1.1 | `@expo-google-fonts/noto-sans-myanmar` |
| Noto Sans Arabic | SIL OFL 1.1 | `@expo-google-fonts/noto-sans-arabic` |
| Noto Naskh Arabic | SIL OFL 1.1 | `@expo-google-fonts/noto-naskh-arabic` |
| Inter, Source Serif 4 | SIL OFL 1.1 | registered by the YouVersion SDK provider |

Chinese and Japanese use the system fonts (not bundled).

## Music

None yet. Every track added to `src/config/music.ts` must be listed in `assets/audio/CREDITS.md` with its licence.

## App icon and splash

Still the Expo template placeholders. Replace them with KNOWN's lamp mark before any store build.
