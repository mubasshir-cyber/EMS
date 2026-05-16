import { registerAs } from '@nestjs/config';
import { JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';

export default registerAs(
  'refresh-jwt',
  (): JwtSignOptions => ({
    secret: process.env.REFRESH_JWT_SECRET,
    // secret: "mySecretKey123",

    
      expiresIn: '7d',
    //   expiresIn: process.env.JWT_EXPIRE_IN,
    
  }),
);
