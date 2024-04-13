export default function Fomo({ className }: { className: string }) {
    return (
        <svg
        xmlns="http://www.w3.org/2000/svg"
        width="17"
        height="17"
        fill="none"
        viewBox="0 0 17 17"
        className={`${className ?? "text-white"}`}
      >
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M17 8.5a8.5 8.5 0 11-17 0 8.5 8.5 0 0117 0zm-4.123-2.719c.343-.213.8-.109.969.259a5.887 5.887 0 01-4.205 8.233A5.885 5.885 0 017.09 2.787c.393-.097.759.195.806.596.048.402-.243.76-.63.874a4.42 4.42 0 105.323 2.562c-.154-.374-.055-.824.289-1.038zM6.212 7.846a.654.654 0 100 1.308h4.25a.654.654 0 100-1.308h-4.25z"
          clipRule="evenodd"
          opacity="1"
        ></path>
      </svg>
    );
  }
  