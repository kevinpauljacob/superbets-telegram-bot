  // useEffect(() => {
  //   function binomialCoefficient(n: number, k: number): number {
  //     function factorial(x: number): number {
  //       if (x === 0 || x === 1) return 1;
  //       return x * factorial(x - 1);
  //     }
  //     return factorial(n) / (factorial(k) * factorial(n - k));
  //   }

  //   function binomialProbability(n: number, k: number, p: number): number {
  //     return (
  //       binomialCoefficient(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k)
  //     );
  //   }

  //   function getMultipliers(
  //     n: number,
  //     level: string,
  //     multipliersDisk: RiskToChance,
  //   ): number[] | string {
  //     if (!(level in multipliersDisk)) {
  //       return `Invalid risk level: ${level}. Valid levels are 'low', 'medium', 'high'.`;
  //     }
  //     const multipliers = multipliersDisk[level][n];
  //     if (!multipliers) {
  //       return `No multipliers found for n = ${n} under level '${level}'.`;
  //     }
  //     return multipliers;
  //   }

  //   function calculateEv(
  //     n: number,
  //     p: number,
  //     level: string,
  //     multipliersDisk: RiskToChance,
  //   ): void {
  //     const multipliers = getMultipliers(n, level, multipliersDisk);
  //     console.log("multipliers", multipliers);
  //     if (typeof multipliers === "string") {
  //       console.log(multipliers);
  //       return;
  //     }

  //     const probabilities = Array.from({ length: n + 1 }, (_, k) =>
  //       binomialProbability(n, k, p),
  //     );

  //     let ev = 0;
  //     for (let k = 0; k <= n; k++) {
  //       const probabilityPercent = probabilities[k] * 100;
  //       const contribution = multipliers[k] * probabilityPercent;
  //       console.log(
  //         `level ${level} Probability % of landing in slot ${
  //           multipliers[k]
  //         }: ${probabilityPercent.toFixed(4)}%`,
  //       );
  //       ev += contribution;
  //     }

  //     console.log(getMultipliers(n, level, multipliersDisk));
  //     console.log(`level ${level} Expected value (EV): ${ev.toFixed(4)}`);
  //   }

  //   function adjustFirstLast(lst: number[], value: number): number[] | string {
  //     if (lst.length < 2) {
  //       return "List must have at least two elements.";
  //     }
  //     lst[0] = value;
  //     lst[lst.length - 1] = value;
  //     return lst;
  //   }

  //   function adjustRiskToChance(
  //     originalRiskToChance: RiskToChance,
  //     level: string,
  //     evInput: number = 100,
  //   ): Record<number, number[]> {
  //     //deep copy to prevent mutation of original risktochance object
  //     const clonedRiskToChance: RiskToChance = JSON.parse(
  //       JSON.stringify(originalRiskToChance),
  //     );
  //     const adjustedDict: Record<number, number[]> = {};
  //     for (const [nStr, multipliers] of Object.entries(
  //       clonedRiskToChance[level],
  //     )) {
  //       const n = parseInt(nStr);
  //       const probabilities = Array.from({ length: n + 1 }, (_, k) =>
  //         binomialProbability(n, k, 0.5),
  //       );
  //       let ev = 0;
  //       for (let k = 1; k < n; k++) {
  //         const probabilityPercent = probabilities[k] * 100;
  //         const contribution = multipliers[k] * probabilityPercent;
  //         ev += contribution;
  //       }
  //       const adjustedMultiplier =
  //         (evInput - ev) / (2 * probabilities[0] * 100);
  //       const adjustedList = adjustFirstLast(
  //         multipliers,
  //         Math.round(adjustedMultiplier * 100) / 100,
  //       ) as number[];
  //       adjustedDict[n] = adjustedList;
  //     }
  //     return adjustedDict;
  //   }

  //   const adjustedRiskToChance: RiskToChance = {
  //     low: {},
  //     medium: {},
  //     high: {},
  //   };

  //   for (const level of ["low", "medium", "high"]) {
  //     adjustedRiskToChance[level] = adjustRiskToChance(riskToChance, level);
  //   }

  //   console.log("adjustedRiskToChance =", adjustedRiskToChance);
  // }, []);