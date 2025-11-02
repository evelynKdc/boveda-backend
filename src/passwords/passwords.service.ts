import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PasswordItem } from './entities/password-item.schema';
import { CreatePasswordItemDto } from './dto/create-password-item.dto'; 
import { UpdatePasswordItemDto } from './dto/update-password-item.dto';

@Injectable()
export class PasswordsService {
  constructor(
    @InjectModel(PasswordItem.name)
    private passwordItemModel: Model<PasswordItem>,
  ) {}

  async create(userId: string, createDto: CreatePasswordItemDto): Promise<PasswordItem> {
    const newItem = new this.passwordItemModel({
      ...createDto,
      userId,
    });
    return newItem.save();
  }

  async findAllForUser(userId: string): Promise<PasswordItem[]> {
    return this.passwordItemModel.find({ userId }).exec();
  }

  async update(userId: string, itemId: string, updateDto: UpdatePasswordItemDto): Promise<PasswordItem> {
    const item = await this.passwordItemModel.findOneAndUpdate(
      { _id: itemId, userId }, 
      updateDto,
      { new: true }, 
    );

    if (!item) {
      throw new NotFoundException('Ítem no encontrado o no autorizado');
    }
    return item;
  }

  async delete(userId: string, itemId: string): Promise<{ message: string }> {
    const result = await this.passwordItemModel.findOneAndDelete({
      _id: itemId,
      userId,
    });

    if (!result) {
      throw new NotFoundException('Ítem no encontrado o no autorizado');
    }
    return { message: 'Ítem borrado con éxito' };
  }
}