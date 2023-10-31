import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import {
  ExpireRefreshTokenDto,
  ExpireSessionDto,
  SessionStatus,
  USER_DATA,
} from '@app/common';
import { RefreshTokenRepository, SessionRepository } from '@app/database';
import { OnModuleInit } from '@nestjs/common';
import { RedisService } from '@app/redis';

@Processor('auth')
export class AuthProcessor implements OnModuleInit {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly redisService: RedisService,
    @InjectQueue('auth') private readonly authQueue: Queue,
  ) {}

  async onModuleInit() {
    // const repeatableJobs = await this.authQueue.getRepeatableJobs();
    // for await (const job of repeatableJobs) {
    //   if (job.name === '') {
    //     await this.authQueue.removeRepeatableByKey(job.key);
    //   }
    // }
    // await this.authQueue.add(
    //   'updateUsersStatus',
    //   {},
    //   {
    //     repeat: {
    //       cron: '* * * * *', // every minute
    //       //cron: '0 * * * *',// every hour
    //     },
    //   },
    // );
  }

  @Process('expireSession')
  async expireSession(job: Job<ExpireSessionDto>) {
    try {
      const data = job.data;
      if (!data.session_id) {
        return;
      }
      const session = await this.sessionRepository.findOneAndUpdate(
        {
          session_id: data.session_id,
          status: SessionStatus.Active,
        },
        {
          status: SessionStatus.Expired,
        },
      );
      if (!session) {
        console.log('Session not found');
      }
    } catch (error) {
      console.log(`Error in AuthProcessor.expireSession: ${error}`);
    }
  }

  @Process('expireRefreshToken')
  async expireRefreshToken(job: Job<ExpireRefreshTokenDto>) {
    try {
      const data = job.data;
      if (!data.refresh_token) {
        return;
      }
      const refreshToken = await this.refreshTokenRepository.findOneAndUpdate(
        {
          token: data.refresh_token,
          status: SessionStatus.Active,
        },
        {
          status: SessionStatus.Expired,
        },
      );
      if (!refreshToken) {
        throw new Error('Refresh token not found');
      }
    } catch (error) {
      console.log(`Error in AuthProcessor.expireRefreshToken: ${error}`);
    }
  }

  @Process('updateUsersStatus')
  async updateUsersStatus(job: Job<{}>) {
    try {
      const sessionUsers = await this.redisService.getByPattern(
        `${USER_DATA('')}*`,
      );
      console.log(sessionUsers);
    } catch (error) {
      console.log(`Error in AuthProcessor.updateUsersStatus: ${error}`);
    }
  }
}
