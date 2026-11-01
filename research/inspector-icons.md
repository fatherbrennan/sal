# Calculation inspector icon review

Reviewed 27 October 2026 after the user required icon-only pinning and a complete icon audit.

UTF-8 is an encoding, not a visual style. The inspector uses ordinary text characters with one
font, weight, size and colour treatment. Button geometry is separate from glyph geometry.

| Context                                                    | Decision                                    | Reason                                                                                                                                       |
| ---------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Pin beside comparison                                      | `◫`, square toggle                          | Depicts the side-by-side layout. The accessible name stays stable; `aria-pressed`, a double border and the tooltip identify its state.       |
| Close                                                      | `×`, square button                          | Familiar dismissal control; accessible name and hover/focus label identify the action.                                                       |
| Back                                                       | `←`, square button                          | Returns through visit history. Disabled at the first visit.                                                                                  |
| Clear search                                               | `×`, square button beside the search field  | Clears only the query and restores input focus. Replaces the browser-dependent clear decoration.                                             |
| Value, related-value and search-result rows                | Full name and amount, with one trailing `→` | Opens another value. The whole row is the target; the arrow is decorative.                                                                   |
| Expand/collapse                                            | `▸` / `▾` beside the full section label     | Indicates hidden/visible content in place, distinct from navigating to another value.                                                        |
| Formula variables, trail entries and parent references     | Named text links/buttons                    | The destination's identity is essential; an icon cannot replace it.                                                                          |
| Equations, amounts, units, sources and unavailable reasons | Text                                        | These carry calculation meaning. Mathematical operators are content, not action icons.                                                       |
| Dependency and collection rows                             | No leading branch icon                      | The old `↳` repeated the navigation cue and could be mistaken for an operator. Collections list their members without inventing an equation. |

`◫` is a design choice for this layout control, not a universal pin convention. The user explicitly
requested an icon-only control. Its tooltip appears on hover and keyboard focus and supports Escape;
its accessible label remains available without the tooltip. Pinning is offered only when the
comparison and inspector fit beside each other.

A pushpin emoji was rejected: Unicode's standardized text-variation list does not contain U+1F4CC.
Adding a text variation selector therefore does not establish consistent monochrome rendering.
Geometric characters avoid that emoji choice, but actual glyph outlines still depend on installed
fonts. Cross-platform visual identity and user recognition have not been established.

Verified in isolated Windows browser sessions: Chrome 156.0.8078.48, Edge 156.0.4314.42 and
Playwright Firefox 157.0. Checks cover square controls, pin/unpin by keyboard, pressed state,
hover/focus labels, Escape, query clearing and focus recovery, collection navigation, and 320px
reflow. Light/dark screenshots were reviewed. The focused inspector checks passed against both
development and the static production build on port 2000. Collection navigation tests now follow
the labeled item rows instead of relying on the removed artificial formula links.
Screen-reader, physical-device and macOS/Linux verification remains incomplete. Safari is excluded.

Evidence:
- [WAI button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/): accessible names and stable toggle labels.
- [WAI toolbar example](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/examples/toolbar/): labels on hover/focus and Escape dismissal.
- [WAI disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/): right/down indicators for collapsed/expanded content.
- [Unicode geometric shapes](https://www.unicode.org/charts/PDF/U25A0.pdf): U+25EB is a square with a vertical bisecting line; glyph shapes vary by font.
- [Unicode emoji variation sequences](https://www.unicode.org/Public/17.0.0/ucd/emoji/emoji-variation-sequences.txt): standardized text/emoji variations.
- [Nielsen Norman Group icon usability research](https://www.nngroup.com/articles/icon-usability/): most icons are ambiguous; essential destinations retain text labels.
