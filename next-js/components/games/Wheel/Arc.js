import arc from "./svg-arc";

export default function Arc({ index, rotationAngle, multiplier, segments }) {
  const segmentIndex =
    segments === 10
      ? 0
      : segments === 20
      ? 1
      : segments === 30
      ? 2
      : segments === 40
      ? 3
      : 4;

  const segment = multiplier[segmentIndex];
  const setting = segment[index];
  const color = setting?.color;
  const d = arc({
    x: 150,
    y: 150,
    R: 150,
    r: 90,
    start: index * rotationAngle,
    end: (index + 1) * rotationAngle,
  });
  console.log("index", index);
  console.log("multiplier", multiplier);
  console.log("segmentIndex", segmentIndex);
  console.log("segments", segment);
  console.log("setting", setting);
  console.log("color", color);

  return <path key={index} d={d} fill={color} fillRule="evenodd" />;
}
