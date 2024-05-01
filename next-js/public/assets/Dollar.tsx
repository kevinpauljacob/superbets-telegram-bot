export default function Dollar({ className }: { className: string }) {
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
        stroke="#fff"
        d="M10 15a6.25 6.25 0 100-12.5A6.25 6.25 0 0010 15zM2.5 15v2.5h15V15M9.375 8.75a1.25 1.25 0 010-2.5M10.625 8.75a1.25 1.25 0 010 2.5M10 5v1.25M10 11.25v1.25M9.375 8.75h1.25"
      ></path>
      <path
        fill="currentColor"
        stroke="#fff"
        d="M11.875 6.875s-.625-.625-1.25-.625h-1.25M8.125 10.625s.625.625 1.25.625h1.25"
      ></path>
            </svg>
);
}