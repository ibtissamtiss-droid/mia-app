export type PricingSettings = {
  targetNetIncome: number;
  workingDaysPerMonth: number;
  hoursPerDay: number;
  monthlyExpenses: number;
};

export function computeRates(settings: PricingSettings, cotisationRate: number) {
  const netPlusExpenses = settings.targetNetIncome + settings.monthlyExpenses;
  const rateFactor = 1 - cotisationRate / 100;
  const grossRevenue = rateFactor > 0 ? netPlusExpenses / rateFactor : 0;
  const cotisations = grossRevenue - netPlusExpenses;
  const dailyRate = settings.workingDaysPerMonth > 0 ? grossRevenue / settings.workingDaysPerMonth : 0;
  const hourlyRate = settings.hoursPerDay > 0 ? dailyRate / settings.hoursPerDay : 0;
  return { grossRevenue, cotisations, dailyRate, hourlyRate };
}
