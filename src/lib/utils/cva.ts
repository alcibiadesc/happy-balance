// Implementación temporal simple de class-variance-authority
export type VariantProps<T> = T extends (...args: any[]) => any
  ? Parameters<T>[0] extends Record<string, any>
    ? Partial<Parameters<T>[0]>
    : Record<string, any>
  : Record<string, any>;

type CVAConfig = {
  variants?: Record<string, Record<string, string>>;
  defaultVariants?: Record<string, string>;
};

export function cva(base: string, config?: CVAConfig) {
  return (props?: Record<string, any>) => {
    let result = base;
    
    if (!config?.variants || !props) {
      return result;
    }
    
    // Apply variant classes
    for (const [variantKey, variantValue] of Object.entries(props)) {
      if (variantValue && config.variants[variantKey]) {
        const variantClass = config.variants[variantKey][variantValue];
        if (variantClass) {
          result += ' ' + variantClass;
        }
      }
    }
    
    // Apply default variants for missing props
    if (config.defaultVariants) {
      for (const [defaultKey, defaultValue] of Object.entries(config.defaultVariants)) {
        if (!(defaultKey in (props || {})) && config.variants[defaultKey]) {
          const defaultClass = config.variants[defaultKey][defaultValue];
          if (defaultClass) {
            result += ' ' + defaultClass;
          }
        }
      }
    }
    
    return result;
  };
}