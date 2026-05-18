"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const slides = [
  { src: "/slide/index1.png", alt: "Paik's Coffee 안내 슬라이드 1" },
  { src: "/slide/index2.png", alt: "Paik's Coffee 안내 슬라이드 2" },
  { src: "/slide/index3.png", alt: "Paik's Coffee 안내 슬라이드 3" },
];

export function KioskStartScreen() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="kiosk-page flex justify-center" aria-label="키오스크 시작 화면">
      <div className="kiosk-shell relative min-h-screen overflow-hidden bg-black text-white">
        <div
          className="absolute inset-0 cursor-pointer select-none"
          onClick={() => setShowActions(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setShowActions(true);
            }
          }}
          aria-label="화면을 터치해 선택 버튼을 표시"
        >
          {slides.map((slide, index) => (
            <div
              key={slide.src}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                index === activeSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                priority={index === 0}
                sizes="(max-width: 448px) 100vw, 448px"
                className="object-cover"
              />
            </div>
          ))}

          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/45" />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-1/2 flex translate-y-1/2 justify-center px-4">
          <div
            className={`pointer-events-auto w-full max-w-md transition-all duration-300 ease-out ${
              showActions
                ? "translate-y-0 opacity-100"
                : "translate-y-6 opacity-0"
            }`}
          >
            <div className="rounded-[1.75rem] border border-white/15 bg-black/35 p-3 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.75)] backdrop-blur-md">
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/menu"
                  className="flex min-h-16 items-center justify-center rounded-[1.25rem] bg-primary text-xl font-semibold text-primary-foreground transition duration-200 ease-out active:scale-[0.98] active:bg-primary/90"
                  aria-label="포장하기"
                >
                  포장하기
                </Link>
                <Link
                  href="/menu"
                  className="flex min-h-16 items-center justify-center rounded-[1.25rem] border border-primary/25 bg-white/95 text-xl font-semibold text-primary transition duration-200 ease-out active:scale-[0.98] active:bg-primary-soft"
                  aria-label="매장이용"
                >
                  매장이용
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
