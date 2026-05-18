import Link from "next/link";

import { ProductImage } from "@/components/product-image";
import type { MenuProduct } from "@/types/menu";

type ProductCardProps = {
  product: MenuProduct;
};

function formatPrice(price: number | string) {
  return Number(price).toLocaleString("ko-KR");
}

function isEnabledFlag(value: string | null) {
  return value === "y";
}

function ProductBadges({ product }: ProductCardProps) {
  const badges = [
    isEnabledFlag(product.best_fl) ? "BEST" : null,
    isEnabledFlag(product.new_fl) ? "NEW" : null,
    isEnabledFlag(product.ice_fl) ? "ICE" : null,
  ].filter(Boolean);

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {badges.map((badge) => (
        <span
          key={badge}
          className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-700"
        >
          {badge}
        </span>
      ))}
    </div>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const isSoldOut = product.soldout_fl === "y";

  return (
    <Link
      href={`/menu/${product.goods_no}`}
      className="grid min-h-40 grid-cols-[minmax(0,1fr)_104px] gap-4 border-b border-neutral-100 bg-white px-4 py-4 transition duration-200 ease-out active:bg-neutral-50 last:border-b-0"
      aria-label={`${product.goods_nm} 상세 보기`}
    >
      <div className="flex min-w-0 flex-col justify-between py-1">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-[15px] font-semibold leading-5 text-neutral-950">
              {product.goods_nm}
            </h2>
            {isSoldOut ? (
              <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                품절
              </span>
            ) : null}
          </div>
          {product.goods_en_nm ? (
            <p className="mt-1 truncate text-xs text-neutral-500">{product.goods_en_nm}</p>
          ) : null}
          <ProductBadges product={product} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-base font-bold text-neutral-950">{formatPrice(product.goods_price)}원</p>
          {isSoldOut ? (
            <p className="text-xs text-red-700">현재 주문할 수 없습니다.</p>
          ) : (
            <span className="text-xs font-medium text-neutral-400">터치하여 선택</span>
          )}
        </div>
      </div>
      <div className={isSoldOut ? "overflow-hidden rounded-2xl opacity-45 grayscale" : "overflow-hidden rounded-2xl"}>
        <ProductImage goods_no={product.goods_no} alt={product.goods_nm} size="menuCard" />
      </div>
    </Link>
  );
}
