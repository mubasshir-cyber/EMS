import { SetMetadata } from '@nestjs/common';

export const IS_Public_Key = 'Is_PUBLIC';
export const Public = () => SetMetadata(IS_Public_Key, true);
