export default function Thunder({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="17"
      fill="none"
      viewBox="0 0 10 17"
      className={`${className ?? ""}`}
    >
      <path
        fill="url(#paint0_linear_4378_1429)"
        d="M9.013 4.492c-.08-.08-.238-.159-.317-.159h-.08l-3.72.95L6.48.93c0-.079.08-.158.08-.158 0-.08-.08-.238-.159-.317-.079-.079-.158-.079-.316-.079H2.996c-.158 0-.237 0-.317.08C2.6.532 2.6.612 2.521.691l-1.9 7.837c0 .159 0 .238.158.396.08.08.159.08.317.08h.08l3.878-.95-1.9 7.678c0 .08 0 .159.08.317.079.08.158.158.237.158h.158c.159 0 .317-.079.396-.237L9.171 4.967c0-.159 0-.317-.158-.475z"
      ></path>
      <defs>
        <linearGradient
          id="paint0_linear_4378_1429"
          x1="0.641"
          x2="9.141"
          y1="8.265"
          y2="8.265"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#1245C6"></stop>
          <stop offset="1" stopColor="#9909B7"></stop>
        </linearGradient>
      </defs>
    </svg>
  );
}
