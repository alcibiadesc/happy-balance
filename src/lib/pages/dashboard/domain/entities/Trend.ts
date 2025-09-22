// Entity: Trend
export class Trend {
  constructor(
    private readonly current: number,
    private readonly previous: number,
    private readonly percentageChange: number,
    private readonly direction: 'up' | 'down' | 'stable'
  ) {}

  static calculate(current: number, previous: number): Trend {
    if (previous === 0) {
      const percentageChange = current > 0 ? 100 : 0;
      const direction = current > 0 ? 'up' : 'stable';
      return new Trend(current, previous, percentageChange, direction);
    }

    const percentageChange = ((current - previous) / Math.abs(previous)) * 100;
    const direction = percentageChange > 0 ? 'up' : percentageChange < 0 ? 'down' : 'stable';

    return new Trend(current, previous, percentageChange, direction);
  }

  static zero(): Trend {
    return new Trend(0, 0, 0, 'stable');
  }

  getCurrent(): number {
    return this.current;
  }

  getPrevious(): number {
    return this.previous;
  }

  getPercentageChange(): number {
    return this.percentageChange;
  }

  getDirection(): 'up' | 'down' | 'stable' {
    return this.direction;
  }

  format(): string {
    const sign = this.percentageChange >= 0 ? '+' : '';
    return `${sign}${this.percentageChange.toFixed(1)}%`;
  }

  getColor(type: 'income' | 'expenses' | 'investments'): string {
    if (type === 'expenses') {
      // For expenses, down is good (green), up is bad (red)
      return this.direction === 'down' ? 'var(--success)' :
             this.direction === 'up' ? 'var(--accent)' : 'var(--text-secondary)';
    }
    // For income and investments, up is good (green), down is bad (red)
    return this.direction === 'up' ? 'var(--success)' :
           this.direction === 'down' ? 'var(--accent)' : 'var(--text-secondary)';
  }

  toJSON() {
    return {
      current: this.current,
      previous: this.previous,
      percentageChange: this.percentageChange,
      direction: this.direction
    };
  }
}