export default function Dashboard({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="none"
      viewBox="0 0 20 20"
      className={`${className ?? "text-white"}`}
    >
      <g stroke="#fff" opacity="0.5">
        <path fill="currentColor" d="M10 12.5c2.071 0 3.75-2.239 3.75-5s-1.679-5-3.75-5c-2.071 0-3.75 2.239-3.75 5s1.679 5 3.75 5z"></path>
        <path fill="currentColor" d="M6.862 10.456s-3.15.84-3.753 2.5c-.906 2.5-.606 4.544-.606 4.544h15s.297-2.044-.607-4.544c-.603-1.66-3.753-2.5-3.753-2.5"></path>
      </g>
    </svg>
  );
}