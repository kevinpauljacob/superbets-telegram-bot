export default function Dice4({ className }: { className: string }) {
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
        d="M46.213 0H2.877A2.877 2.877 0 000 2.877v43.336a2.877 2.877 0 002.877 2.877h43.336a2.877 2.877 0 002.877-2.877V2.877A2.877 2.877 0 0046.213 0zm-36.5 43.555a4.649 4.649 0 110-9.297 4.649 4.649 0 010 9.297zm0-28.712a4.649 4.649 0 110-9.297 4.649 4.649 0 010 9.297zm29.664 28.712a4.649 4.649 0 114.649-4.648 4.66 4.66 0 01-4.649 4.648zm0-28.712a4.649 4.649 0 114.649-4.649 4.66 4.66 0 01-4.649 4.649z"
      ></path>
    </svg>
  );
}
