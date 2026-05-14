"use client";

import Image from "next/image";
import { useState } from "react";

type ProductImageProps = {
  alt: string;
  goods_no: number;
  size: "thumbnail" | "detail";
};

const fallbackSrc = "/goods/default.png";

const imageSizes = {
  thumbnail: {
    className: "h-14 w-14 rounded-md border border-neutral-200 bg-neutral-50 p-1",
    height: 56,
    width: 56,
  },
  detail: {
    className: "h-80 w-full rounded-lg border border-neutral-200 bg-neutral-50 p-6",
    height: 320,
    width: 520,
  },
};

export function ProductImage({ alt, goods_no, size }: ProductImageProps) {
  const imageSrc = `/goods/${goods_no}.png`;
  const [didFail, setDidFail] = useState(false);
  const imageSize = imageSizes[size];
  const src = didFail ? fallbackSrc : imageSrc;

  return (
    <Image
      src={src}
      alt={alt}
      width={imageSize.width}
      height={imageSize.height}
      className={`${imageSize.className} object-contain`}
      onError={() => {
        if (!didFail) {
          setDidFail(true);
        }
      }}
    />
  );
}
