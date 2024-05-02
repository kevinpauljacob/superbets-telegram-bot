export default function FomoExitIcon({ className }: { className: string }) {
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
        d="M10 17.5a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
      ></path>
      <path
        stroke="currentColor"
        d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM15.304 15.303L11.77 11.77M8.232 8.231L4.697 4.697M11.77 8.231l3.534-3.534M8.232 11.769l-3.535 3.534"
      ></path>
    </svg>
);
}