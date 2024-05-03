export default function Staking({ className }: { className: string }) {
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
        stroke="#9945FF"
        d="M16.25 11.5c0-6-6.25-9-6.25-9s-6.25 3-6.25 9c0 3.313 2.813 6 6.25 6 3.438 0 6.25-2.688 6.25-6zM6.875 11.5a3.066 3.066 0 003.125 3"
      ></path>
    </svg>
  );
}

