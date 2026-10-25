# mal.gg /yc reference assets

Source: https://www.mal.gg/yc — retrieved 2026-10-24. Only public assets on www.mal.gg were downloaded. No founder data or portraits were copied. This is design reference research; the full reference CSS is retained for provenance and must not be imported into the application.

## Extraction result

- 24 unique UI SVG icons, 11 WOFF2 font subsets, and 3 source CSS files downloaded.
- SVG XML safety check passed for all 24: no script or foreignObject elements, event handlers, or nonfragment href/src references. None omitted.
- JSON manifest: `mal/asset-manifest.json`.
- Original source CSS retained verbatim in `mal/`.
- WOFF2 files have valid wOF2 headers.

## Fonts

Reference font definitions are Geist and Geist Mono, variable normal weight 100–900 with font-display swap. The `.yc-root` declaration sets base font-size 12px and line-height 1. Other sizes are component overrides; do not force all text to 12px.

Latin subsets for immediate UI use:

- Geist: `caa3a2e1cccd8315-s.p.0zr6hhvz-h9nw.woff2`.
- Geist Mono: `797e433ab948586e-s.p.1v5bejj26fx9h.woff2`.
- Both Latin unicode-range declarations start `U+??` (U+0000–00FF). Extended Latin and Cyrillic/Vietnamese subsets also retained.

### Exact source @font-face declarations

These URLs are original paths relative to the source CSS. For application use, change only each src URL to `/assets/reference/<filename>`.

```css
@font-face{font-family:Geist;font-style:normal;font-weight:100 900;font-display:swap;src:url(../media/fef07dbb0973bf53-s.00az9qtie3ho1.woff2)format("woff2");unicode-range:U+460-52F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F}
@font-face{font-family:Geist;font-style:normal;font-weight:100 900;font-display:swap;src:url(../media/8a480f0b521d4e75-s.3j-a226dh71aj.woff2)format("woff2");unicode-range:U+301,U+400-45F,U+490-491,U+4B0-4B1,U+2116}
@font-face{font-family:Geist;font-style:normal;font-weight:100 900;font-display:swap;src:url(../media/53b9e256198e5412-s.2gwoz23eiro2t.woff2)format("woff2");unicode-range:U+102-103,U+110-111,U+128-129,U+168-169,U+1A0-1A1,U+1AF-1B0,U+300-301,U+303-304,U+308-309,U+323,U+329,U+1EA0-1EF9,U+20AB}
@font-face{font-family:Geist;font-style:normal;font-weight:100 900;font-display:swap;src:url(../media/7178b3e590c64307-s.0i3h3th1vs4m7.woff2)format("woff2");unicode-range:U+100-2BA,U+2BD-2C5,U+2C7-2CC,U+2CE-2D7,U+2DD-2FF,U+304,U+308,U+329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:Geist;font-style:normal;font-weight:100 900;font-display:swap;src:url(../media/caa3a2e1cccd8315-s.p.0zr6hhvz-h9nw.woff2)format("woff2");unicode-range:U+??,U+131,U+152-153,U+2BB-2BC,U+2C6,U+2DA,U+2DC,U+304,U+308,U+329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:Geist Fallback;src:local(Arial);ascent-override:95.94%;descent-override:28.16%;line-gap-override:0.0%;size-adjust:104.76%}
@font-face{font-family:Geist Mono;font-style:normal;font-weight:100 900;font-display:swap;src:url(../media/5ce348bf30bf5439-s.27spqqad3wyeo.woff2)format("woff2");unicode-range:U+460-52F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F}
@font-face{font-family:Geist Mono;font-style:normal;font-weight:100 900;font-display:swap;src:url(../media/4fa387ec64143e14-s.3f4zuumv8svu0.woff2)format("woff2");unicode-range:U+301,U+400-45F,U+490-491,U+4B0-4B1,U+2116}
@font-face{font-family:Geist Mono;font-style:normal;font-weight:100 900;font-display:swap;src:url(../media/6306c77e7c8268e4-s.34r5yzckw0h2s.woff2)format("woff2");unicode-range:U+2000-2001,U+2004-2008,U+200A,U+23B8-23BD,U+2500-259F}
@font-face{font-family:Geist Mono;font-style:normal;font-weight:100 900;font-display:swap;src:url(../media/7d817b4c03b0c5f1-s.2jyz_zw3a8jit.woff2)format("woff2");unicode-range:U+102-103,U+110-111,U+128-129,U+168-169,U+1A0-1A1,U+1AF-1B0,U+300-301,U+303-304,U+308-309,U+323,U+329,U+1EA0-1EF9,U+20AB}
@font-face{font-family:Geist Mono;font-style:normal;font-weight:100 900;font-display:swap;src:url(../media/bbc41e54d2fcbd21-s.30bdpjkrtcces.woff2)format("woff2");unicode-range:U+100-2BA,U+2BD-2C5,U+2C7-2CC,U+2CE-2D7,U+2DD-2FF,U+304,U+308,U+329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:Geist Mono;font-style:normal;font-weight:100 900;font-display:swap;src:url(../media/797e433ab948586e-s.p.1v5bejj26fx9h.woff2)format("woff2");unicode-range:U+??,U+131,U+152-153,U+2BB-2BC,U+2C6,U+2DA,U+2DC,U+304,U+308,U+329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:Geist Mono Fallback;src:local(Arial);ascent-override:74.67%;descent-override:21.92%;line-gap-override:0.0%;size-adjust:134.59%}
```

