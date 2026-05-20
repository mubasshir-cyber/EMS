import {
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from '../../common/guards/local-auth/local-auth.guard';
import { UserService } from '../user/user.service';
import { RefreshAuthGuard } from '../../common/guards/refresh-auth/refresh-auth.guard';
import { Public } from '../../common/decorators/pubilic.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  // @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req) {
    return this.userService.findOne(req.user.id)
  }

  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  refreshToken(@Req() req) {
    return this.authService.refreshToken(req.user.id);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('logout')
  logOut(@Req() req) {
    this.authService.logOut(req.user.id)
    return { message: 'User Refresh Token Delete' };
  }
}
