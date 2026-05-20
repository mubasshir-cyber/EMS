import { AuthService } from '../auth.service';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { ConfigType } from '@nestjs/config';
import { Inject, Injectable } from '@nestjs/common';
import jwtConfig from 'src/config/jwt.config';
import { AuthJwtPayload } from '../types/auth-jwtPayload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(jwtConfig.KEY)
    private jwtConfiguration: ConfigType<typeof jwtConfig>,
    private authService: AuthService,
    // @InjectRepository(User)
    // private readonly userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtConfiguration.secret as string,
      ignoreExpiration: false,
    });
  }

  async validate(payload: AuthJwtPayload) {
    const userId = payload.sub;
    return this.authService.validateJWTUser(userId);
  }
  // async validate(payload: any) {
  //   return await this.userRepo.findOne({
  //     where: { id: payload.sub },
  //     relations: ['role'],
  //   });
  // }
}

// async validate(payload: any) {
//   return payload; // becomes req.user
