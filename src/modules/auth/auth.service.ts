import { Injectable, UnauthorizedException } from '@nestjs/common';

import { UserService } from '../user/user.service';
import { compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthJwtPayload } from './types/auth-jwtPayload';
import { CurrentUser } from './types/current.user';

@Injectable()
export class AuthService {
  constructor(
    private userservice: UserService,
    private jwtService: JwtService,
 
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
    const payload: AuthJwtPayload = {
      sub: user.id,
      role: user.role,
    };

    await this.userservice.updateLastLogin(user.id);

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.Username,
        role: user.role,
      },
    };
  }

  async validateJWTUser(userId: string) {
    const user = await this.userservice.findOne(userId);
    if (!user) throw new UnauthorizedException('User Not Found ....');

    const currentUser: CurrentUser = { id: user.id, role: user.role.name };
    return currentUser;
  }
}
