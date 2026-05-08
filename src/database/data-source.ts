import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

console.log(process.env.DB_PASSWORD);
console.log(process.env.DB_HOST);
console.log(process.env.DB_USERNAME);
console.log(process.env.DB_NAME);
console.log(process.env.DB_PORT);

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  logging: true,
  synchronize: false,
});
console.log('DB HOST:', process.env.DB_HOST);
console.log(process.env.DB_PASSWORD);

console.log(process.env.DB_PASSWORD);
console.log(process.env.DB_HOST);
console.log(process.env.DB_USERNAME);
console.log(process.env.DB_NAME);
console.log(process.env.DB_PORT);
