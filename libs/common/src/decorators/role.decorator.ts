import { SetMetadata } from '@nestjs/common';
import { ROLE_KEY, UserRole } from '../constants';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLE_KEY, roles);
