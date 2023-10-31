import { SetMetadata } from '@nestjs/common';

export const UntrackUserActivity = () =>
  SetMetadata('untrackUserActivity', true);
