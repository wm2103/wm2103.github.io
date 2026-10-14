// Apply loading policy during Markdown compilation, before browser requests begin.
// Satteri nodes are read-only; use its mutation API rather than editing the tree.
export default {
  name: 'article-lazy-images',
  element: {
    filter: ['img'],
    visit(node, ctx) {
      ctx.setProperty(node, 'loading', 'lazy');
      ctx.setProperty(node, 'decoding', 'async');
      ctx.setProperty(node, 'referrerPolicy', 'no-referrer');
    },
  },
  raw(node) {
    // Raw HTML remains opaque to preserve the imported notes' markup.
    // Code examples are text nodes and never enter this visitor.
    const value = node.value.replace(/<img\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi, (_, attributes) => {
      const cleaned = attributes.replace(/\s+(?:loading|decoding|referrerpolicy)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '').replace(/\s*\/$/, '');
      return '<img' + cleaned + ' loading="lazy" decoding="async" referrerpolicy="no-referrer">';
    });
    if(value !== node.value) return { type: 'raw', value };
  },
};
