export class MetricsPeriod {
  constructor(
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly periodType: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom',
    public readonly offset: number = 0
  ) {
    if (startDate > endDate) {
      throw new Error('Start date cannot be after end date');
    }
  }

  public static createMonth(offset: number = 0): MetricsPeriod {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0, 23, 59, 59, 999);

    return new MetricsPeriod(startDate, endDate, 'month', offset);
  }

  public static createWeek(offset: number = 0): MetricsPeriod {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - dayOfWeek - (offset * 7));
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    return new MetricsPeriod(startDate, endDate, 'week', offset);
  }

  public static createQuarter(offset: number = 0): MetricsPeriod {
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const targetQuarter = currentQuarter - offset;
    const year = now.getFullYear() + Math.floor(targetQuarter / 4);
    const quarterInYear = ((targetQuarter % 4) + 4) % 4;

    const startDate = new Date(year, quarterInYear * 3, 1);
    const endDate = new Date(year, quarterInYear * 3 + 3, 0, 23, 59, 59, 999);

    return new MetricsPeriod(startDate, endDate, 'quarter', offset);
  }

  public static createYear(offset: number = 0): MetricsPeriod {
    const now = new Date();
    const year = now.getFullYear() - offset;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    return new MetricsPeriod(startDate, endDate, 'year', offset);
  }

  public static createCustom(startDate: Date, endDate: Date): MetricsPeriod {
    return new MetricsPeriod(startDate, endDate, 'custom', 0);
  }

  public toLabel(): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short'
    };

    switch (this.periodType) {
      case 'month':
        return this.startDate.toLocaleDateString('en-US', options);
      case 'week':
        return `Week ${this.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      case 'quarter':
        const quarter = Math.floor(this.startDate.getMonth() / 3) + 1;
        return `Q${quarter} ${this.startDate.getFullYear()}`;
      case 'year':
        return this.startDate.getFullYear().toString();
      case 'custom':
        return `${this.startDate.toLocaleDateString()} - ${this.endDate.toLocaleDateString()}`;
      default:
        return this.startDate.toLocaleDateString();
    }
  }

  public equals(other: MetricsPeriod): boolean {
    return this.startDate.getTime() === other.startDate.getTime() &&
           this.endDate.getTime() === other.endDate.getTime() &&
           this.periodType === other.periodType;
  }
}