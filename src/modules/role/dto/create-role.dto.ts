export class CreateRoleDto {
  id!: string;
  email!: string;

  role?: {
    id: string;
    name: string;
  };
}
