/**
 * Single source of truth for page-layout constants.
 *
 * Previously PAGE_BREAK_HEIGHT_PX lived only as a comment-enforced
 * convention between usePageOverflow.ts and a CSS rule — and the CSS rule
 * targeted a class name (.page-break-block) that the actual PageBreak tool
 * never applied (it renders .pagebreak-block), so the two had already
 * drifted apart. Rather than re-sync two hardcoded numbers by convention,
 * PageBreak now sets its own height inline from this constant, so the
 * measurement code and the rendered element can never disagree.
 */
export const PAGE_HEIGHT_PX = 1122; // A4 at 96dpi
export const PAGE_BREAK_HEIGHT_PX = 64;
export const PAGEBREAK_TYPE = "pagebreak";
