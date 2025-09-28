export class MetricsType {
  constructor(public readonly value: 'current' | 'historical' | 'trend' | 'comparison') {}

  public static current(): MetricsType {
    return new MetricsType('current');
  }

  public static historical(): MetricsType {
    return new MetricsType('historical');
  }

  public static trend(): MetricsType {
    return new MetricsType('trend');
  }

  public static comparison(): MetricsType {
    return new MetricsType('comparison');
  }

  public isCurrent(): boolean {
    return this.value === 'current';
  }

  public isHistorical(): boolean {
    return this.value === 'historical';
  }

  public isTrend(): boolean {
    return this.value === 'trend';
  }

  public isComparison(): boolean {
    return this.value === 'comparison';
  }

  public equals(other: MetricsType): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}