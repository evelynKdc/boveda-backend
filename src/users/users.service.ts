// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findOne(username: string): Promise<User | undefined> {
    const user = await this.userModel.findOne({ username }).exec();
    return user ?? undefined;
  }

  async create(
    username: string,
    zkpData: { publicKeyY: string; p: string; g: string },
  ): Promise<User> {
    const newUser = new this.userModel({ username, zkp: zkpData });
    return newUser.save();
  }
}