import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_Public_Key } from '../decorators/pubilic.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(
        private reflector: Reflector
    ){
        super();
    }

    canActivate(context: ExecutionContext) {
        const IsPublic = this.reflector.getAllAndOverride<boolean>(IS_Public_Key,[
            context.getHandler(),
            context.getClass(),
        ]);

        if(IsPublic) return true;

        return super.canActivate(context)
    }
}
