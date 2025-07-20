import { BindingConfig } from '../models/binding-config.model';

export interface BindingResult {
  value: any;
  success: boolean;
  error?: string;
}

export class BindingUtils {
  /**
   * Applies a binding configuration to transform data from source to target
   */
  static applyBinding(
    sourceData: any,
    binding: BindingConfig,
    fallbackValue?: any
  ): BindingResult {
    try {
      // Extract the source field value
      const sourceValue = this.extractNestedValue(sourceData, binding.sourceField);
      
      if (sourceValue === undefined) {
        return {
          value: binding.defaultFallback || fallbackValue,
          success: false,
          error: `Source field '${binding.sourceField}' not found`
        };
      }

      // Apply transformation if specified
      let transformedValue = sourceValue;
      if (binding.transform) {
        transformedValue = this.applyTransform(sourceValue, binding.transform);
      }

      return {
        value: transformedValue,
        success: true
      };
    } catch (error) {
      return {
        value: binding.defaultFallback || fallbackValue,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown binding error'
      };
    }
  }

  /**
   * Extracts a nested value from an object using dot notation
   * e.g., "user.profile.name" -> data.user.profile.name
   */
  private static extractNestedValue(data: any, path: string): any {
    return path.split('.').reduce((obj, key) => {
      return obj && obj[key] !== undefined ? obj[key] : undefined;
    }, data);
  }

  /**
   * Applies a transformation to a value based on the transform configuration
   */
  private static applyTransform(value: any, transform: Record<string, any>): any {
    const { type, ...config } = transform;

    switch (type) {
      case 'format':
        return this.formatValue(value, config);
      case 'map':
        return this.mapValue(value, config);
      case 'filter':
        return this.filterValue(value, config);
      case 'aggregate':
        return this.aggregateValue(value, config);
      default:
        return value;
    }
  }

  private static formatValue(value: any, config: Record<string, any>): any {
    const { format, locale, options } = config;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat(locale || 'en-US', {
          style: 'currency',
          currency: options?.currency || 'USD',
          ...options
        }).format(value);
      case 'date':
        return new Intl.DateTimeFormat(locale || 'en-US', options).format(new Date(value));
      case 'number':
        return new Intl.NumberFormat(locale || 'en-US', options).format(value);
      case 'uppercase':
        return String(value).toUpperCase();
      case 'lowercase':
        return String(value).toLowerCase();
      case 'capitalize':
        return String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase();
      default:
        return value;
    }
  }

  private static mapValue(value: any, config: Record<string, any>): any {
    const { mapping } = config;
    return mapping[value] !== undefined ? mapping[value] : value;
  }

  private static filterValue(value: any, config: Record<string, any>): any {
    const { condition, operator = 'eq' } = config;
    
    if (Array.isArray(value)) {
      return value.filter(item => {
        switch (operator) {
          case 'eq':
            return item === condition;
          case 'ne':
            return item !== condition;
          case 'gt':
            return item > condition;
          case 'lt':
            return item < condition;
          case 'contains':
            return String(item).includes(condition);
          default:
            return true;
        }
      });
    }
    
    return value;
  }

  private static aggregateValue(value: any, config: Record<string, any>): any {
    const { operation } = config;
    
    if (!Array.isArray(value)) {
      return value;
    }

    switch (operation) {
      case 'sum':
        return value.reduce((sum, item) => sum + (Number(item) || 0), 0);
      case 'average':
        return value.reduce((sum, item) => sum + (Number(item) || 0), 0) / value.length;
      case 'count':
        return value.length;
      case 'min':
        return Math.min(...value.map(item => Number(item) || 0));
      case 'max':
        return Math.max(...value.map(item => Number(item) || 0));
      default:
        return value;
    }
  }

  /**
   * Validates a binding configuration
   */
  static validateBinding(binding: BindingConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!binding.sourceField) {
      errors.push('Source field is required');
    }

    if (!binding.targetProp) {
      errors.push('Target property is required');
    }

    if (binding.transform && typeof binding.transform !== 'object') {
      errors.push('Transform must be an object');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
} 