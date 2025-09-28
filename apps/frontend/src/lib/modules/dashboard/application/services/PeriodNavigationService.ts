import { Period, type PeriodType } from '../../domain/value-objects/Period';

export interface NavigationOption {
  offset: number;
  label: string;
  fullLabel: string;
}

export class PeriodNavigationService {
  generateNavigationOptions(periodType: PeriodType): NavigationOption[] {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (periodType) {
      case 'month':
        // Generar los últimos 12 meses hasta el mes actual
        return Array.from({ length: 12 }, (_, i) => {
          const offset = -i; // Comenzar desde el mes actual (0) y retroceder
          const targetDate = new Date(currentYear, currentMonth + offset, 1);
          const period = Period.create(periodType, offset);

          return {
            offset,
            label: offset === 0
              ? 'Este mes'
              : targetDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
            fullLabel: period.getLabel()
          };
        });

      case 'quarter':
        // Generar los últimos 8 trimestres
        return Array.from({ length: 8 }, (_, i) => {
          const offset = -i;
          const period = Period.create(periodType, offset);
          const quarter = Math.floor(period.getStartDate().getMonth() / 3) + 1;

          return {
            offset,
            label: offset === 0
              ? 'Este trimestre'
              : `Q${quarter} ${period.getStartDate().getFullYear()}`,
            fullLabel: period.getLabel()
          };
        });

      case 'year':
        // Generar los últimos 5 años
        return Array.from({ length: 5 }, (_, i) => {
          const offset = -i;
          const year = currentYear + offset;

          return {
            offset,
            label: offset === 0 ? 'Este año' : year.toString(),
            fullLabel: `${year}`
          };
        });

      case 'week':
        // Generar las últimas 12 semanas
        return Array.from({ length: 12 }, (_, i) => {
          const offset = -i;
          const period = Period.create(periodType, offset);

          return {
            offset,
            label: offset === 0 ? 'Esta semana' : `Semana ${-offset}`,
            fullLabel: period.getLabel()
          };
        });

      case 'custom':
        return [{ offset: 0, label: 'Personalizado', fullLabel: 'Período personalizado' }];

      default:
        return [];
    }
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