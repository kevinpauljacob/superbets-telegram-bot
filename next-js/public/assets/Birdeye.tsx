export default function Birdeye({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      fill="none"
      viewBox="0 0 15 15"
      className={`${className ?? "text-white"}`}
    >
      <g clipPath="url(#clip0_1558_911)" opacity="0.5">
        <mask
          id="mask0_1558_911"
          style={{ maskType: "luminance" }}
          width="15"
          height="15"
          x="0"
          y="0"
          maskUnits="userSpaceOnUse"
        >
          <path
            fill="currentColor"
            d="M10.658 13.259a7.105 7.105 0 112.457-2.364L10.711 9.38a4.263 4.263 0 10-1.474 1.418l1.42 2.462z"
          ></path>
        </mask>
        <g mask="url(#mask0_1558_911)">
          <path
            stroke="currentColor"
            strokeWidth="10"
            d="M10.658 13.259a7.105 7.105 0 112.457-2.364L10.711 9.38a4.263 4.263 0 10-1.474 1.418l1.42 2.462z"
          ></path>
        </g>
        <path
          fill="currentColor"
          d="M7.105 9.886a2.78 2.78 0 100-5.561 2.78 2.78 0 000 5.56z"
        ></path>
      </g>
      <defs>
        <clipPath id="clip0_1558_911">
          <path fill="currentColor" d="M0 0H14.21V14.21H0z"></path>
        </clipPath>
      </defs>
    </svg>
  );
}
