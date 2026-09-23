/** The parcel that marks the wishlist: the prizes points are saved up for. */
export function GiftIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? 'size-4 shrink-0'}
    >
      <path d="M4 11h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <path d="M3 7.5h18v3.5H3z" />
      <path d="M12 7.5V21" />
      <path d="M12 7.5H8.2a2.2 2.2 0 1 1 0-4.5C10.6 3 12 7.5 12 7.5zM12 7.5h3.8a2.2 2.2 0 1 0 0-4.5C13.4 3 12 7.5 12 7.5z" />
    </svg>
  )
}
