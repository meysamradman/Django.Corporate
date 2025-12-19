import type { CategoryItem, FilterOption } from "@/types/shared/table";

export function transformCategoriesToHierarchical(options: (FilterOption & { parent_id?: string | number | null })[]): CategoryItem[] {
  const items: CategoryItem[] = options.map(option => ({
    id: typeof option.value === 'string' ? option.value : String(option.value),
    label: option.label,
    value: typeof option.value === 'string' ? option.value : String(option.value),
    parent_id: option.parent_id ? String(option.parent_id) : null,
    children: []
  }));
  
  const itemMap: Record<string, CategoryItem> = {};
  const rootItems: CategoryItem[] = [];
  
  items.forEach(item => {
    itemMap[item.id] = { ...item, children: [] };
  });
  
  items.forEach(item => {
    if (item.parent_id && itemMap[item.parent_id]) {
      if (!itemMap[item.parent_id].children) {
        itemMap[item.parent_id].children = [];
      }
      itemMap[item.parent_id].children!.push(itemMap[item.id]);
    } else {
      rootItems.push(itemMap[item.id]);
    }
  });
  
  return rootItems;
}

export function mapCategoriesToFilterOptions(categories: { id: string | number, name: string, parent_id?: string | number | null }[]): (FilterOption & { parent_id?: string | number | null })[] {
  return categories.map(category => ({
    label: category.name,
    value: typeof category.id === 'number' ? String(category.id) : category.id,
    parent_id: category.parent_id
  }));
} 