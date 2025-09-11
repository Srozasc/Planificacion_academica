/**
 * Extrae códigos de asignatura desde títulos de eventos
 * Los códigos pueden estar en diferentes formatos como:
 * - MAT1240 - MATEMÁTICAS PARA LA PROGRAMACIÓN - 005
 * - FCE1200 - FUNDAMENTOS DE ANTROPOLOGÍA - 001
 * - MKA2204 - STORYTELLING & CIM - 001
 */
export function extractSubjectCodes(eventTitles: string[]): string[] {
  const codes = new Set<string>();
  
  eventTitles.forEach(title => {
    if (!title) return;
    
    // Patrón para códigos de asignatura: 
    // - 3 letras seguidas de 4 números (MAT1240, FCE1200, MKA2204)
    // - 4 letras seguidas de 3 números (ADOL001)
    const codePattern = /\b([A-Z]{3}\d{4}|[A-Z]{4}\d{3})\b/g;
    const matches = title.match(codePattern);
    
    if (matches) {
      matches.forEach(code => codes.add(code));
    }
  });
  
  return Array.from(codes);
}

/**
 * Extrae códigos de asignatura desde un solo título de evento
 */
export function extractSubjectCodeFromTitle(title: string): string | null {
  if (!title) return null;
  
  const codePattern = /\b([A-Z]{3}\d{4}|[A-Z]{4}\d{3})\b/;
  const match = title.match(codePattern);
  
  return match ? match[0] : null;
}

/**
 * Valida si un string es un código de asignatura válido
 */
export function isValidSubjectCode(code: string): boolean {
  if (!code) return false;
  
  const codePattern = /^([A-Z]{3}\d{4}|[A-Z]{4}\d{3})$/;
  return codePattern.test(code);
}