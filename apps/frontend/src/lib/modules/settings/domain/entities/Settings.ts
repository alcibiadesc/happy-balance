import { Theme, type ThemeType } from '../value-objects/Theme';
import { Language } from '../value-objects/Language';

export interface SettingsData {
  theme: ThemeType;
  language: string;
  currency: string;
}

export class Settings {
  private constructor(
    private theme: Theme,
    private language: Language,
    private currency: string
  ) {}

  static create(data: SettingsData): Settings {
    return new Settings(
      Theme.fromString(data.theme),
      Language.fromCode(data.language),
      data.currency
    );
  }

  static default(): Settings {
    return new Settings(
      Theme.create('system'),
      Language.english(),
      'EUR'
    );
  }

  // Theme methods
  getTheme(): Theme {
    return this.theme;
  }

  setTheme(theme: Theme): Settings {
    return new Settings(theme, this.language, this.currency);
  }

  toggleTheme(): Settings {
    return new Settings(this.theme.toggle(), this.language, this.currency);
  }

  // Language methods
  getLanguage(): Language {
    return this.language;
  }

  setLanguage(language: Language): Settings {
    return new Settings(this.theme, language, this.currency);
  }

  // Currency methods
  getCurrency(): string {
    return this.currency;
  }

  setCurrency(currency: string): Settings {
    return new Settings(this.theme, this.language, currency);
  }

  // Serialization
  toData(): SettingsData {
    return {
      theme: this.theme.getValue(),
      language: this.language.getCode(),
      currency: this.currency
    };
  }

  clone(): Settings {
    return new Settings(this.theme, this.language, this.currency);
  }
}