// roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const Roles_Key = 'roles';

// export const Roles = (...roles: RoleEnum[]) => SetMetadata(Roles_Key, roles);
export const Roles = (...roles: string[]) => SetMetadata(Roles_Key, roles);
