// import fs from "fs";
type RiskToChance = Record<string, Record<number, Array<number>>>;

export const riskToChance: RiskToChance = {
  classic: {
    1: [0, 4],
    2: [0, 1.925, 4.5],
    3: [0, 1.0222, 3.1, 10.4],
    4: [0, 0.8233, 1.8, 5, 22.5],
    5: [0, 0.2743, 1.4, 4.1, 16.5, 36],
    6: [0, 0, 1.4272, 2.68, 7, 16.5, 40],
    7: [0, 0, 0.4996, 3, 4.5, 14, 31, 60],
    8: [0, 0, 0, 2.2439, 4, 13, 22, 55, 70],
    9: [0, 0, 0, 1.5893, 3, 8, 15, 44, 60, 85],
    10: [0, 0, 0, 1.4334, 2.25, 4.5, 8, 17, 50, 80, 100],
  },
  low: {
    1: [0.7166, 1.85],
    2: [0, 2.03, 3.8],
    3: [0, 1.1257, 1.38, 26],
    4: [0, 0, 2.2503, 7.9, 90],
    5: [0, 0, 1.5395, 4.2, 13, 300],
    6: [0, 0, 1.1308, 2, 6.2, 100, 700],
    7: [0, 0, 1.1308, 1.6, 3.5, 15, 225, 700],
    8: [0, 0, 1.1286, 1.5, 2, 5.5, 39, 100, 800],
    9: [0, 0, 1.1277, 1.3, 1.7, 2.5, 7.5, 50, 250, 1000],
    10: [0, 0, 1.1399, 1.2, 1.3, 1.8, 3.5, 13, 50, 250, 1000],
  },
  medium: {
    1: [0.4166, 2.75],
    2: [0, 1.835, 5.1],
    3: [0, 0, 2.874, 50],
    4: [0, 0, 1.7568, 10, 100],
    5: [0, 0, 1.438, 4, 14, 390],
    6: [0, 0, 0, 3.0918, 9, 180, 710],
    7: [0, 0, 0, 2.0588, 7, 30, 400, 800],
    8: [0, 0, 0, 2.0484, 4, 11, 67, 400, 900],
    9: [0, 0, 0, 2.0406, 2.5, 5, 15, 100, 500, 1000],
    10: [0, 0, 0, 1.6355, 2, 4, 7, 26, 100, 500, 1000],
  },
  high: {
    1: [0, 4],
    2: [0, 0, 17.3333],
    3: [0, 0, 0, 82.3333],
    4: [0, 0, 0, 10.2777, 259],
    5: [0, 0, 0, 4.64, 48, 450],
    6: [0, 0, 0, 0, 11.4206, 350, 710],
    7: [0, 0, 0, 0, 7.227, 90, 400, 800],
    8: [0, 0, 0, 0, 5.1393, 20, 270, 600, 900],
    9: [0, 0, 0, 0, 4.0946, 11, 56, 500, 800, 1000],
    10: [0, 0, 0, 0, 3.8018, 8, 13, 3, 500, 800, 1000],
  },
};

