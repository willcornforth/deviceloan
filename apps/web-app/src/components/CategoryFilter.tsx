import { ComponentType } from 'react';

export interface Category {
  name: string;
  icon: ComponentType<{ className?: string }> | null;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

function CategoryFilter({ categories, selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {categories.map((category) => {
        const Icon = category.icon;
        const isSelected = selectedCategory === category.name;
        return (
          <button
            key={category.name}
            onClick={() => onCategoryChange(category.name)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              isSelected
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            {Icon && <Icon className="h-5 w-5" />}
            <span>{category.name}</span>
          </button>
        );
      })}
    </div>
  );
}

export default CategoryFilter;
