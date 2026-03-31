// Mock data module — returns fixture data when VITE_MOCK_MODE=true.
// Fixture files are generated from real orbital calculations to ensure
// realistic journey durations and pricing.
// Full fixtures are populated during the mock deployment preparation step.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fixtures: Record<string, any> = {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMockData(key: string): any {
  if (fixtures[key] !== undefined) return fixtures[key];
  console.warn(
    `[Mock] No fixture found for key: "${key}". Returning empty data.`,
  );
  return null;
}
