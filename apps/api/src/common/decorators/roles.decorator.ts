import { SetMetadata } from '@nestjs/common';
import { UserRoles } from '../../generated/prisma/enums';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRoles[]) => SetMetadata(ROLES_KEY, roles);
