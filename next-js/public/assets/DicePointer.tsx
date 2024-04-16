export default function DicePointer({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="10"
      fill="none"
      viewBox="0 0 12 10"
      className={`${className ?? "text-[#282E3D]"}`}
    >
      <path
        fill="currentColor"
        d="M9.133 8.054a4 4 0 01-6.266 0L1.623 6.487C-.457 3.866 1.41 0 4.756 0h2.488c3.347 0 5.214 3.866 3.133 6.487L9.133 8.054z"
      ></path>
    </svg>
  );
}
