import Link from "next/link";

import type { MenuCategory } from "@/types/menu";

type CategoryTabsProps = {
  activeCateCd: string;
  categories: MenuCategory[];
};

export function CategoryTabs({ activeCateCd, categories }: CategoryTabsProps) {
  return (
    <nav className="sticky top-[92px] z-10 overflow-x-auto border-b border-neutral-100 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="flex gap-2">
        {categories.map((category) => {
          const isActive = category.cate_cd === activeCateCd;

          return (
            <Link
              key={category.cate_cd}
              href={`/menu?cate_cd=${encodeURIComponent(category.cate_cd)}`}
              className={
                isActive
                  ? "shrink-0 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_12px_28px_-18px_rgba(0,31,96,0.75)]"
                  : "shrink-0 rounded-full bg-neutral-100 px-4 py-2.5 text-sm font-semibold text-neutral-600 transition duration-200 ease-out active:bg-primary-soft active:text-primary"
              }
            >
              {category.cate_nm}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
