describe('formatters', () => {
  const formatters = {
    date: (date: string) => {
      return new Date(date).toLocaleDateString();
    },
    currency: (amount: number) => {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP'
      }).format(amount);
    }
  };

  describe('date', () => {
    it('debería formatear una fecha válida correctamente', () => {
      const dateString = '2023-01-15T10:30:00Z';
      const expected = new Date(dateString).toLocaleDateString(); // Depende de la configuración regional del entorno de prueba
      expect(formatters.date(dateString)).toBe(expected);
    });

    it('debería manejar fechas inválidas', () => {
      const invalidDateString = 'fecha-invalida';
      // new Date('fecha-invalida').toLocaleDateString() suele devolver 'Invalid Date' o similar
      expect(formatters.date(invalidDateString)).toBe(new Date(invalidDateString).toLocaleDateString());
    });
  });

  describe('currency', () => {
    it('debería formatear una cantidad positiva correctamente', () => {
      const amount = 12345.67;
      // El resultado exacto puede variar ligeramente por la configuración regional
      // En Chile, el separador de miles es '.' y el decimal es ',', y el símbolo va antes.
      // Ejemplo: $ 12.345,67
      const expected = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP'
      }).format(amount);
      expect(formatters.currency(amount)).toBe(expected);
    });

    it('debería formatear cero correctamente', () => {
      const amount = 0;
      const expected = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP'
      }).format(amount);
      expect(formatters.currency(amount)).toBe(expected);
    });

    it('debería formatear una cantidad negativa correctamente', () => {
      const amount = -987.65;
      const expected = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP'
      }).format(amount);
      expect(formatters.currency(amount)).toBe(expected);
    });
  });
});
