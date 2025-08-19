export class TokenPayloadDto {
  userId: number;
  email: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
}

export class LoginResponseDto {
  access_token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}
