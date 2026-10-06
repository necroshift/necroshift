export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <div
      className="bg-primary flex shrink-0 items-center justify-center rounded-md"
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.57}
        height={size * 0.57}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff7ed"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    </div>
  )
}
