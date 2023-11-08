import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'aws-sdk/clients/workmail';
import { ROLE_KEY } from '../constants';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLE_KEY, roles);
