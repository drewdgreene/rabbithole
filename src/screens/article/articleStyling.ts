/**
 * Generate deeply themed CSS for the article WebView content.
 */
export function getArticleCSS(isDark: boolean): string {
  const t = isDark
    ? {
        bg: '#1A120B',
        text: '#EDE4D8',
        textSecondary: '#C4B49E',
        textTertiary: '#8B7355',
        heading: '#D4A574',
        link: '#5CC4B0',
        linkUnderline: 'rgba(92, 196, 176, 0.4)',
        surface: '#2D1F14',
        border: '#3D2A1A',
        bgSecondary: '#261A10',
        divider: '#332210',
        primary: '#D4A574',
        scrollThumb: '#D4A574',
      }
    : {
        bg: '#FAF6F0',
        text: '#2C1810',
        textSecondary: '#5C4033',
        textTertiary: '#8B7355',
        heading: '#6B4226',
        link: '#2E7D6F',
        linkUnderline: 'rgba(46, 125, 111, 0.4)',
        surface: '#FFFDF9',
        border: '#DDD4C8',
        bgSecondary: '#F0E8DC',
        divider: '#E8E0D4',
        primary: '#6B4226',
        scrollThumb: '#D4A574',
      };

  return `<style>
    /* ─── Base ─── */
    * { box-sizing: border-box; }
    body {
      background-color: ${t.bg} !important;
      color: ${t.text} !important;
      font-family: Georgia, 'Times New Roman', serif !important;
      font-size: 18px !important;
      line-height: 1.7 !important;
      padding: 0 20px 100px 20px !important;
      margin: 0 !important;
      -webkit-font-smoothing: antialiased;
    }

    /* ─── Hide duplicate hero content ─── */
    section[data-mw-section-id="0"] > h1:first-child,
    .pcs-lead-image,
    .mf-section-0 > .thumb:first-of-type,
    .mw-page-title-main { display: none !important; }

    /* ─── Headings ─── */
    h1, h2, h3, h4, h5, h6 {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif !important;
      color: ${t.heading} !important;
      margin-top: 32px !important;
      margin-bottom: 8px !important;
      line-height: 1.3 !important;
    }
    h2 {
      font-size: 22px !important;
      font-weight: 600 !important;
      padding-bottom: 8px !important;
      border-bottom: 1px solid ${t.divider} !important;
    }
    h3 {
      font-size: 18px !important;
      font-weight: 600 !important;
    }
    h4 {
      font-size: 16px !important;
      font-weight: 500 !important;
      color: ${t.textSecondary} !important;
    }
    .mw-headline { color: ${t.heading} !important; }

    /* ─── Paragraphs ─── */
    p {
      margin: 0 0 16px 0 !important;
    }

    /* ─── Links ─── */
    a {
      color: ${t.link} !important;
      text-decoration: underline !important;
      text-decoration-color: ${t.linkUnderline} !important;
      text-underline-offset: 2px;
    }
    a:hover {
      text-decoration-color: ${t.link} !important;
    }

    /* ─── Images & Figures ─── */
    img {
      max-width: 100% !important;
      height: auto !important;
      border-radius: 12px !important;
      margin: 8px 0 !important;
      cursor: zoom-in !important;
    }
    figure {
      margin: 16px 0 !important;
      text-align: center;
    }
    figcaption {
      color: ${t.textTertiary} !important;
      font-size: 14px !important;
      line-height: 1.4 !important;
      margin-top: 6px !important;
      font-style: italic;
    }

    /* ─── Infoboxes & Tables ─── */
    .infobox, .wikitable, .sidebar {
      background-color: ${t.surface} !important;
      border: 1px solid ${t.border} !important;
      border-radius: 12px !important;
      overflow: hidden !important;
      margin: 16px 0 !important;
      width: 100% !important;
      float: none !important;
    }
    .infobox th, .wikitable th, .sidebar th {
      background-color: ${t.bgSecondary} !important;
      color: ${t.heading} !important;
      padding: 10px 12px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif !important;
      font-weight: 600 !important;
      font-size: 14px !important;
    }
    .infobox td, .wikitable td, .sidebar td {
      padding: 8px 12px !important;
      border-color: ${t.border} !important;
      font-size: 15px !important;
      background-color: ${t.surface} !important;
    }
    .infobox caption, .sidebar .mw-headline,
    .infobox .infobox-title, .infobox .infobox-above,
    .infobox .infobox-header, .sidebar-title, .sidebar-above {
      background-color: ${t.bgSecondary} !important;
      color: ${t.heading} !important;
    }
    .infobox .infobox-image, .infobox .infobox-below {
      background-color: ${t.surface} !important;
    }
    table {
      border-color: ${t.border} !important;
      border-collapse: collapse;
      background-color: ${t.surface} !important;
    }
    th, td {
      border-color: ${t.border} !important;
      padding: 8px 12px !important;
    }
    th {
      background-color: ${t.bgSecondary} !important;
      color: ${t.heading} !important;
    }
    td {
      background-color: ${t.surface} !important;
      color: ${t.text} !important;
    }

    /* ─── PCS collapsible sections (Quick facts, etc.) ─── */
    .pcs-collapse-table-container,
    .pcs-collapse-table-content,
    details, details > * {
      background-color: ${t.surface} !important;
      border-color: ${t.border} !important;
    }
    .pcs-collapse-table-container {
      border: 1px solid ${t.border} !important;
      border-radius: 12px !important;
      overflow: hidden !important;
    }
    summary {
      background-color: ${t.bgSecondary} !important;
      color: ${t.textSecondary} !important;
    }

    /* ─── Hatnotes & disambiguation ─── */
    .hatnote, .dablink, .quotebox, .mw-parser-output > div:first-child {
      background-color: ${t.surface} !important;
      color: ${t.textSecondary} !important;
      border-color: ${t.border} !important;
    }

    /* ─── Nuclear dark mode: override ALL inline backgrounds ─── */
    [style*="background"] {
      background-color: ${t.surface} !important;
      color: ${t.text} !important;
    }
    [bgcolor] {
      background-color: ${t.surface} !important;
      color: ${t.text} !important;
    }
    tr[style*="background"], td[style*="background"],
    th[style*="background"], tr[bgcolor], td[bgcolor], th[bgcolor] {
      background-color: ${t.surface} !important;
      color: ${t.text} !important;
    }
    th[style*="background"], th[bgcolor] {
      background-color: ${t.bgSecondary} !important;
      color: ${t.heading} !important;
    }

    /* ─── Blockquotes ─── */
    blockquote {
      border-left: 3px solid ${t.primary} !important;
      margin: 16px 0 !important;
      padding: 8px 16px !important;
      color: ${t.textSecondary} !important;
      font-style: italic !important;
      background: transparent !important;
    }

    /* ─── Code ─── */
    code, pre {
      background-color: ${t.bgSecondary} !important;
      border-radius: 8px !important;
      font-family: 'SF Mono', 'Fira Code', monospace !important;
      font-size: 14px !important;
    }
    code { padding: 2px 6px !important; }
    pre {
      padding: 12px 16px !important;
      overflow-x: auto !important;
      margin: 16px 0 !important;
    }

    /* ─── Lists ─── */
    ul, ol {
      padding-left: 24px !important;
      margin: 8px 0 16px 0 !important;
    }
    li {
      margin-bottom: 4px !important;
    }

    /* ─── References ─── */
    .reflist, .references {
      font-size: 14px !important;
      line-height: 1.5 !important;
      color: ${t.textTertiary} !important;
    }
    sup.reference { font-size: 12px !important; }

    /* ─── Horizontal rules ─── */
    hr {
      border: none !important;
      border-top: 1px solid ${t.divider} !important;
      margin: 24px 0 !important;
    }

    /* ─── Force all PCS sections visible (mobile-html hides them by default) ─── */
    section[data-mw-section-id] { display: block !important; }
    .pcs-section-hidden { display: block !important; }
    .pcs-collapse-table-content { display: block !important; }
    .pcs-collapse-table-collapsed-container { display: none !important; }
    .pcs-edit-section-link-container,
    .pcs-edit-section-link { display: none !important; }

    /* ─── Hide Wikipedia chrome ─── */
    .navbox, .sistersitebox, .noprint, .mw-editsection,
    .mw-empty-elt, .mw-authority-control, .catlinks,
    .mw-jump-link, .mw-indicators, .mw-kartographer-container,
    .ambox, .ombox, .tmbox, .fmbox, .cmbox { display: none !important; }

    /* ─── Scrollbar ─── */
    * {
      scrollbar-width: thin;
      scrollbar-color: ${t.scrollThumb} transparent;
    }
    *::-webkit-scrollbar { width: 6px; height: 6px; }
    *::-webkit-scrollbar-track { background: transparent; }
    *::-webkit-scrollbar-thumb {
      background-color: ${t.scrollThumb};
      border-radius: 999px;
    }
  </style>`;
}
