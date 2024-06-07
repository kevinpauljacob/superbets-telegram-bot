export default function SOL({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="none"
      viewBox="0 0 22 22"
      className={`${className ?? "text-white"}`}
    >
      <g stroke="currentColor" opacity="1">
        <path d="M13.75 9.625l2.75 2.75-2.75 2.75H5.5l2.75-2.75-2.75-2.75 2.75-2.75h8.25l-2.75 2.75zM5.5 9.625h8.25M8.25 12.375h8.25"></path>
        <path d="M11 19.25a8.25 8.25 0 100-16.5 8.25 8.25 0 000 16.5z"></path>
      </g>
    </svg>
  );
}
