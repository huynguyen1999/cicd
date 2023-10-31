import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import * as repositories from './repositories';
import {
  Message,
  MessageSchema,
  RefreshToken,
  RefreshTokenSchema,
  Room,
  RoomSchema,
  Session,
  SessionSchema,
  User,
  UserSchema,
} from './schemas';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Room.name, schema: RoomSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Session.name, schema: SessionSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),
  ],
  providers: [...Object.values(repositories)],
  exports: [...Object.values(repositories)],
})
export class DatabaseModule {}
