import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CheckUserInRoomDto,
  CreateRoomDto,
  GetRoomsDto,
  HandleJoinRequestDto,
  JoinRequestStatus,
  JoinRoomDto,
  KickUserFromRoomDto,
} from '@app/common';
import { Room, RoomRepository, UserRepository } from '@app/database';
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
      user: new Types.ObjectId(userId),
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

  async handleJoinRequest(userId: string, data: HandleJoinRequestDto) {
    const room = await this.roomRepository.findOne(
      { _id: data.room_id },
      '+join_requests +created_by',
    );
    // validate data
    if (!room) {
      throw new BadRequestException('Room not found');
    }
    if (room.created_by?.toString() !== userId) {
      throw new BadRequestException('You are not the owner of the room');
    }
    const joinRequestIndex = room.join_requests.findIndex(
      (joinRequest) => joinRequest.id === data.join_request_id,
    );
    if (joinRequestIndex === -1) {
      throw new BadRequestException('Join request not found');
    }
    if (room.join_requests[joinRequestIndex].status === data.status) {
      throw new BadRequestException('Duplicate status');
    }
    //
    room.join_requests[joinRequestIndex].status = data.status;
    const updateData: any = {
      join_requests: room.join_requests,
    };

    if (data.status === JoinRequestStatus.Approved) {
      if (
        room.participants.find(
          (participant) =>
            participant.toString() ===
            room.join_requests[joinRequestIndex].user.toString(),
        )
      ) {
        throw new BadRequestException('User is already in the room');
      }
      updateData.participants = [
        ...room.participants,
        room.join_requests[joinRequestIndex].user,
      ];
    }

    const updatedRoom = await this.roomRepository.findOneAndUpdate(
      { _id: data.room_id },
      updateData,
    );
    return room.join_requests[joinRequestIndex];
  }

  async checkUserInRoom(userId: string, data: CheckUserInRoomDto) {
    if (Types.ObjectId.isValid(data.room_id) === false) {
      throw new BadRequestException('Invalid room id');
    }
    const room = await this.roomRepository.findOne({ _id: data.room_id });
    if (!room) {
      throw new BadRequestException('Room not found');
    }
    return this.userIsAlreadyInRoom(userId, room);
  }

  async kickUserFromRoom(adminUserId: string, data: KickUserFromRoomDto) {
    if (data.user_id === adminUserId) {
      throw new BadRequestException('You cannot kick yourself');
    }
    const room = await this.roomRepository.findOne(
      { _id: data.room_id },
      '+join_requests +created_by',
    );
    if (!room) {
      throw new BadRequestException('Room not found');
    }
    if (room.created_by?.toString() !== adminUserId) {
      throw new BadRequestException('You are not the owner of the room');
    }
    const participants = room.participants.filter(
      (participant) => participant.toString() !== data.user_id,
    );
    if (participants.length === room.participants.length) {
      throw new BadRequestException('User not found in the room');
    }
    return await this.roomRepository.findOneAndUpdate(
      { _id: data.room_id },
      { participants },
    );
  }
}
