export default function FomoPlayIcon({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="none"
      viewBox="0 0 20 20"
      className={`${className ?? "text-white"}`}
    >
      <path
        stroke="currentColor"
        d="M15 8.75v-5h-3.75c0 .69 1.25 2.5-1.25 2.5s-1.25-1.81-1.25-2.5H5v5c-.69 0-2.5-1.25-2.5 1.25s1.81 1.25 2.5 1.25v5h3.75c0-.69-1.25-2.5 1.25-2.5s1.25 1.81 1.25 2.5H15v-5c.69 0 2.5 1.25 2.5-1.25S15.69 8.75 15 8.75z"
      ></path>
    </svg>
  );
}
