import arc from "./svg-arc";
import { riskToChance } from "./Segments";

export default function Arc({ index, rotationAngle, risk, segments }) {
  const item = riskToChance[risk];

  let color;
  for (let i = 0, isFound = false; i < segments && !isFound; ) {
    for (let j = 0; j < item.length; j++) {
      i += item[j].chance / 10;

      if (index < i) {
        color = item[j].color;
        isFound = true;
        break;
      }
    }
  }

  const d = arc({
    x: 150,
    y: 150,
    R: 140,
    r: 100,
    start: index * rotationAngle,
    end: (index + 1) * rotationAngle,
  });

  return (
    <path
      key={index}
      d={d}
      fill={color}
      fillRule="evenodd"
      className="segment"
    />
  );
}
