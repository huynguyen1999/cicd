import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CheckUserInRoomDto,
  CreateRoomDto,
  GetRoomsDto,
  HandleJoinRequestDto,
  InviteUserToRoomDto,
  JoinRequestStatus,
  JoinRoomDto,
  KickUserFromRoomDto,
  NotificationStatus,
} from '@app/common';
import {
  NotificationDocument,
  NotificationRepository,
  Room,
  RoomDocument,
  RoomRepository,
  User,
  UserRepository,
} from '@app/database';
import { Types } from 'mongoose';
import { v4 as uuid } from 'uuid';

@Injectable()
export class RoomService {
  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly userRepository: UserRepository,
    private readonly notificationRepository: NotificationRepository,
  ) {}
  async createRoom(data: CreateRoomDto, user: User) {
    const userObjectId = new Types.ObjectId(user._id.toString());
    return await this.roomRepository.create({
      ...data,
      participants: [userObjectId],
      created_by: userObjectId,
    } as RoomDocument);
  }

  async getRooms(data: GetRoomsDto, user: User) {
    return await this.roomRepository.find(
      { created_by: user._id },
      {},
      { populate: 'participants' },
    );
  }

  private userIsAlreadyInRoom(room: Room, user: User) {
    if (
      room.participants.find(
        (participant) => participant.toString() === user._id.toString(),
      )
    ) {
      return true;
    }
    return false;
  }

  private userHasAlreadyRequestedToJoin(room: Room, user: User) {
    if (
      room.join_requests.find(
        (request) => request.user.toString() === user._id.toString(),
      )
    ) {
      return true;
    }
    return false;
  }

  async joinRoom(data: JoinRoomDto, user: User) {
    const room = await this.roomRepository.findOne(
      { _id: data.room_id },
      '+participants +join_requests +created_by',
    );
    if (!room) {
      throw new BadRequestException('Room not found');
    }
    if (this.userIsAlreadyInRoom(room, user)) {
      throw new BadRequestException('User already in the room');
    }
    if (this.userHasAlreadyRequestedToJoin(room, user)) {
      throw new BadRequestException('User has already requested to join');
    }

    const joinRoomRequest = {
      id: uuid(),
      user: new Types.ObjectId(user._id),
      introduction: data.introduction,
      status: JoinRequestStatus.Pending,
      time: new Date(),
    };

    const request = await this.roomRepository.findOneAndUpdate(
      {
        _id: data.room_id,
      },
      {
        $push: {
          join_requests: joinRoomRequest,
        },
      },
    );

    this.notificationRepository.create({
      recipient: new Types.ObjectId(room.created_by.toString()),
      title: 'Join room request',
      message: `User ${user.email} request to join room ${room.name}`,
      status: NotificationStatus.Unread,
    } as NotificationDocument);

    return request;
  }

  async handleJoinRequest(data: HandleJoinRequestDto, user: User) {
    const room = await this.roomRepository.findOne(
      { _id: data.room_id },
      '+join_requests +created_by',
    );
    // validate data
    if (!room) {
      throw new BadRequestException('Room not found');
    }
    if (room.created_by?.toString() !== user._id.toString()) {
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
    let joinedUser: User;
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
      joinedUser = await this.userRepository.findOne({
        _id: room.join_requests[joinRequestIndex].user,
      });
    }

    const updatedRoom = await this.roomRepository.findOneAndUpdate(
      { _id: data.room_id },
      updateData,
    );

    this.notificationRepository.create({
      recipient: new Types.ObjectId(room.join_requests[joinRequestIndex].user),
      title: 'Join request notice',
      message: `Your request status is switched to ${data.status}`,
      status: NotificationStatus.Unread,
    } as NotificationDocument);

    return {
      request: room.join_requests[joinRequestIndex],
      joined_user: joinedUser,
    };
  }

  async checkUserInRoom(data: CheckUserInRoomDto, user: User) {
    if (Types.ObjectId.isValid(data.room_id) === false) {
      throw new BadRequestException('Invalid room id');
    }
    const room = await this.roomRepository.findOne({ _id: data.room_id });
    if (!room) {
      throw new BadRequestException('Room not found');
    }
    if (this.userIsAlreadyInRoom(room, user)) {
      return {
        accessible: true,
        room,
      };
    }
    return {
      accessible: false,
    };
  }

  async kickUserFromRoom(data: KickUserFromRoomDto, admin: User) {
    if (data.user_id === admin._id.toString()) {
      throw new BadRequestException('You cannot kick yourself');
    }
    const [userToBeKicked, room] = await Promise.all([
      this.userRepository.findOne({ _id: data.user_id }),
      this.roomRepository.findOne(
        { _id: data.room_id },
        '+join_requests +created_by',
      ),
    ]);
    if (!room) {
      throw new BadRequestException('Room not found');
    }
    if (!userToBeKicked) {
      throw new BadRequestException('User not found');
    }
    if (room.created_by?.toString() !== admin._id.toString()) {
      throw new BadRequestException('You are not the owner of the room');
    }
    const participants = room.participants.filter(
      (participant) => participant.toString() !== data.user_id,
    );
    if (participants.length === room.participants.length) {
      throw new BadRequestException('User not found in the room');
    }
    await this.roomRepository.findOneAndUpdate(
      { _id: data.room_id },
      { participants },
    );

    this.notificationRepository.create({
      recipient: new Types.ObjectId(userToBeKicked._id),
      title: 'Kick notice',
      message: `You are kicked from room ${room.name}`,
      status: NotificationStatus.Unread,
    } as NotificationDocument);

    return { user: userToBeKicked };
  }

  async inviteUserToRoom(data: InviteUserToRoomDto, inviter: User) {
    const [room, user] = await Promise.all([
      this.roomRepository.findOne(
        { room_id: data.room_id },
        '+join_requests +participants',
      ),
      this.userRepository.findOne({ _id: data.user_id }),
    ]);
    if (!room) {
      throw new BadRequestException('Room not found');
    }
    if (!user) {
      throw new BadRequestException('The user you want to invite is not found');
    }
    if (this.userIsAlreadyInRoom(room, user)) {
      throw new BadRequestException(
        'The user you want to invite is already in the room',
      );
    }
    if (this.userHasAlreadyRequestedToJoin(room, user)) {
      throw new BadRequestException('User has already requested to join');
    }

    const joinRoomRequest = {
      id: uuid(),
      user: new Types.ObjectId(data.user_id),
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
}
