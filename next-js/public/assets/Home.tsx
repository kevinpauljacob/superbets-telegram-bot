export default function Home({ className }: { className: string }) {
    return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="16"
      fill="none"
      viewBox="0 0 15 16"
      className={`${className ?? "text-white"}`}
    >
      <path
        fill="currentColor"
        d="M5.238 14.821v-2.414a1.12 1.12 0 011.124-1.116H8.63c.298 0 .584.118.795.327.21.21.329.493.329.79v2.413c-.002.256.1.503.281.684.182.182.43.284.687.284h1.548a2.732 2.732 0 001.93-.788c.511-.507.799-1.195.799-1.913V6.21c0-.58-.259-1.13-.707-1.502L9.027.534A2.445 2.445 0 005.91.59L.763 4.709C.294 5.07.013 5.622 0 6.21v6.87a2.719 2.719 0 002.729 2.709H4.24c.536 0 .972-.43.976-.962l.021-.007z"
        opacity="0.5"
      ></path>
    </svg>
  );
}

