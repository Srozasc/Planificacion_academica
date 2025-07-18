
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from 'src/auth/strategies/jwt.strategy';
import { AuthService } from 'src/auth/auth.service';
import { TokenPayloadDto } from 'src/auth/dto/token-payload.dto';

// Mock del AuthService
const mockAuthService = {
  validateUser: jest.fn(),
};

// Mock del ConfigService
const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'JWT_SECRET') {
      return 'test_secret'; // Proporcionar un secreto de prueba
    }
    return null;
  }),
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(strategy).toBeDefined();
  });

  // Pruebas para el método validate()
  describe('validate', () => {
    const tokenPayload: TokenPayloadDto = {
      userId: 1,
      email: 'test@example.com',
      name: 'Test User',
      role: 'Admin',
      permissions: [],
    };

    it('debería retornar el objeto de usuario si la validación en AuthService es exitosa', async () => {
      const user = { userId: 1, email: 'test@example.com', name: 'Test User', role: 'Admin' };
      mockAuthService.validateUser.mockResolvedValue(user);

      const result = await strategy.validate(tokenPayload);

      expect(authService.validateUser).toHaveBeenCalledWith(tokenPayload);
      expect(result).toEqual(user);
    });

    it('debería retornar null si la validación en AuthService falla', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      const result = await strategy.validate(tokenPayload);

      expect(authService.validateUser).toHaveBeenCalledWith(tokenPayload);
      expect(result).toBeNull();
    });
  });
});
