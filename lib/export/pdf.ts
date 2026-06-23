/**
 * PDF export uses the browser's native print pipeline rather than a JS PDF
 * library (jsPDF, etc.). Print-to-PDF gives exact text fidelity, correct
 * font rendering, and respects CSS page-break rules — things JS PDF
 * generators routinely get wrong for rich content (tables, math, mixed
 * fonts). The trade-off is it opens the system print dialog instead of an
 * instant download; for a document meant for school submission, "open
 * print dialog → Save as PDF" is a one-extra-click, zero-fidelity-loss
 * trade worth making.
 *
 * This relies on a `data-pagebreak` marker class already present on
 * rendered pagebreak blocks (see globals.css `.pagebreak-block` rule using
 * `break-after: page` inside `@media print`).
 */
export function exportToPdf(): void {
  window.print();
}
