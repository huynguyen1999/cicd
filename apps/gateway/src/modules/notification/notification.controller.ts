import {
  Body,
  Controller,
  Put,
  Req,
  Res,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';
import { Request, Response } from 'express';
import { Subject, map } from 'rxjs';
import { SessionGuard } from '../../guards';
import { CurrentUser, NOTIFICATION_EVENT } from '@app/common';
import { NotificationService } from './services';
import { User } from '@app/database';

@UseGuards(SessionGuard)
@Controller('notification')
export class NotificationController {
  constructor(
    private notificationEvent: EventEmitter2,
    private notificationService: NotificationService,
  ) {}

  @Sse()
  async notification(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: User,
  ) {
    const subject = new Subject();
    let eventListener: any;
    try {
      eventListener = (data: any) => {
        subject.next({ notifications: [data] });
      };

      this.notificationEvent.on(
        NOTIFICATION_EVENT(user._id.toString()),
        eventListener,
      );

      setTimeout(async () => {
        const latestNotifications =
          await this.notificationService.retrieveNotifications({}, user);

        subject.next({ notifications: latestNotifications });
      }, 1);
      return subject.pipe(
        map((data: any) => {
          return { data } as MessageEvent;
        }),
      );
    } catch (error) {
      error.status_code = 422;
      res.end(`data: ${error.message || 'Unknown error'}\n\n`);
    } finally {
      req.on('close', () => {
        this.notificationEvent.off(
          NOTIFICATION_EVENT(user._id.toString()),
          eventListener,
        );
        subject.complete();
        res.end();
      });
    }
  }

  @Put()
  async updateNotificationsStatus(
    @Body() body: any,
    @Res() res: Response,
    @CurrentUser() user: User,
  ) {
    const result = await this.notificationService.updateNotificationsStatus(
      body,
      user,
    );
    return res.status(200).send(result);
  }
}
