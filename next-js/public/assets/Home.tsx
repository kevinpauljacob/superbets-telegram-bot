export default function Home({ className }: { className: string }) {
    return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="none"
          viewBox="0 0 20 20"
          className={`${className ?? "text-white"}`}
        >
          <path fill="currentColor" stroke="#9945FF" d="M2.5 7.5v10h15v-10l-7.5-5-7.5 5z"></path>
          <path stroke="#9945FF" d="M12.5 17.5v-6.25h-5v6.25"></path>
        </svg>
      );
    }
  