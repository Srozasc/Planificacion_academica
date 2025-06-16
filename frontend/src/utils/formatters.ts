// Utility functions
export const formatters = {
  date: (date: string) => {
    // Date formatting logic
    return new Date(date).toLocaleDateString();
  },
  currency: (amount: number) => {
    // Currency formatting logic
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  }
};
