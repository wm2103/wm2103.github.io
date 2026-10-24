export const categoryDefinitions = {
  web: { label: '开发笔记', description: '从代码到实践', tone: 'blue', icon: 'code' },
  ai: { label: '人工智能', description: '模型与应用实践', tone: 'coral', icon: 'network' },
} as const;

export type CategorySlug = keyof typeof categoryDefinitions;
export const categorySlugs = Object.keys(categoryDefinitions) as [CategorySlug, ...CategorySlug[]];
export const categories = categorySlugs.map(slug => ({ slug, ...categoryDefinitions[slug] }));
export const categoryNames = Object.fromEntries(
  categorySlugs.map(slug => [slug, categoryDefinitions[slug].label]),
) as Record<CategorySlug, string>;
