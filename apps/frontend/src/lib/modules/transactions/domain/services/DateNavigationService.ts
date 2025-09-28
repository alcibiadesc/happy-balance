export interface DateNavigationService {
  previousPeriod(currentPeriod: string): string;
  nextPeriod(currentPeriod: string): string;
  getCurrentPeriod(): string;
}

export const createDateNavigationService = (): DateNavigationService => {
  const getCurrentPeriod = (): string => {
    return new Date().toISOString().slice(0, 7);
  };

  const previousPeriod = (currentPeriod: string): string => {
    if (!currentPeriod) {
      return getCurrentPeriod();
    }
    const date = new Date(currentPeriod + '-01');
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().slice(0, 7);
  };

  const nextPeriod = (currentPeriod: string): string => {
    if (!currentPeriod) {
      return getCurrentPeriod();
    }
    const date = new Date(currentPeriod + '-01');
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().slice(0, 7);
  };

  return {
    previousPeriod,
    nextPeriod,
    getCurrentPeriod
  };
};