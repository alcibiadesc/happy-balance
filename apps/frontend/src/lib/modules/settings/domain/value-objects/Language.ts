export interface LanguageData {
  code: string;
  name: string;
  flag: string;
}

export class Language {
  private constructor(
    private readonly code: string,
    private readonly name: string,
    private readonly flag: string
  ) {}

  static create(data: LanguageData): Language {
    return new Language(data.code, data.name, data.flag);
  }

  static english(): Language {
    return new Language('en', 'English', '🇺🇸');
  }

  static spanish(): Language {
    return new Language('es', 'Español', '🇪🇸');
  }

  static fromCode(code: string): Language {
    switch (code) {
      case 'es':
        return Language.spanish();
      case 'en':
      default:
        return Language.english();
    }
  }

  static getAvailable(): Language[] {
    return [Language.english(), Language.spanish()];
  }

  getCode(): string {
    return this.code;
  }

  getName(): string {
    return this.name;
  }

  getFlag(): string {
    return this.flag;
  }

  toData(): LanguageData {
    return {
      code: this.code,
      name: this.name,
      flag: this.flag
    };
  }

  equals(other: Language): boolean {
    return this.code === other.code;
  }

  toString(): string {
    return `${this.flag} ${this.name}`;
  }
}