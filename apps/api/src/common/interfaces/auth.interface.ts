import { UserRoles } from 'src/generated/prisma/enums';
import { JwtTokenType } from '../enums/jwt.enum';
import { Request } from 'express';

export class TokenPayload {
  sub!: string;
  email!: string;
  username!: string;
  role!: UserRoles;
  is_verified!: boolean;
  type!: JwtTokenType;
  jti!: string;
}

export interface AuthenticatedRequest extends Request {
  user: TokenPayload;
}
