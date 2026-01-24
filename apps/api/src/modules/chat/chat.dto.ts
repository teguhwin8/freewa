import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
    @ApiProperty({
        description: 'Destination WhatsApp number (format: 628xxx)',
        example: '628123456789',
    })
    @IsString()
    @IsNotEmpty()
    to: string;

    @ApiProperty({
        description: 'Message text to send',
        example: 'Hello from FreeWA!',
    })
    @IsString()
    @IsNotEmpty()
    message: string;
}

export class MarkAsReadDto {
    @ApiProperty({
        description: 'Chat ID (phone number)',
        example: '628123456789',
    })
    @IsString()
    @IsNotEmpty()
    chatId: string;
}
