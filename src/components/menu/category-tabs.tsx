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
                  ? "shrink-0 rounded-full bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
                  : "shrink-0 rounded-full bg-neutral-100 px-4 py-2.5 text-sm font-semibold text-neutral-600 transition duration-200 ease-out active:bg-neutral-200"
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
