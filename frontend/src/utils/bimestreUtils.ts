/**
 * Utilidades para manejo de bimestre
 */

/**
 * Obtiene el ID del bimestre seleccionado desde el navbar
 * @returns El ID del bimestre o null si no está disponible
 */
export function getBimestreIdFromNavbar(): number | null {
  const navbarBimestreElement = document.querySelector('[data-bimestre-id]');
  if (navbarBimestreElement) {
    const bimestreId = navbarBimestreElement.getAttribute('data-bimestre-id');
    if (bimestreId) {
      return parseInt(bimestreId, 10);
    }
  }
  return null;
}

/**
 * Obtiene el nombre del bimestre seleccionado desde el navbar
 * @returns El nombre del bimestre o null si no está disponible
 */
export function getBimestreNameFromNavbar(): string | null {
  const navbarBimestreElement = document.querySelector('[data-bimestre-nombre]');
  if (navbarBimestreElement) {
    return navbarBimestreElement.getAttribute('data-bimestre-nombre');
  }
  return null;
}