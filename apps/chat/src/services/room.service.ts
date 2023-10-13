import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreateRoomDto,
  GetRoomsDto,
  HandleJoinRequestDto,
  JoinRequestStatus,
  JoinRoomDto,
} from '@app/common';
import { Room, RoomRepository } from '@app/database';
import { Types } from 'mongoose';
import { v4 as uuid } from 'uuid';

@Injectable()
export class RoomService {
  constructor(private readonly roomRepository: RoomRepository) {}
  async createRoom(data: CreateRoomDto, userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    return await this.roomRepository.create({
      ...data,
      participants: [userObjectId],
      created_by: userObjectId,
    });
  }

  async getRooms(userId: string, data: GetRoomsDto) {
    return await this.roomRepository.find(
      { created_by: userId },
      {},
      { populate: 'participants' },
    );
  }

  private userIsAlreadyInRoom(userId: string, room: Room) {
    if (
      room.participants.find((participant) => participant.toString() === userId)
    ) {
      return true;
    }
    return false;
  }

  private userHasAlreadyRequestedToJoin(userId: string, room: Room) {
    if (
      room.join_requests.find((request) => request.user.toString() === userId)
    ) {
      return true;
    }
    return false;
  }

  // TODO: To add another participant to the room, the owner of the room must be the one to add the participant
  async joinRoom(userId: string, data: JoinRoomDto) {
    const room = await this.roomRepository.findOne(
      { _id: data.room_id },
      '+participants +join_requests',
    );
    if (!room) {
      throw new BadRequestException('Room not found');
    }
    if (this.userIsAlreadyInRoom(userId, room)) {
      throw new BadRequestException('User already in the room');
    }
    if (this.userHasAlreadyRequestedToJoin(userId, room)) {
      throw new BadRequestException('User has already requested to join');
    }

    const joinRoomRequest = {
      id: uuid(),
      user: userId,
      introduction: data.introduction,
      status: JoinRequestStatus.Pending,
    };

    return await this.roomRepository.findOneAndUpdate(
      {
        _id: data.room_id,
      },
      {
        $push: {
          join_requests: joinRoomRequest,
        },
      },
    );
  }

  async handleJoinRequest(userId: string, data: HandleJoinRequestDto) {}

  // TODO: Kick a participant from the room

  // TODO: Make another participant admin

  // TODO: Better make room roles and permissions in the future
}
