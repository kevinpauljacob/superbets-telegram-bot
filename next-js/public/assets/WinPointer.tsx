export default function WinPointer({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="18"
      fill="none"
      viewBox="0 0 24 18"
      className={`${className ?? "text-white"}`}
    >
      <path
        fill="currentColor"
        d="M15.124 16.092a4 4 0 01-6.248 0l-7.27-9.094C-.488 4.378 1.376.5 4.73.5h14.54c3.353 0 5.218 3.878 3.124 6.498l-7.27 9.094z"
      ></path>
    </svg>
  );
}
