import { useEffect, useState } from "react";

function CountdownTimer({
  betTime,
  minutes,
}: {
  betTime: number;
  minutes: number;
}) {
  const timestamp = new Date(betTime).getTime() + minutes * 60000;
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(timestamp));

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(timestamp);
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.total <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [minutes, betTime]);

  function calculateTimeLeft(targetTimestamp: number) {
    const now = Date.now();
    const difference = targetTimestamp - now;

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        total: 0,
      };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return {
      days,
      hours,
      minutes,
      seconds,
      total: difference,
    };
  }

  return (
    <div>
      {timeLeft.total > 0 ? (
        <div className="flex gap-2">
          <span className="font-changa text-xs md:text-sm text-[#F0F0F0] text-opacity-75">
            {timeLeft.minutes.toString().padStart(2, "0")}:
            {timeLeft.seconds.toString().padStart(2, "0")}
          </span>
        </div>
      ) : (
        <span className="font-changa text-xs md:text-sm text-[#F0F0F0] text-opacity-75">
          {betTime ? "ENDED" : "00:00"}
        </span>
      )}
    </div>
  );
}

export default CountdownTimer;