## Exact reference tokens and root rules

```css
.border-yc-focus,.border-yc-focus\/60{border-color:var(--yc-accent-focus)}
.border-yc-focus\/60{border-color:color-mix(in oklab, var(--yc-accent-focus) 60%, transparent)}
.border-yc-green{border-color:var(--yc-tone-green)}
.border-yc-indigo{border-color:var(--yc-accent-indigo)}
.border-yc-line{border-color:var(--yc-border-default)}
.border-yc-line-strong{border-color:var(--yc-border-strong)}
.border-yc-line-subtle{border-color:var(--yc-border-subtle)}
.bg-\[var\(--yc-accent-blue\)\],.bg-\[var\(--yc-accent-blue\)\]\/70{background-color:var(--yc-accent-blue)}
.bg-\[var\(--yc-accent-blue\)\]\/70{background-color:color-mix(in oklab, var(--yc-accent-blue) 70%, transparent)}
.bg-yc-blue{background-color:var(--yc-tone-blue)}
.bg-yc-blue-soft{background-color:var(--yc-tone-blue-soft)}
.bg-yc-focus{background-color:var(--yc-accent-focus)}
.bg-yc-gold-soft{background-color:var(--yc-tone-gold-soft)}
.bg-yc-green-soft{background-color:var(--yc-tone-green-soft)}
.bg-yc-indigo-soft{background-color:var(--yc-accent-indigo-soft)}
.bg-yc-ink{background-color:var(--yc-text-primary)}
.bg-yc-ink-3{background-color:var(--yc-text-tertiary)}
.bg-yc-line{background-color:var(--yc-border-default)}
.bg-yc-line-strong{background-color:var(--yc-border-strong)}
.bg-yc-orange-soft{background-color:var(--yc-tone-orange-soft)}
.bg-yc-pink-soft{background-color:var(--yc-tone-pink-soft)}
.bg-yc-purple{background-color:var(--yc-tone-purple)}
.bg-yc-purple-soft{background-color:var(--yc-tone-purple-soft)}
.bg-yc-row-selected{background-color:var(--yc-bg-row-selected)}
.bg-yc-selected{background-color:var(--yc-bg-selected)}
.bg-yc-subtle{background-color:var(--yc-bg-subtle)}
.bg-yc-surface{background-color:var(--yc-bg-surface)}
.text-yc-blue{color:var(--yc-tone-blue)}
.text-yc-focus{color:var(--yc-accent-focus)}
.text-yc-gold{color:var(--yc-tone-gold)}
.text-yc-green{color:var(--yc-tone-green)}
.text-yc-indigo{color:var(--yc-accent-indigo)}
.text-yc-ink{color:var(--yc-text-primary)}
.text-yc-ink-2{color:var(--yc-text-secondary)}
.text-yc-ink-3{color:var(--yc-text-tertiary)}
.text-yc-ink-muted{color:var(--yc-text-muted)}
.text-yc-link{color:var(--yc-text-link)}
.text-yc-orange{color:var(--yc-tone-orange)}
.text-yc-pink{color:var(--yc-tone-pink)}
.text-yc-purple{color:var(--yc-tone-purple)}
.shadow-yc-card{--tw-shadow:var(--yc-shadow-card);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}
.shadow-yc-popover{--tw-shadow:var(--yc-shadow-popover);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}
.ring-yc-focus,.ring-yc-focus\/40{--tw-ring-color:var(--yc-accent-focus)}
.ring-yc-focus\/40{--tw-ring-color:color-mix(in oklab, var(--yc-accent-focus) 40%, transparent)}
.group-hover\:bg-yc-hover:is(:where(.group):hover *){background-color:var(--yc-bg-hover)}
.group-hover\:text-yc-link:is(:where(.group):hover *){color:var(--yc-text-link)}
.placeholder\:text-yc-ink-3::placeholder{color:var(--yc-text-tertiary)}
.placeholder\:text-yc-ink-muted::placeholder{color:var(--yc-text-muted)}
.hover\:bg-yc-blue-soft\/50:hover{background-color:var(--yc-tone-blue-soft)}
.hover\:bg-yc-blue-soft\/50:hover{background-color:color-mix(in oklab, var(--yc-tone-blue-soft) 50%, transparent)}
.hover\:bg-yc-hover:hover,.hover\:bg-yc-hover\/60:hover{background-color:var(--yc-bg-hover)}
.hover\:bg-yc-hover\/60:hover{background-color:color-mix(in oklab, var(--yc-bg-hover) 60%, transparent)}
.hover\:bg-yc-subtle:hover{background-color:var(--yc-bg-subtle)}
.hover\:text-yc-ink:hover{color:var(--yc-text-primary)}
.active\:bg-yc-hover:active{background-color:var(--yc-bg-hover)}
:root{--yc-text-primary:#0a0a0a;--yc-text-secondary:#5b5f66;--yc-text-tertiary:#8a8f98;--yc-text-muted:#737373;--yc-text-link:#1e46d6;--yc-bg-page:#fafafa;--yc-bg-surface:#fff;--yc-bg-subtle:#f5f6f7;--yc-bg-hover:#f3f4f6;--yc-bg-selected:#eff3ff;--yc-bg-row-selected:#eef0f3;--yc-border-default:#e4e5e8;--yc-border-strong:#d3d5da;--yc-border-subtle:#efeff1;--yc-accent-indigo:#5b5bf5;--yc-accent-indigo-soft:#efeefe;--yc-accent-blue:#2c5bff;--yc-accent-focus:#3177f0;--yc-tone-green:#0e8f5e;--yc-tone-green-soft:#e9f7f0;--yc-tone-gold:#b7791f;--yc-tone-gold-soft:#fdf4e3;--yc-tone-blue:#2563eb;--yc-tone-blue-soft:#eaf1fe;--yc-tone-orange:#d0622b;--yc-tone-orange-soft:#fdf0e8;--yc-tone-pink:#ce3560;--yc-tone-pink-soft:#fdebf0;--yc-tone-purple:#6a59cc;--yc-tone-purple-soft:#f0edfb;--yc-shadow-card:0 1px 2px 0 #5258660f, 0 0 0 1px #e4e5e8, 0 1px 2px 0 #0000000a, 0 1px 2px 0 #00000005;--yc-shadow-popover:0 12px 32px -8px #0f17292e, 0 0 0 1px #e4e5e8, 0 2px 6px 0 #0000000f}
.yc-root{background:var(--yc-bg-page);min-height:100vh;color:var(--yc-text-primary);font-family:var(--font-yc-sans), ui-sans-serif, system-ui, sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizelegibility;font-size:12px;line-height:1}
.yc-root .font-yc-mono{font-feature-settings:"tnum";font-variant-numeric:tabular-nums}
.yc-card{background:var(--yc-bg-surface);box-shadow:var(--yc-shadow-card);border-radius:12px}
.yc-panel{background:var(--yc-bg-surface);border:1px solid var(--yc-border-default);border-radius:16px;box-shadow:0 3px 6px -1px #00000008,0 1px 2px #0000000a}
.yc-popover{background:var(--yc-bg-surface);box-shadow:var(--yc-shadow-popover);border-radius:12px}
.yc-thin-scroll::-webkit-scrollbar-thumb{background:var(--yc-border-strong);border-radius:999px}
.yc-root input[type=range].dual{appearance:none;pointer-events:none;background:0 0;width:100%;height:24px;margin:0;position:absolute;inset:0}
.yc-root input[type=range].dual::-webkit-slider-thumb{-webkit-appearance:none;pointer-events:auto;border:1.5px solid var(--yc-accent-blue);cursor:grab;background:#fff;border-radius:999px;width:12px;height:12px;box-shadow:0 1px 2px #0000001f}
.yc-root input[type=range].dual::-moz-range-thumb{pointer-events:auto;border:1.5px solid var(--yc-accent-blue);cursor:grab;background:#fff;border-radius:999px;width:12px;height:12px}
```

