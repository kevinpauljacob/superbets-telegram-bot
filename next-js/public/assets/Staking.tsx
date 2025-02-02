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
        d="M16.25 11.5C16.25 5.5 10 2.5 10 2.5C10 2.5 3.75 5.5 3.75 11.5C3.75 14.8125 6.5625 17.5 10 17.5C13.4375 17.5 16.25 14.8125 16.25 11.5Z"
        stroke="currentColor"
      />
      <path
        d="M6.875 11.5C6.89223 12.312 7.23099 13.084 7.81689 13.6465C8.4028 14.2089 9.18796 14.5159 10 14.5"
        stroke="currentColor"
      />
    </svg>
  );
}
