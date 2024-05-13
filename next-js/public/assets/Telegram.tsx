import Link from "next/link";

export default function Telegram({ className }: { className: string }) {
  return (
    <Link href="t.me/FOMO_wtf" target="_blank">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="23"
      height="19"
      viewBox="0 0 23 19"
      fill="none"
      className={`${className ?? "text-white"}`}
    >
      <path
        opacity="1"
        d="M21.0392 0.167723C21.0392 0.167723 23.1668 -0.654671 22.9895 1.34265C22.9304 2.16509 22.3985 5.04359 21.9848 8.15706L20.5663 17.3801C20.5663 17.3801 20.4481 18.7312 19.3843 18.9662C18.3204 19.2011 16.7247 18.1438 16.4292 17.9087C16.1928 17.7325 11.9966 15.089 10.519 13.7966C10.1053 13.4441 9.63245 12.7392 10.5781 11.9167L16.7838 6.04227C17.4931 5.33734 18.2022 3.69246 15.2472 5.68979L6.97292 11.2706C6.97292 11.2706 6.02725 11.858 4.25423 11.3293L0.41259 10.1544C0.41259 10.1544 -1.00586 9.27326 1.41732 8.39204C7.32753 5.63101 14.5971 2.81124 21.0392 0.167723Z"
        fill="currentColor"
        />
    </svg>
    </Link>
  );
}
