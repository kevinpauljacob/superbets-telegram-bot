export default function Dice1({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="50"
      height="50"
      fill="none"
      viewBox="0 0 50 50"
      className={`${className ?? "text-white"}`}
    >
      <path
        fill="currentColor"
        d="M46.667.456H3.333A2.877 2.877 0 00.456 3.333v43.334a2.876 2.876 0 002.877 2.877h43.334a2.876 2.876 0 002.877-2.877V3.333A2.876 2.876 0 0046.667.456zM25 30.064a4.649 4.649 0 110-9.298 4.649 4.649 0 010 9.298z"
      ></path>
    </svg>
  );
}
