import { Period, type PeriodType } from '../../domain/value-objects/Period';

export interface NavigationOption {
  offset: number;
  label: string;
  fullLabel: string;
}

export class PeriodNavigationService {
  generateNavigationOptions(periodType: PeriodType): NavigationOption[] {
    const options: NavigationOption[] = [];
    const counts = { week: 12, month: 12, quarter: 8, year: 5, custom: 0 };
    const count = counts[periodType];

    for (let i = 0; i < count; i++) {
      const period = Period.create(periodType, i);
      options.push({
        offset: i,
        label: i === 0 ? this.getCurrentLabel(periodType) : this.getOffsetLabel(periodType, i, period),
        fullLabel: period.getLabel()
      });
    }

    return options;
  }

  private getCurrentLabel(periodType: PeriodType): string {
    const labels: Record<PeriodType, string> = {
      week: 'Esta semana',
      month: 'Este mes',
      quarter: 'Este trimestre',
      year: 'Este año',
      custom: 'Personalizado'
    };
    return labels[periodType];
  }

  private getOffsetLabel(periodType: PeriodType, offset: number, period: Period): string {
    switch (periodType) {
      case 'week':
        return `S${offset + 1}`;
      case 'month':
        return period.getStartDate().toLocaleDateString('es-ES', {
          month: 'long',
          year: 'numeric'
        });
      case 'quarter':
        const quarter = Math.floor(period.getStartDate().getMonth() / 3) + 1;
        return `Q${quarter} ${period.getStartDate().getFullYear()}`;
      case 'year':
        return period.getStartDate().getFullYear().toString();
      default:
        return period.getLabel();
    }
  }
}