// // binomial coefficent
// const binomial40x40 = [
//   [
//     1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 3, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 4, 6, 4, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 5, 10, 10, 5, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 6, 15, 20, 15, 6, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 7, 21, 35, 35, 21, 7, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 8, 28, 56, 70, 56, 28, 8, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 9, 36, 84, 126, 126, 84, 36, 9, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 10, 45, 120, 210, 252, 210, 120, 45, 10, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 11, 55, 165, 330, 462, 462, 330, 165, 55, 11, 1, 0, 0, 0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 12, 66, 220, 495, 792, 924, 792, 495, 220, 66, 12, 1, 0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 13, 78, 286, 715, 1287, 1716, 1716, 1287, 715, 286, 78, 13, 1, 0, 0, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 14, 91, 364, 1001, 2002, 3003, 3432, 3003, 2002, 1001, 364, 91, 14, 1, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 15, 105, 455, 1365, 3003, 5005, 6435, 6435, 5005, 3003, 1365, 455, 105,
//     15, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//     0, 0,
//   ],
//   [
//     1, 16, 120, 560, 1820, 4368, 8008, 11440, 12870, 11440, 8008, 4368, 1820,
//     560, 120, 16, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0,
//   ],
//   [
//     1, 17, 136, 680, 2380, 6188, 12376, 19448, 24310, 24310, 19448, 12376, 6188,
//     2380, 680, 136, 17, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0, 0,
//   ],
//   [
//     1, 18, 153, 816, 3060, 8568, 18564, 31824, 43758, 48620, 43758, 31824,
//     18564, 8568, 3060, 816, 153, 18, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 19, 171, 969, 3876, 11628, 27132, 50388, 75582, 92378, 92378, 75582,
//     50388, 27132, 11628, 3876, 969, 171, 19, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 20, 190, 1140, 4845, 15504, 38760, 77520, 125970, 167960, 184756, 167960,
//     125970, 77520, 38760, 15504, 4845, 1140, 190, 20, 1, 0, 0, 0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 21, 210, 1330, 5985, 20349, 54264, 116280, 203490, 293930, 352716,
//     352716, 293930, 203490, 116280, 54264, 20349, 5985, 1330, 210, 21, 1, 0, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 22, 231, 1540, 7315, 26334, 74613, 170544, 319770, 497420, 646646,
//     705432, 646646, 497420, 319770, 170544, 74613, 26334, 7315, 1540, 231, 22,
//     1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 23, 253, 1771, 8855, 33649, 100947, 245157, 490314, 817190, 1144066,
//     1352078, 1352078, 1144066, 817190, 490314, 245157, 100947, 33649, 8855,
//     1771, 253, 23, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 24, 276, 2024, 10626, 42504, 134596, 346104, 735471, 1307504, 1961256,
//     2496144, 2704156, 2496144, 1961256, 1307504, 735471, 346104, 134596, 42504,
//     10626, 2024, 276, 24, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 25, 300, 2300, 12650, 53130, 177100, 480700, 1081575, 2042975, 3268760,
//     4457400, 5200300, 5200300, 4457400, 3268760, 2042975, 1081575, 480700,
//     177100, 53130, 12650, 2300, 300, 25, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//     0, 0, 0,
//   ],
//   [
//     1, 26, 325, 2600, 14950, 65780, 230230, 657800, 1562275, 3124550, 5311735,
//     7726160, 9657700, 10400600, 9657700, 7726160, 5311735, 3124550, 1562275,
//     657800, 230230, 65780, 14950, 2600, 325, 26, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0, 0,
//   ],
//   [
//     1, 27, 351, 2925, 17550, 80730, 296010, 888030, 2220075, 4686825, 8436285,
//     13037895, 17383860, 20058300, 20058300, 17383860, 13037895, 8436285,
//     4686825, 2220075, 888030, 296010, 80730, 17550, 2925, 351, 27, 1, 0, 0, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 28, 378, 3276, 20475, 98280, 376740, 1184040, 3108105, 6906900, 13123110,
//     21474180, 30421755, 37442160, 40116600, 37442160, 30421755, 21474180,
//     13123110, 6906900, 3108105, 1184040, 376740, 98280, 20475, 3276, 378, 28, 1,
//     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 29, 406, 3654, 23751, 118755, 475020, 1560780, 4292145, 10015005,
//     20030010, 34597290, 51895935, 67863915, 77558760, 77558760, 67863915,
//     51895935, 34597290, 20030010, 10015005, 4292145, 1560780, 475020, 118755,
//     23751, 3654, 406, 29, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 30, 435, 4060, 27405, 142506, 593775, 2035800, 5852925, 14307150,
//     30045015, 54627300, 86493225, 119759850, 145422675, 155117520, 145422675,
//     119759850, 86493225, 54627300, 30045015, 14307150, 5852925, 2035800, 593775,
//     142506, 27405, 4060, 435, 30, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 31, 465, 4495, 31465, 169911, 736281, 2629575, 7888725, 20160075,
//     44352165, 84672315, 141120525, 206253075, 265182525, 300540195, 300540195,
//     265182525, 206253075, 141120525, 84672315, 44352165, 20160075, 7888725,
//     2629575, 736281, 169911, 31465, 4495, 465, 31, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 32, 496, 4960, 35960, 201376, 906192, 3365856, 10518300, 28048800,
//     64512240, 129024480, 225792840, 347373600, 471435600, 565722720, 601080390,
//     565722720, 471435600, 347373600, 225792840, 129024480, 64512240, 28048800,
//     10518300, 3365856, 906192, 201376, 35960, 4960, 496, 32, 1, 0, 0, 0, 0, 0,
//     0, 0, 0,
//   ],
//   [
//     1, 33, 528, 5456, 40920, 237336, 1107568, 4272048, 13884156, 38567100,
//     92561040, 193536720, 354817320, 573166440, 818809200, 1037158320,
//     1166803110, 1166803110, 1037158320, 818809200, 573166440, 354817320,
//     193536720, 92561040, 38567100, 13884156, 4272048, 1107568, 237336, 40920,
//     5456, 528, 33, 1, 0, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 34, 561, 5984, 46376, 278256, 1344904, 5379616, 18156204, 52451256,
//     131128140, 286097760, 548354040, 927983760, 1391975640, 1855967520,
//     2203961430, 2333606220, 2203961430, 1855967520, 1391975640, 927983760,
//     548354040, 286097760, 131128140, 52451256, 18156204, 5379616, 1344904,
//     278256, 46376, 5984, 561, 34, 1, 0, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 35, 595, 6545, 52360, 324632, 1623160, 6724520, 23535820, 70607460,
//     183579396, 417225900, 834451800, 1476337800, 2319959400, 3247943160,
//     4059928950, 4537567650, 4537567650, 4059928950, 3247943160, 2319959400,
//     1476337800, 834451800, 417225900, 183579396, 70607460, 23535820, 6724520,
//     1623160, 324632, 52360, 6545, 595, 35, 1, 0, 0, 0, 0, 0,
//   ],
//   [
//     1, 36, 630, 7140, 58905, 376992, 1947792, 8347680, 30260340, 94143280,
//     254186856, 600805296, 1251677700, 2310789600, 3796297200, 5567902560,
//     7307872110, 8597496600, 9075135300, 8597496600, 7307872110, 5567902560,
//     3796297200, 2310789600, 1251677700, 600805296, 254186856, 94143280,
//     30260340, 8347680, 1947792, 376992, 58905, 7140, 630, 36, 1, 0, 0, 0, 0,
//   ],
//   [
//     1, 37, 666, 7770, 66045, 435897, 2324784, 10295472, 38608020, 124403620,
//     348330136, 854992152, 1852482996, 3562467300, 6107086800, 9364199760,
//     12875774670, 15905368710, 17672631900, 17672631900, 15905368710,
//     12875774670, 9364199760, 6107086800, 3562467300, 1852482996, 854992152,
//     348330136, 124403620, 38608020, 10295472, 2324784, 435897, 66045, 7770, 666,
//     37, 1, 0, 0, 0,
//   ],
//   [
//     1, 38, 703, 8436, 73815, 501942, 2760681, 12620256, 48903492, 163011640,
//     472733756, 1203322288, 2707475148, 5414950296, 9669554100, 15471286560,
//     22239974430, 28781143380, 33578000610, 35345263800, 33578000610,
//     28781143380, 22239974430, 15471286560, 9669554100, 5414950296, 2707475148,
//     1203322288, 472733756, 163011640, 48903492, 12620256, 2760681, 501942,
//     73815, 8436, 703, 38, 1, 0, 0,
//   ],
//   [
//     1, 39, 741, 9139, 82251, 575757, 3262623, 15380937, 61523748, 211915132,
//     635745396, 1676056044, 3910797436, 8122425444, 15084504396, 25140840660,
//     37711260990, 51021117810, 62359143990, 68923264410, 68923264410,
//     62359143990, 51021117810, 37711260990, 25140840660, 15084504396, 8122425444,
//     3910797436, 1676056044, 635745396, 211915132, 61523748, 15380937, 3262623,
//     575757, 82251, 9139, 741, 39, 1, 0,
//   ],
//   [
//     1, 40, 780, 9880, 91390, 658008, 3838380, 18643560, 76904685, 273438880,
//     847660528, 2311801440, 5586853480, 12033222880, 23206929840, 40225345056,
//     62852101650, 88732378800, 113380261800, 131282408400, 137846528820,
//     131282408400, 113380261800, 88732378800, 62852101650, 40225345056,
//     23206929840, 12033222880, 5586853480, 2311801440, 847660528, 273438880,
//     76904685, 18643560, 3838380, 658008, 91390, 9880, 780, 40, 1,
//   ],
// ];

