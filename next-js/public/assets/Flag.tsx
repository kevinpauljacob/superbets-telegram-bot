export default function Flag({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="19"
      height="19"
      fill="none"
      viewBox="0 0 19 19"
      className={`${className ?? "text-white"}`}
    >
      <path
        fill="#fff"
        d="M15.734 2.85a.54.54 0 00-.593 0c-2.079 1.306-3.622.475-5.344-.475-1.781-.95-3.86-2.019-6.531-.416-.179.178-.297.357-.297.594v14.666c0 .356.237.593.594.593.356 0 .593-.237.593-.593v-5.997c1.96-1.069 3.385-.297 5.047.594 1.128.593 2.375 1.246 3.8 1.246.831 0 1.781-.237 2.731-.83a.623.623 0 00.297-.535V3.384a.624.624 0 00-.297-.534z"
        opacity="0.5"
      ></path>
    </svg>
  );
}

