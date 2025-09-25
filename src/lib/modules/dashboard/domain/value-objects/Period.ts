// Value Object: Period
export type PeriodType = 'week' | 'month' | 'quarter' | 'year' | 'custom';

export class Period {
  private constructor(
    private readonly type: PeriodType,
    private readonly startDate: Date,
    private readonly endDate: Date,
    private readonly offset: number = 0,
    private readonly label: string
  ) {
    Object.freeze(this);
  }

  static create(
    type: PeriodType,
    offset: number = 0,
    customStart?: string,
    customEnd?: string
  ): Period {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let label: string;

    if (type === 'custom' && customStart && customEnd) {
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      label = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    } else {
      const dates = Period.calculateDates(type, offset, now);
      startDate = dates.start;
      endDate = dates.end;
      label = Period.generateLabel(type, offset, startDate);
    }

    return new Period(type, startDate, endDate, offset, label);
  }

  private static calculateDates(
    type: PeriodType,
    offset: number,
    now: Date
  ): { start: Date; end: Date } {
    const start = new Date(now);
    const end = new Date(now);

    switch (type) {
      case 'week':
        start.setDate(now.getDate() - now.getDay() - offset * 7);
        end.setDate(start.getDate() + 6);
        break;

      case 'month':
        start.setMonth(now.getMonth() + offset, 1);
        end.setMonth(start.getMonth() + 1, 0);
        break;

      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const targetQuarter = currentQuarter + offset;
        const targetYear = now.getFullYear() + Math.floor(targetQuarter / 4);
        const normalizedQuarter = ((targetQuarter % 4) + 4) % 4;
        start.setFullYear(targetYear);
        start.setMonth(normalizedQuarter * 3, 1);
        end.setFullYear(targetYear);
        end.setMonth(normalizedQuarter * 3 + 3, 0);
        break;

      case 'year':
        start.setFullYear(now.getFullYear() + offset, 0, 1);
        end.setFullYear(start.getFullYear(), 11, 31);
        break;

      default:
        throw new Error(`Unknown period type: ${type}`);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  private static generateLabel(
    type: PeriodType,
    offset: number,
    startDate: Date
  ): string {
    if (offset === 0) {
      const labels: Record<PeriodType, string> = {
        week: 'Esta semana',
        month: 'Este mes',
        quarter: 'Este trimestre',
        year: 'Este año',
        custom: 'Personalizado'
      };
      return labels[type];
    }

    switch (type) {
      case 'week':
        const weekNum = Math.ceil((startDate.getDate() - startDate.getDay() + 1) / 7);
        return `Semana ${weekNum} ${startDate.getFullYear()}`;
      case 'month': {
        const monthName = startDate.toLocaleDateString('es-ES', {
          month: 'long',
          year: 'numeric'
        });
        // Capitalize first letter
        return monthName.charAt(0).toUpperCase() + monthName.slice(1);
      }
      case 'quarter': {
        const quarter = Math.floor(startDate.getMonth() / 3) + 1;
        return `Q${quarter} ${startDate.getFullYear()}`;
      }
      case 'year':
        return startDate.getFullYear().toString();
      default:
        return '';
    }
  }

  getType(): PeriodType {
    return this.type;
  }

  getStartDate(): Date {
    return new Date(this.startDate);
  }

  getEndDate(): Date {
    return new Date(this.endDate);
  }

  getOffset(): number {
    return this.offset;
  }

  getLabel(): string {
    return this.label;
  }

  toApiParams(): { startDate: string; endDate: string } {
    return {
      startDate: this.startDate.toISOString().split('T')[0],
      endDate: this.endDate.toISOString().split('T')[0]
    };
  }

  equals(other: Period): boolean {
    return (
      this.type === other.type &&
      this.startDate.getTime() === other.startDate.getTime() &&
      this.endDate.getTime() === other.endDate.getTime()
    );
  }
}