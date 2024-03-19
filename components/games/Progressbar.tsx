import { useEffect, useState } from "react";

export default function Progressbar({
  minutes,
  betTime,
}: {
  minutes: number;
  betTime: number;
}) {
  const [timeLeft, setTimeLeft] = useState(
    new Date(betTime).getTime() + minutes * 60000 - Date.now()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = timeLeft - 1000;
      setTimeLeft((prev) => prev - 1000);

      // console.log(remaining);
      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [betTime]);

  return (
    <div className="h-[6px] w-full rounded-full bg-[#FFFFFF1A]">
      <div
        className="transition-width h-[6px] rounded-full bg-[#F200F2] duration-100"
        style={{
          width: `${(timeLeft * 100) / (minutes * 60000)}%`,
        }}
      />
    </div>
  );
}
