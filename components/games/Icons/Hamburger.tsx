export default function Hamburger() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="50"
      height="43"
      fill="none"
      viewBox="0 0 50 43"
    >
      <g
        stroke="#fff"
        strokeLinecap="round"
        strokeWidth="3"
        filter="url(#filter0_d_1081_2429)"
      >
        <path d="M10 7.5h28M10 17.5h28M10 27.5h28"></path>
      </g>
      <defs>
        <filter
          id="filter0_d_1081_2429"
          width="49.8"
          height="41.8"
          x="0.1"
          y="0.6"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          ></feColorMatrix>
          <feOffset dx="1" dy="4"></feOffset>
          <feGaussianBlur stdDeviation="4.7"></feGaussianBlur>
          <feComposite in2="hardAlpha" operator="out"></feComposite>
          <feColorMatrix values="0 0 0 0 0.94902 0 0 0 0 0 0 0 0 0 0.94902 0 0 0 0.61 0"></feColorMatrix>
          <feBlend
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1081_2429"
          ></feBlend>
          <feBlend
            in="SourceGraphic"
            in2="effect1_dropShadow_1081_2429"
            result="shape"
          ></feBlend>
        </filter>
      </defs>
    </svg>
  );
}
