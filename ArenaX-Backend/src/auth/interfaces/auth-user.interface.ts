import { Role } from '../../users/enums/role.enum';

export interface JwtPayload {
  sub: number;
  role: Role;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}