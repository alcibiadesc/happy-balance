export class TransactionDate {
  private constructor(private readonly date: Date) {}

  static create(dateString: string): TransactionDate {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date string');
    }
    return new TransactionDate(date);
  }

  static fromDate(date: Date): TransactionDate {
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return new TransactionDate(new Date(date));
  }

  static today(): TransactionDate {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new TransactionDate(today);
  }

  static yesterday(): TransactionDate {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    return new TransactionDate(yesterday);
  }

  getDate(): Date {
    return new Date(this.date);
  }

  getYear(): number {
    return this.date.getFullYear();
  }

  getMonth(): number {
    return this.date.getMonth() + 1; // 1-indexed
  }

  getDay(): number {
    return this.date.getDate();
  }

  getDayOfWeek(): number {
    return this.date.getDay();
  }

  getMonthYear(): string {
    return `${this.getYear()}-${String(this.getMonth()).padStart(2, '0')}`;
  }

  formatLong(): string {
    const formatter = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return formatter.format(this.date);
  }

  formatShort(): string {
    const formatter = new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    return formatter.format(this.date);
  }

  formatMonthYear(): string {
    const formatter = new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long'
    });
    return formatter.format(this.date);
  }

  isSameDay(other: TransactionDate): boolean {
    return (
      this.date.getFullYear() === other.date.getFullYear() &&
      this.date.getMonth() === other.date.getMonth() &&
      this.date.getDate() === other.date.getDate()
    );
  }

  isSameMonth(other: TransactionDate): boolean {
    return (
      this.date.getFullYear() === other.date.getFullYear() &&
      this.date.getMonth() === other.date.getMonth()
    );
  }

  isSameYear(other: TransactionDate): boolean {
    return this.date.getFullYear() === other.date.getFullYear();
  }

  isBefore(other: TransactionDate): boolean {
    return this.date < other.date;
  }

  isAfter(other: TransactionDate): boolean {
    return this.date > other.date;
  }

  isToday(): boolean {
    const today = new Date();
    return this.isSameDay(TransactionDate.fromDate(today));
  }

  isYesterday(): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.isSameDay(TransactionDate.fromDate(yesterday));
  }

  isInCurrentMonth(): boolean {
    const today = new Date();
    return this.isSameMonth(TransactionDate.fromDate(today));
  }

  addDays(days: number): TransactionDate {
    const newDate = new Date(this.date);
    newDate.setDate(newDate.getDate() + days);
    return new TransactionDate(newDate);
  }

  addMonths(months: number): TransactionDate {
    const newDate = new Date(this.date);
    newDate.setMonth(newDate.getMonth() + months);
    return new TransactionDate(newDate);
  }

  startOfMonth(): TransactionDate {
    const newDate = new Date(this.date.getFullYear(), this.date.getMonth(), 1);
    return new TransactionDate(newDate);
  }

  endOfMonth(): TransactionDate {
    const newDate = new Date(this.date.getFullYear(), this.date.getMonth() + 1, 0);
    return new TransactionDate(newDate);
  }

  equals(other: TransactionDate): boolean {
    return this.date.getTime() === other.date.getTime();
  }

  toString(): string {
    // Return ISO date string (YYYY-MM-DD)
    return this.date.toISOString().split('T')[0];
  }

  toISOString(): string {
    return this.date.toISOString();
  }
}