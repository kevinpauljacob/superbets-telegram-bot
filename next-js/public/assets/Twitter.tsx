export default function Twitter({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 18 20"
      className={`${className ?? "text-white"}`}
    >
      <path
        fill="currentColor"
        d="M17.448 17.646L11.73 8.665l5.6-6.158A1.125 1.125 0 0015.662.993l-5.181 5.704-3.534-5.55A1.125 1.125 0 006 .624H1.5a1.125 1.125 0 00-.948 1.729l5.718 8.981-5.602 6.158a1.125 1.125 0 101.665 1.514l5.185-5.704 3.534 5.55a1.125 1.125 0 00.948.522h4.5a1.125 1.125 0 00.95-1.729zm-4.83-.521l-9.07-14.25h1.833l9.069 14.25h-1.833z"
      ></path>
    </svg>
  );
}