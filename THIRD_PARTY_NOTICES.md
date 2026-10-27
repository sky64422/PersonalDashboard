# Design references and third-party notices

## Lucian UX/UI Prompt

Source: https://lucianlabs.dev/uxui-prompt/ and https://github.com/Seokwoooo/lucian-uxui-prompt

The copy/check icon transition (#008) and sliding selection indicator (#039) are adapted to React and the application's CSS tokens. The detail-panel pattern (#273) informed panel motion. No autoplay demonstrations or clipboard-error suppression are included.

MIT License

Copyright (c) 2026 Seokwoooo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Other interaction references

- Arc UI: https://uiarc.dev/docs/motion and https://uiarc.dev/components/blocks/command-palette — keyboard interaction and restrained motion guidance. Implemented locally without copying Arc source or adding its motion dependency.
- Bencho: https://bencho.dev/ — evaluated sidebar, copy field and form-error interaction patterns. No source code or paid assets imported.
- Gr8r Studio: https://github.com/gr8rstudio/gr8r-studio/ and https://gr8r-taskmanagement.vercel.app/ — inspected the running home dashboard and adopted the idea of counted task-group switches. Implemented independently; no repository code, assets, or dependencies copied. No repository license was identified during review.
- shadcn/ui: https://ui.shadcn.com/docs/components/radix/dialog — composition approach; dialogs use the Radix primitive directly with original styling.
- shadcn/ui Theming, Switch, Input Group and Command documentation: https://ui.shadcn.com/docs/theming, https://ui.shadcn.com/docs/components/radix/switch, https://ui.shadcn.com/docs/components/radix/input-group, https://ui.shadcn.com/docs/components/radix/command — informed semantic foreground/surface pairs, clickable setting rows, input focus treatment and grouped command results. Implemented with existing React, native controls and Radix Dialog; no additional library or copied component source.

Runtime and tooling package licenses remain with their respective packages. The npm and Cargo lockfiles record the dependencies used by this application.

## Korean public holiday data

Source: https://github.com/hyunbinseo/holidays-kr
Bundled unmodified JSON snapshot (2018–2027), retrieved 2026-10-26. No runtime package or service dependency.

MIT License

Copyright (c) 2023 Hyunbin Seo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
