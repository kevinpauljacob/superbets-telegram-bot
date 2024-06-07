export default function USDC({ className }: { className: string }) {
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
          <path d="M19.25 11L11 19.25 2.75 11 5.5 4.125h11L19.25 11z"></path>
          <path d="M11 12.375c2.278 0 4.125-.616 4.125-1.375 0-.76-1.847-1.375-4.125-1.375S6.875 10.241 6.875 11c0 .76 1.847 1.375 4.125 1.375zM8.25 6.875h5.5M11 15.125v-8.25"></path>
        </g>
      </svg>
    );
  }
  