// export const truncateNumber = (num: number, numOfDecimals: number = 4) => {
//   const [whole, decimal] = num.toFixed(9).split(".");
//   return parseFloat(whole + "." + (decimal || "").slice(0, numOfDecimals));
// };

// export const isArrayUnique = (arr: number[]) => {
//   return new Set(arr).size === arr.length;
// };

// type Category = keyof RiskToChance;

// function adjustRiskToMatchExpectedValue(
//   category: Category,
//   troopCount: number,
//   ev: number,
//   risks: RiskToChance,
// ): number[] {
//   const riskValues = risks[category][troopCount];
//   const k = troopCount;
//   const n = 40;
//   const m = 10;

//   let firstNonZeroIndex = riskValues.findIndex((riskvalue) => riskvalue !== 0);
//   let denominator: number = binomial40x40[n][m];
//   let previousNumerator: number = 0;

//   for (let i = firstNonZeroIndex; i <= k; i++) {
//     previousNumerator +=
//       binomial40x40[k][i] * binomial40x40[n - k][m - i] * riskValues[i];
//   }

//   let expectedEv = previousNumerator / denominator;
//   console.log("expectedEv without change: ->", expectedEv * 100);
//   let numerator: number = 0;
//   for (let i = firstNonZeroIndex + 1; i <= k; i++) {
//     numerator +=
//       binomial40x40[k][i] * binomial40x40[n - k][m - i] * riskValues[i];
//   }
//   console.log("firstNonZeroIndex", firstNonZeroIndex);
//   console.log("ev given", ev);
//   let adjustedValue =
//     ((ev / 100) * denominator - numerator) /
//     (binomial40x40[k][firstNonZeroIndex] *
//       binomial40x40[n - k][m - firstNonZeroIndex]);
//   let expectedEvAfterAdjustment =
//     (numerator +
//       adjustedValue *
//         binomial40x40[k][firstNonZeroIndex] *
//         binomial40x40[n - k][m - firstNonZeroIndex]) /
//     denominator;
//   let adjustedarray = [
//     ...riskValues.slice(0, firstNonZeroIndex),
//     truncateNumber(adjustedValue, 2),
//     ...riskValues.slice(firstNonZeroIndex + 1, riskValues.length),
//   ];
//   console.log("Old multiplier", riskValues);
//   console.log("new Multiplier", adjustedarray);
//   console.log("Adjusted EV for k =", k, "->", expectedEvAfterAdjustment * 100);
//   return adjustedarray;
// }

// const main = () => {
//   let newRiskToChance: RiskToChance = {};
//   Object.keys(riskToChance).forEach((category) => {
//     newRiskToChance[category] = {}; // Initialize here
//     for (let i = 1; i <= 10; i++) {
//       const row = adjustRiskToMatchExpectedValue(
//         category as Category,
//         i,
//         100,
//         riskToChance as RiskToChance,
//       );
//       newRiskToChance[category][i] = row;
//     }
//   });

//   fs.writeFileSync("./output.json", JSON.stringify(newRiskToChance, null, 2));
// };

// main();
