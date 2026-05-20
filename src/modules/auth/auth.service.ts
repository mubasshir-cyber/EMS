import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { UserService } from '../user/user.service';
import { compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthJwtPayload } from './types/auth-jwtPayload';
import { CurrentUser } from './types/current.user';
import refresh_jwtConfig from '../../config/refresh_jwt.config';
import type { ConfigType } from '@nestjs/config';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private userservice: UserService,
    private jwtService: JwtService,
    @Inject(refresh_jwtConfig.KEY)
    private refreshtokenConfig: ConfigType<typeof refresh_jwtConfig>,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userservice.findByEmail(email);
    if (!user)
      throw new UnauthorizedException(
        "We don't know who you are!!...., So First Register yourSelf Please!",
      );

    const isPasswordMatch = await compare(password, user.password);
    if (!isPasswordMatch)
      throw new UnauthorizedException(
        'Bro Your Password Is Wrong.... Please check the password Please',
      );

    const name = `${user.first_name} ${user.last_name}`;

    return {
      id: user.id,
      Username: name,
      // Username: user.first_name,
      // Userlastname: user.last_name,
      role: user.role.name,
    };
  }

  async login(user: { id: string; role: string; Username?: string }) {
    // const payload: AuthJwtPayload = {
    //   sub: user.id,
    //   role: user.role,
    // };
    // const token = this.jwtService.sign(payload);
    // const refreshToken = this.jwtService.sign(payload, this.refreshtokenConfig);

    await this.userservice.updateLastLogin(user.id);
    const { accesstoken, refreshToken } = await this.generateToken(user);
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.userservice.updateHashedreFreshToken(
      user.id,
      hashedRefreshToken,
    );
    return {
      access_token: accesstoken,
      
      user: {
        id: user.id,
        username: user.Username,
        role: user.role,
      },
      Refresh_Token: refreshToken,
    };
  }

  async validateJWTUser(userId: string) {
    const user = await this.userservice.findOne(userId);
    if (!user) throw new UnauthorizedException('User Not Found ....');

    const currentUser: CurrentUser = { id: user.id, role: user.role.name };
    return currentUser;
  }

  async refreshToken(userId: { id: string; role: string }) {
    const { accesstoken, refreshToken } = await this.generateToken(userId);
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.userservice.updateHashedreFreshToken(
      userId.id,
      hashedRefreshToken,
    );
    return {
      access_token: accesstoken,
      Refresh_Token: refreshToken,

      user: {
        id: userId.id,

        role: userId.role,
      },
    };
  }

  async generateToken(userId: { id: string; role: string }) {
    const payload: AuthJwtPayload = {
      sub: userId.id,
      role: userId.role,
    };

    const [accesstoken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, this.refreshtokenConfig),
    ]);

    return {
      accesstoken,
      refreshToken,
    };
  }

  async validateRefreshToken(userId: string, refreshToken: string) {
    const user = await this.userservice.findOne(userId);
    if (!user || !user.hashedRefreshToken)
      throw new UnauthorizedException('yeh Refresh Token Galat Hai Mera Bhai , yeh fir logout hogya hai tu');

    const MatchRefreshToken = await argon2.verify(
      user.hashedRefreshToken,
      refreshToken,
    );
    if (!MatchRefreshToken)
      throw new UnauthorizedException(
        'MERE BHAI REFRESH TOKEN SAME NHI HAI MERA BHAI ....!!!!',
      );

    return {
      id: user.id,
      role: user.role.name,
    };
  }

  async logOut(userId: string) {
    await this.userservice.updateHashedreFreshToken(userId, null);

    return {
      message: 'Logged out successfully Refresh token null',
    };
  }
}
