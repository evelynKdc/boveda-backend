import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PasswordsService } from './passwords.service';
import { CreatePasswordItemDto } from './dto/create-password-item.dto';
import { UpdatePasswordItemDto } from './dto/update-password-item.dto';

@UseGuards(JwtAuthGuard)
@Controller('passwords') 
export class PasswordsController {
  constructor(private readonly passwordsService: PasswordsService) {}

  @Post()
  create(@Request() req, @Body() createDto: CreatePasswordItemDto) {
    return this.passwordsService.create(req.user.userId, createDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.passwordsService.findAllForUser(req.user.userId);
  }

  @Put(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdatePasswordItemDto,
  ) {
    return this.passwordsService.update(req.user.userId, id, updateDto);
  }

  @Delete(':id')
  delete(@Request() req, @Param('id') id: string) {
    return this.passwordsService.delete(req.user.userId, id);
  }
}