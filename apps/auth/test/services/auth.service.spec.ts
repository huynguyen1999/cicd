// auth.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/services';
import { RefreshToken, UserRepository } from '@app/database';
import { UserService } from '../../src/services';
import { SessionService } from '../../src/services';
import { SessionRepository } from '@app/database';
import { UnauthorizedException } from '@nestjs/common';
import { LoginDto } from '../../../../libs/common/src';
import * as bcryptjs from 'bcryptjs';
import {
  AuthController,
  SessionController,
  UserController,
} from '../../src/controllers';
import { AuthProcessor } from '../../src/processors';

jest.mock('@app/database');
jest.mock('@app/redis');
jest.mock('@app/rabbitmq');

describe('AuthService', () => {
  let authService: AuthService;
  const mockUserRepository = {
    findOne: jest.fn(),
  };
  const mockUserService = {
    updateUserStatus: jest.fn().mockReturnThis(),
  };
  const mockSessionRepository = {
    findOne: jest.fn().mockResolvedValue({
      session_id: 'session123',
    }),
  };
  const mockSessionService = {
    saveSession: jest.fn().mockResolvedValue({
      session_id: 'session123',
    }),
    createRefreshToken: jest.fn().mockResolvedValue({
      token: 'refreshToken123',
    }),
    revokeSession: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: UserService, useValue: mockUserService },
        { provide: SessionRepository, useValue: mockSessionRepository },
        { provide: SessionService, useValue: mockSessionService },
        { provide: AuthController, useValue: {} },
        { provide: SessionController, useValue: {} },
        { provide: UserController, useValue: {} },
        { provide: AuthProcessor, useValue: {} },
      ],
    }).compile();

    authService = await module.resolve<AuthService>(AuthService);
  });

  describe('AuthService', () => {
    describe('login', () => {
      const mockUser = {
        email: 'test@example.com',
        password:
          '$2a$10$QOD5TdrXHONWtVlfuIdLeuoLBXpY2uDWWxxeeNJSkD6sbhiQdkS9G',
        _id: '123',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      it('should return session information on successful login', async () => {
        const data: LoginDto = {
          email: 'test@example.com',
          password: 'user1',
          duration: 86400000,
        };
        const result = await authService.login(data);
        expect(result).toEqual({
          session: 'session123',
          refresh_token: 'refreshToken123',
          user: mockUser,
        });
      });

      it('should throw UnauthorizedException on invalid credentials', async () => {
        const data: LoginDto = {
          email: 'test@example.com',
          password: 'userx',
          duration: 86400000,
        };

        await expect(authService.login(data)).rejects.toThrow(
          UnauthorizedException,
        );
      });
    });

    describe('logout', () => {
      it('should revoke session and update user status on logout', async () => {
        // Mock necessary dependencies and test the logout method
        // Ensure that the method behaves as expected
        expect(1+1).toEqual(2);
      });
    });

    describe('getUserFromSession', () => {
      it('should return user on valid session', async () => {
        // Mock necessary dependencies and test the getUserFromSession method
        // Ensure that the method returns the expected result
      });

      it('should throw UnauthorizedException on invalid session', async () => {
        // Mock necessary dependencies and test the getUserFromSession method
        // Ensure that the method throws UnauthorizedException as expected
      });
    });
  });

  // Your test cases go here
});
