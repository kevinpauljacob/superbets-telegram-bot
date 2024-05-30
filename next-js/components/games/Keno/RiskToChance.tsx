type RiskToChance = Record<string, Record<number, Array<number>>>;

export const riskToChance: RiskToChance = {
  classic: {
    1: [0.0, 3.96],
    2: [0.0, 1.9, 4.5],
    3: [0.0, 1.0, 3.1, 10.4],
    4: [0.0, 0.8, 1.8, 5.0, 22.5],
    5: [0.0, 0.25, 1.4, 4.1, 16.5, 36.0],
    6: [0.0, 0.0, 1.0, 2.68, 7.0, 16.5, 40.0],
    7: [0.0, 0.0, 0.47, 3.0, 4.5, 14.0, 31.0, 60.0],
    8: [0.0, 0.0, 0.0, 2.2, 4.0, 13.0, 22.0, 55.0, 70.0],
    9: [0.0, 0.0, 0.0, 1.55, 3.0, 8.0, 15.0, 44.0, 60.0, 85.0],
    10: [0.0, 0.0, 0.0, 1.4, 2.25, 4.5, 8.0, 17.0, 50.0, 80.0, 100.0],
  },
  low: {
    1: [0.7, 1.85],
    2: [0.0, 2.0, 3.8],
    3: [0.0, 1.1, 1.38, 26.0],
    4: [0.0, 0.0, 2.2, 7.9, 90.0],
    5: [0.0, 0.0, 1.5, 4.2, 13.0, 300.0],
    6: [0.0, 0.0, 1.1, 2.0, 6.2, 100.0, 700.0],
    7: [0.0, 0.0, 1.1, 1.6, 3.5, 15.0, 225.0, 700.0],
    8: [0.0, 0.0, 1.1, 1.5, 2.0, 5.5, 39.0, 100.0, 800.0],
    9: [0.0, 0.0, 1.1, 1.3, 1.7, 2.5, 7.5, 50.0, 250.0, 1000.0],
    10: [0.0, 0.0, 1.1, 1.2, 1.3, 1.8, 3.5, 13.0, 50.0, 250.0, 1000.0],
  },
  medium: {
    1: [0.4, 2.75],
    2: [0.0, 1.8, 5.1],
    3: [0.0, 0.0, 2.8, 50.0],
    4: [0.0, 0.0, 1.7, 10.0, 100.0],
    5: [0.0, 0.0, 1.4, 4.0, 14.0, 390.0],
    6: [0.0, 0.0, 0.0, 3.0, 9.0, 180.0, 710.0],
    7: [0.0, 0.0, 0.0, 2.0, 7.0, 30.0, 400.0, 800.0],
    8: [0.0, 0.0, 0.0, 1.0, 4.0, 11.0, 67.0, 400.0, 900.0],
    9: [0.0, 0.0, 0.0, 2.0, 2.5, 5.0, 15.0, 100.0, 500.0, 1000.0],
    10: [0.0, 0.0, 0.0, 1.6, 2.0, 4.0, 7.0, 26.0, 100.0, 500.0, 1000.0],
  },
  high: {
    1: [0.0, 3.96],
    2: [0.0, 0.0, 17.1],
    3: [0.0, 0.0, 0.0, 81.5],
    4: [0.0, 0.0, 0.0, 10.0, 259.0],
    5: [0.0, 0.0, 0.0, 4.5, 48.0, 450.0],
    6: [0.0, 0.0, 0.0, 0.0, 11.0, 350.0, 710.0],
    7: [0.0, 0.0, 0.0, 0.0, 7.0, 90.0, 400.0, 800.0],
    8: [0.0, 0.0, 0.0, 0.0, 5.0, 20.0, 270.0, 600.0, 900.0],
    9: [0.0, 0.0, 0.0, 0.0, 4.0, 11.0, 56.0, 500.0, 800.0, 1000.0],
    10: [0.0, 0.0, 0.0, 0.0, 3.5, 8.0, 13.0, 3.0, 500.0, 800.0, 1000.0],
  },
};

function comb(n: number, k: number): number {
  if (k === 0 || k === n) {
    return 1;
  }
  let numerator = 1;
  for (let i = 0; i < k; i++) {
    numerator *= n - i;
  }
  let denominator = 1;
  for (let i = 1; i <= k; i++) {
    denominator *= i;
  }
  return numerator / denominator;
}

function hypergeometricDistribution(
  N: number,
  k: number,
  n: number,
  x: number,
): number {
  return (comb(k, x) * comb(N - k, n - x)) / comb(N, n);
}

function calculateExpectedValue(
  values: number[],
  N: number,
  k: number,
  n: number,
): number {
  let ev = 0;
  for (let x = 1; x < values.length; x++) {
    ev += hypergeometricDistribution(N, k, n, x) * values[x];
  }
  return ev;
}

function adjustFirstNonzeroValue(
  category: string,
  k: number,
  N: number,
  n: number,
  targetEv: number,
): number[] {
  let values = riskToChance[category][k];
  let index = values.findIndex((value) => value !== 0);

  while (index < values.length) {
    let low = 0;
    let high = targetEv * 2; 

    while (low < high) {
      let mid = (low + high) / 2;
      values[index] = mid;
      let currentEv = calculateExpectedValue(values, N, k, n);

      if (mid < 0) {
        break; // 
      }

      if (Math.abs(currentEv - targetEv) < 1e-6) {
        return values;
      } else if (currentEv < targetEv) {
        low = mid;
      } else {
        high = mid;
      }
    }

    while (++index < values.length && values[index] === 0) {
    }

    if (index >= values.length) {
      break;
    }
  }

  return values;
}

const res = adjustFirstNonzeroValue("classic", 2, 10, 40, 100);
console.log(res)

