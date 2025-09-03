// Implementación temporal simple para clsx y tailwind-merge
type ClassValue = string | number | null | boolean | undefined | ClassValue[] | Record<string, any>;

function clsx(...inputs: ClassValue[]): string {
  const classes: string[] = [];
  
  for (const input of inputs) {
    if (!input) continue;
    
    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'number') {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const result = clsx(...input);
      if (result) classes.push(result);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }
  
  return classes.join(' ');
}

function twMerge(input: string): string {
  // Implementación simple que solo elimina duplicados
  const classes = input.split(' ').filter(Boolean);
  return [...new Set(classes)].join(' ');
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}