import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PasswordsController } from './passwords.controller';
import { PasswordsService } from './passwords.service';
import { PasswordItem, PasswordItemSchema } from './entities/password-item.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PasswordItem.name, schema: PasswordItemSchema },
    ]),
  ],
  controllers: [PasswordsController],
  providers: [PasswordsService],
})
export class PasswordsModule {}