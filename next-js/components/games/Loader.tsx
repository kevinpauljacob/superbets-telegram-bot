export { Loader };

interface LoaderProps {
  color?: string;
  duration?: number;
  loading?: boolean;
  className?: string;
}

function Loader({ color, duration, loading, className = "" }: LoaderProps) {
  return (
    <div
      className={`w-full h-full relative flex items-center justify-center ${className}`}
    >
      <div className="leapfrog">
        <div className="leapfrog_dot"></div>
        <div className="leapfrog_dot"></div>
        <div className="leapfrog_dot"></div>
      </div>
    </div>
  );
}

Loader.defaultProps = {
  color: "white",
  duration: 5,
  loading: true,
};

export default Loader;
