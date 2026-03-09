import { Test, TestingModule } from '@nestjs/testing';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfiguration } from '../../config/jwt.config';

describe('FeedController', () => {
  let controller: FeedController;
  let service: FeedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({}),
        ConfigModule.forFeature(jwtConfiguration),
      ],
      controllers: [FeedController],
      providers: [
        {
          provide: FeedService,
          useValue: {
            getUserFeed: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<FeedController>(FeedController);
    service = module.get<FeedService>(FeedService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFeed', () => {
    it('should call getUserFeed with correct default params when no query given', async () => {
      const mockResult = { data: [], nextCursor: null };
      jest.spyOn(service, 'getUserFeed').mockResolvedValue(mockResult as any);

      const result = await controller.getFeed(undefined, undefined, undefined);

      expect(service.getUserFeed).toHaveBeenCalledWith(
        undefined,
        undefined,
        10,
      );
      expect(result).toEqual(mockResult);
    });

    it('should call getUserFeed with correct params when user and query given', async () => {
      const mockResult = { data: [{ id: '1' }], nextCursor: '1' };
      jest.spyOn(service, 'getUserFeed').mockResolvedValue(mockResult as any);

      const mockUser = { sub: 'user-1' } as any;
      const result = await controller.getFeed(mockUser, 'cursor-abc', '5');

      expect(service.getUserFeed).toHaveBeenCalledWith(
        'user-1',
        'cursor-abc',
        5,
      );
      expect(result).toEqual(mockResult);
    });
  });
});
