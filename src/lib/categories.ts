export const categoryDefinitions = {
  web: { label: '开发笔记', description: '从代码到实践', tone: 'blue', icon: 'code' },
  ai: { label: '深度学习', description: '探索智能的原理', tone: 'coral', icon: 'network' },
} as const;

export type CategorySlug = keyof typeof categoryDefinitions;
export const categorySlugs = Object.keys(categoryDefinitions) as [CategorySlug, ...CategorySlug[]];
export const categories = categorySlugs.map(slug => ({ slug, ...categoryDefinitions[slug] }));
export const categoryNames = Object.fromEntries(
  categorySlugs.map(slug => [slug, categoryDefinitions[slug].label]),
) as Record<CategorySlug, string>;