## Asset manifest

| Source URL | Local file | Bytes |
| --- | --- | ---: |
| https://www.mal.gg/yc/figma/briefcase-grey.svg | `work/afterward/dist/assets/reference/briefcase-grey.svg` | 1206 |
| https://www.mal.gg/yc/figma/chevron-down.svg | `work/afterward/dist/assets/reference/chevron-down.svg` | 336 |
| https://www.mal.gg/yc/figma/chevron-left-double.svg | `work/afterward/dist/assets/reference/chevron-left-double.svg` | 332 |
| https://www.mal.gg/yc/figma/chevron-right-double.svg | `work/afterward/dist/assets/reference/chevron-right-double.svg` | 333 |
| https://www.mal.gg/yc/figma/chevron-right.svg | `work/afterward/dist/assets/reference/chevron-right.svg` | 325 |
| https://www.mal.gg/yc/figma/chevron-selector-vertical.svg | `work/afterward/dist/assets/reference/chevron-selector-vertical.svg` | 417 |
| https://www.mal.gg/yc/figma/filter-funnel-02.svg | `work/afterward/dist/assets/reference/filter-funnel-02.svg` | 1228 |
| https://www.mal.gg/yc/figma/grid-01.svg | `work/afterward/dist/assets/reference/grid-01.svg` | 2920 |
| https://www.mal.gg/yc/figma/icon-briefcase.svg | `work/afterward/dist/assets/reference/icon-briefcase.svg` | 728 |
| https://www.mal.gg/yc/figma/icon-building.svg | `work/afterward/dist/assets/reference/icon-building.svg` | 736 |
| https://www.mal.gg/yc/figma/icon-chevron-down.svg | `work/afterward/dist/assets/reference/icon-chevron-down.svg` | 337 |
| https://www.mal.gg/yc/figma/icon-chevron-left.svg | `work/afterward/dist/assets/reference/icon-chevron-left.svg` | 304 |
| https://www.mal.gg/yc/figma/icon-chevron-right.svg | `work/afterward/dist/assets/reference/icon-chevron-right.svg` | 304 |
| https://www.mal.gg/yc/figma/icon-command.svg | `work/afterward/dist/assets/reference/icon-command.svg` | 1835 |
| https://www.mal.gg/yc/figma/icon-x-logo.svg | `work/afterward/dist/assets/reference/icon-x-logo.svg` | 348 |
| https://www.mal.gg/yc/figma/link-03.svg | `work/afterward/dist/assets/reference/link-03.svg` | 1285 |
| https://www.mal.gg/yc/figma/list.svg | `work/afterward/dist/assets/reference/list.svg` | 1729 |
| https://www.mal.gg/yc/figma/marker-pin-01.svg | `work/afterward/dist/assets/reference/marker-pin-01.svg` | 770 |
| https://www.mal.gg/yc/figma/plus.svg | `work/afterward/dist/assets/reference/plus.svg` | 338 |
| https://www.mal.gg/yc/figma/search-md.svg | `work/afterward/dist/assets/reference/search-md.svg` | 516 |
| https://www.mal.gg/yc/figma/switch-vertical-01.svg | `work/afterward/dist/assets/reference/switch-vertical-01.svg` | 455 |
| https://www.mal.gg/yc/figma/user-01.svg | `work/afterward/dist/assets/reference/user-01.svg` | 762 |
| https://www.mal.gg/yc/figma/users-01.svg | `work/afterward/dist/assets/reference/users-01.svg` | 954 |
| https://www.mal.gg/yc/figma/x-close.svg | `work/afterward/dist/assets/reference/x-close.svg` | 325 |
| https://www.mal.gg/_next/static/immutable/chunks/1a89ibd9o8dtv.css | `work/afterward/docs/research/mal/1a89ibd9o8dtv.css` | 47792 |
| https://www.mal.gg/_next/static/immutable/chunks/1u7ghityj6fdn.css | `work/afterward/docs/research/mal/1u7ghityj6fdn.css` | 3707 |
| https://www.mal.gg/_next/static/immutable/chunks/2gtthp8lyw682.css | `work/afterward/docs/research/mal/2gtthp8lyw682.css` | 93884 |
| https://www.mal.gg/_next/static/immutable/media/fef07dbb0973bf53-s.00az9qtie3ho1.woff2 | `work/afterward/dist/assets/reference/fef07dbb0973bf53-s.00az9qtie3ho1.woff2` | 7252 |
| https://www.mal.gg/_next/static/immutable/media/8a480f0b521d4e75-s.3j-a226dh71aj.woff2 | `work/afterward/dist/assets/reference/8a480f0b521d4e75-s.3j-a226dh71aj.woff2` | 14900 |
| https://www.mal.gg/_next/static/immutable/media/53b9e256198e5412-s.2gwoz23eiro2t.woff2 | `work/afterward/dist/assets/reference/53b9e256198e5412-s.2gwoz23eiro2t.woff2` | 7968 |
| https://www.mal.gg/_next/static/immutable/media/7178b3e590c64307-s.0i3h3th1vs4m7.woff2 | `work/afterward/dist/assets/reference/7178b3e590c64307-s.0i3h3th1vs4m7.woff2` | 16540 |
| https://www.mal.gg/_next/static/immutable/media/caa3a2e1cccd8315-s.p.0zr6hhvz-h9nw.woff2 | `work/afterward/dist/assets/reference/caa3a2e1cccd8315-s.p.0zr6hhvz-h9nw.woff2` | 29288 |
| https://www.mal.gg/_next/static/immutable/media/5ce348bf30bf5439-s.27spqqad3wyeo.woff2 | `work/afterward/dist/assets/reference/5ce348bf30bf5439-s.27spqqad3wyeo.woff2` | 6204 |
| https://www.mal.gg/_next/static/immutable/media/4fa387ec64143e14-s.3f4zuumv8svu0.woff2 | `work/afterward/dist/assets/reference/4fa387ec64143e14-s.3f4zuumv8svu0.woff2` | 12872 |
| https://www.mal.gg/_next/static/immutable/media/6306c77e7c8268e4-s.34r5yzckw0h2s.woff2 | `work/afterward/dist/assets/reference/6306c77e7c8268e4-s.34r5yzckw0h2s.woff2` | 5892 |
| https://www.mal.gg/_next/static/immutable/media/7d817b4c03b0c5f1-s.2jyz_zw3a8jit.woff2 | `work/afterward/dist/assets/reference/7d817b4c03b0c5f1-s.2jyz_zw3a8jit.woff2` | 7728 |
| https://www.mal.gg/_next/static/immutable/media/bbc41e54d2fcbd21-s.30bdpjkrtcces.woff2 | `work/afterward/dist/assets/reference/bbc41e54d2fcbd21-s.30bdpjkrtcces.woff2` | 14712 |
| https://www.mal.gg/_next/static/immutable/media/797e433ab948586e-s.p.1v5bejj26fx9h.woff2 | `work/afterward/dist/assets/reference/797e433ab948586e-s.p.1v5bejj26fx9h.woff2` | 23108 |
