import { SetMetadata } from '@nestjs/common';

/**
 * Roles decorator key
 */
export const ROLES_KEY = 'roles';

/**
 * Roles decorator
 * Moved to CommonModule to avoid cross-module dependencies
 * 
 * @param roles Array of role names that can access the resource
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
