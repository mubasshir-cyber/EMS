import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { ConfigType } from '@nestjs/config';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthJwtPayload } from '../types/auth-jwtPayload';
import refresh_jwtConfig from 'src/config/refresh_jwt.config';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'refresh-jwt',
) {
  constructor(
    @Inject(refresh_jwtConfig.KEY)
    private refreshjwtConfiguration: ConfigType<typeof refresh_jwtConfig>,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: refreshjwtConfiguration.secret as string,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  //   validate(payload: AuthJwtPayload) {
  //     const userId = payload.sub;
  //     return this.authService.validateJWTUser(userId);
  //   }
  async validate(req: Request, payload: AuthJwtPayload) {
    const authHeader = req.get('authorization');
    if (!authHeader) {
      throw new UnauthorizedException('Refresh token missing yeh refresh.strategy.js ma hai yeh error');
    }
    const refreshToken = authHeader.replace('Bearer', '').trim();
    const userId = payload.sub;

    return await this.authService.validateRefreshToken(userId, refreshToken);
  }
}
