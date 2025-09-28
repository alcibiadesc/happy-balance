export type ThemeType = 'light' | 'dark' | 'system';

export class Theme {
  private constructor(
    private readonly value: ThemeType
  ) {}

  static create(theme: ThemeType): Theme {
    return new Theme(theme);
  }

  static fromString(value: string): Theme {
    if (!['light', 'dark', 'system'].includes(value)) {
      return new Theme('system');
    }
    return new Theme(value as ThemeType);
  }

  getValue(): ThemeType {
    return this.value;
  }

  isDark(): boolean {
    return this.value === 'dark';
  }

  isLight(): boolean {
    return this.value === 'light';
  }

  isSystem(): boolean {
    return this.value === 'system';
  }

  toggle(): Theme {
    if (this.value === 'light') return Theme.create('dark');
    if (this.value === 'dark') return Theme.create('light');
    return this;
  }

  equals(other: Theme): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}