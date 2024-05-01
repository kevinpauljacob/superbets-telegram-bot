export default function Flag({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="none"
      viewBox="0 0 20 20"
      className={`${className ?? "text-white"}`}
    >
    <path fill="currentColor" stroke="#fff" d="M5 10h10l-3.75-3.75L15 2.5H5v15"></path>
    </svg>
  );
}
