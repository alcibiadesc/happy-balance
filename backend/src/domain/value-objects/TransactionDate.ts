import { Result } from "../shared/Result";

/**
 * Transaction Date value object
 * Encapsulates date business rules and validation for transactions
 */
export class TransactionDate {
  private constructor(private readonly _date: Date) {}

  static create(date: Date | string): Result<TransactionDate> {
    let parsedDate: Date;

    if (typeof date === "string") {
      parsedDate = new Date(date);
    } else {
      parsedDate = new Date(date.getTime());
    }

    if (isNaN(parsedDate.getTime())) {
      return Result.failWithMessage("Invalid date provided");
    }

    // Business rule: transactions cannot be in the future
    const now = new Date();
    if (parsedDate > now) {
      return Result.failWithMessage("Transaction date cannot be in the future");
    }

    // Business rule: transactions cannot be older than 10 years
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    if (parsedDate < tenYearsAgo) {
      return Result.failWithMessage(
        "Transaction date cannot be older than 10 years",
      );
    }

    return Result.ok(new TransactionDate(parsedDate));
  }

  static today(): TransactionDate {
    const result = TransactionDate.create(new Date());
    if (result.isFailure()) {
      throw new Error("Failed to create today's date");
    }
    return result.getValue();
  }

  static fromString(dateString: string): Result<TransactionDate> {
    // Support multiple date formats
    const formats = [
      /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
    ];

    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        let year: number, month: number, day: number;

        if (format === formats[0]) {
          // YYYY-MM-DD
          [, year, month, day] = match.map(Number);
        } else {
          // DD/MM/YYYY or DD-MM-YYYY
          [, day, month, year] = match.map(Number);
        }

        const date = new Date(year, month - 1, day);
        return TransactionDate.create(date);
      }
    }

    return TransactionDate.create(dateString);
  }

  get value(): Date {
    return new Date(this._date.getTime());
  }

  getYear(): number {
    return this._date.getFullYear();
  }

  getMonth(): number {
    return this._date.getMonth() + 1; // 1-based month
  }

  getDay(): number {
    return this._date.getDate();
  }

  isSameDay(other: TransactionDate): boolean {
    return this.toDateString() === other.toDateString();
  }

  isSameMonth(other: TransactionDate): boolean {
    return (
      this.getYear() === other.getYear() && this.getMonth() === other.getMonth()
    );
  }

  isBefore(other: TransactionDate): boolean {
    return this._date < other._date;
  }

  isAfter(other: TransactionDate): boolean {
    return this._date > other._date;
  }

  addDays(days: number): Result<TransactionDate> {
    const newDate = new Date(this._date.getTime());
    newDate.setDate(newDate.getDate() + days);
    return TransactionDate.create(newDate);
  }

  toDateString(): string {
    // Use local date formatting to avoid timezone issues
    const year = this._date.getFullYear();
    const month = String(this._date.getMonth() + 1).padStart(2, "0");
    const day = String(this._date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  toDisplayString(locale = "en-US"): string {
    return this._date.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  equals(other: TransactionDate): boolean {
    return this._date.getTime() === other._date.getTime();
  }

  toString(): string {
    return this.toDateString();
  }
}
