import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles_Key } from 'src/common/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      Roles_Key,
      [
        context.getHandler(),
        context.getClass(), // ✅ FIXED
      ],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    console.log('Required Roles:', requiredRoles);
    console.log('User:', user);

    if (!user?.role) {
      return false;
    }

    // ✅ FIX: role is string
    return requiredRoles.includes(user.role);
  }
}