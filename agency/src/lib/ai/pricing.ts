// USD per 1M tokens (input, output). Estimates for cost monitoring; adjust to your contract.
const TABLE: [RegExp, [number, number]][] = [
  [/opus/i, [15, 75]], [/sonnet/i, [3, 15]], [/haiku/i, [0.8, 4]], [/fable/i, [5, 25]],
  [/gpt-4o-mini/i, [0.15, 0.6]], [/gpt-4o/i, [2.5, 10]], [/gpt-4\.1/i, [2, 8]], [/gpt-5/i, [1.25, 10]],
];
export function estimateCost(model: string, tin: number, tout: number): number {
  const p = TABLE.find(([re]) => re.test(model))?.[1] ?? [3, 15];
  return (tin * p[0] + tout * p[1]) / 1_000_000;
}
