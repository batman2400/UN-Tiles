export function AiFeatureIcon({
  className = "w-4 h-4",
  variant = "spark",
}: {
  className?: string;
  variant?: "spark" | "badge";
}) {
  if (variant === "badge") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className={className}
      >
        <path
          d="M3.5 8V5.5C3.5 4.4 4.4 3.5 5.5 3.5H8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 3.5H18.5C19.6 3.5 20.5 4.4 20.5 5.5V8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20.5 16V18.5C20.5 19.6 19.6 20.5 18.5 20.5H16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 20.5H5.5C4.4 20.5 3.5 19.6 3.5 18.5V16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          fill="currentColor"
          d="M11.2 6.2C11.5 9.4 13.3 11.2 16.5 11.5C13.3 11.8 11.5 13.6 11.2 16.8C10.9 13.6 9.1 11.8 5.9 11.5C9.1 11.2 10.9 9.4 11.2 6.2Z"
        />
        <path
          fill="currentColor"
          d="M16.4 6.3C16.52 7.45 17.2 8.13 18.35 8.25C17.2 8.37 16.52 9.05 16.4 10.2C16.28 9.05 15.6 8.37 14.45 8.25C15.6 8.13 16.28 7.45 16.4 6.3Z"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        fill="currentColor"
        d="M10.5 2.5C10.85 7.1 13.4 9.65 18 10C13.4 10.35 10.85 12.9 10.5 17.5C10.15 12.9 7.6 10.35 3 10C7.6 9.65 10.15 7.1 10.5 2.5Z"
      />
      <path
        fill="currentColor"
        d="M19 3C19.2 5.1 20.4 6.3 22.5 6.5C20.4 6.7 19.2 7.9 19 10C18.8 7.9 17.6 6.7 15.5 6.5C17.6 6.3 18.8 5.1 19 3Z"
      />
      <path
        fill="currentColor"
        d="M18 15.5C18.15 17.1 19.1 18.05 20.7 18.2C19.1 18.35 18.15 19.3 18 20.9C17.85 19.3 16.9 18.35 15.3 18.2C16.9 18.05 17.85 17.1 18 15.5Z"
      />
    </svg>
  );
}
