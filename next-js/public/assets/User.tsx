import Link from "next/link";

export default function Telegram({ fill }: { fill: string }) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 21 21"
      fill={`${fill}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect opacity="0.1" width="21" height="21" rx="10.5" fill={`${fill}`} />
      <g clip-path="url(#clip0_3514_1359)">
        <path
          d="M11.9843 6.91195C12.8044 7.73205 12.8044 9.0617 11.9843 9.8818C11.1642 10.7019 9.83459 10.7019 9.01449 9.8818C8.19439 9.0617 8.19439 7.73205 9.01449 6.91195C9.83459 6.09185 11.1642 6.09185 11.9843 6.91195Z"
          fill={`${fill}`}
        />
        <path
          d="M13.7215 12.0092C11.8071 10.7157 9.19334 10.7157 7.27893 12.0092C6.9949 12.201 6.8252 12.525 6.8252 12.8762V14.6957H14.1752V12.8762C14.1752 12.525 14.0055 12.201 13.7215 12.0092Z"
          fill={`${fill}`}
        />
      </g>
      <defs>
        <clipPath id="clip0_3514_1359">
          <rect
            width="8.4"
            height="8.4"
            fill="white"
            transform="translate(6.2998 6.29688)"
          />
        </clipPath>
      </defs>
    </svg>
  );
}
