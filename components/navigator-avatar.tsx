'use client';
import Image from 'next/image';

const LOGO_URL =
  'https://assets.cdn.filesafe.space/2rx7sGBL7YKaiP0HwK56/media/6a380e1e1c5d711b35ce5f63.png';

export function NavigatorAvatar({
  thinking = false,
  size = 40,
}: {
  thinking?: boolean;
  size?: number;
}) {
  return (
    <div
      className="relative inline-flex items-center justify-center rounded-full"
      style={{ width: size, height: size }}
    >
      <div
        aria-hidden
        className={thinking ? 'animate-navigator-pulse absolute inset-0 rounded-full' : 'absolute inset-0 rounded-full'}
        style={{
          background:
            'conic-gradient(from 0deg, #0E90C8, #1DBBEE, #6fe0ff, #1DBBEE, #0E90C8)',
          filter: 'blur(5px)',
          opacity: thinking ? 0.9 : 0,
          transition: 'opacity 0.4s ease',
        }}
      />
      <div
        className="relative z-10 overflow-hidden rounded-full bg-[#030A18]"
        style={{ width: size - 6, height: size - 6 }}
      >
        <Image
          src={LOGO_URL}
          alt="AMZ Navigator"
          width={size}
          height={size}
          className="h-full w-full object-contain"
          priority
        />
      </div>
    </div>
  );
}
