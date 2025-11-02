import { PartialType } from '@nestjs/mapped-types';
import { CreatePasswordItemDto } from './create-password-item.dto';

export class UpdatePasswordItemDto extends PartialType(CreatePasswordItemDto) {}