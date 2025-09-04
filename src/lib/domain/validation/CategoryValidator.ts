import { ValidationError, ValidationResult } from './ValidationError.js';
import { CategoryType } from '../entities/Category.js';

export class CategoryValidator {
  static validateName(name: string): ValidationResult {
    const errors: ValidationError[] = [];
    
    if (!name || name.trim().length === 0) {
      errors.push(new ValidationError(
        'El nombre de la categoría es obligatorio',
        'name',
        'REQUIRED'
      ));
    } else if (name.trim().length < 2) {
      errors.push(new ValidationError(
        'El nombre de la categoría debe tener al menos 2 caracteres',
        'name',
        'TOO_SHORT'
      ));
    } else if (name.trim().length > 100) {
      errors.push(new ValidationError(
        'El nombre de la categoría no puede exceder 100 caracteres',
        'name',
        'TOO_LONG'
      ));
    }
    
    return errors.length > 0 
      ? ValidationResult.invalid(errors) 
      : ValidationResult.valid();
  }

  static validateType(type: string): ValidationResult {
    const errors: ValidationError[] = [];
    
    if (!type) {
      errors.push(new ValidationError(
        'El tipo de categoría es obligatorio',
        'type',
        'REQUIRED'
      ));
    } else if (!Object.values(CategoryType).includes(type as CategoryType)) {
      errors.push(new ValidationError(
        'Tipo de categoría inválido',
        'type',
        'INVALID_TYPE'
      ));
    }
    
    return errors.length > 0 
      ? ValidationResult.invalid(errors) 
      : ValidationResult.valid();
  }

  static validateColor(color: string): ValidationResult {
    const errors: ValidationError[] = [];
    
    if (!color) {
      errors.push(new ValidationError(
        'El color es obligatorio',
        'color',
        'REQUIRED'
      ));
    } else if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      errors.push(new ValidationError(
        'El color debe ser un código hexadecimal válido',
        'color',
        'INVALID_FORMAT'
      ));
    }
    
    return errors.length > 0 
      ? ValidationResult.invalid(errors) 
      : ValidationResult.valid();
  }

  static validateIcon(icon: string): ValidationResult {
    const errors: ValidationError[] = [];
    
    if (!icon) {
      errors.push(new ValidationError(
        'El icono es obligatorio',
        'icon',
        'REQUIRED'
      ));
    } else if (icon.trim().length === 0) {
      errors.push(new ValidationError(
        'El icono no puede estar vacío',
        'icon',
        'EMPTY'
      ));
    }
    
    return errors.length > 0 
      ? ValidationResult.invalid(errors) 
      : ValidationResult.valid();
  }

  static validateCategoryData(data: {
    name: string;
    type: string;
    color: string;
    icon: string;
  }): ValidationResult {
    const nameValidation = this.validateName(data.name);
    const typeValidation = this.validateType(data.type);
    const colorValidation = this.validateColor(data.color);
    const iconValidation = this.validateIcon(data.icon);
    
    return nameValidation
      .combine(typeValidation)
      .combine(colorValidation)
      .combine(iconValidation);
  }
}