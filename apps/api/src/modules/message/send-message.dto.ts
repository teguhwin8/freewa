import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'Device ID for sending message (optional, default: first connected device)',
    example: 'abc123-def456-ghi789',
    required: false,
  })
  deviceId?: string;

  @ApiProperty({
    description: 'Destination WhatsApp number (format 628xxx)',
    example: '6285868474405',
  })
  to: string;

  @ApiProperty({
    description: 'Message type (text or image)',
    enum: ['text', 'image'],
    example: 'text',
  })
  type: 'text' | 'image';

  @ApiProperty({
    description: 'Text message content (Required if type=text)',
    example: 'Hello, this is a message from FreeWA!',
    required: false,
  })
  message?: string;

  @ApiProperty({
    description: 'Image URL (Required if type=image)',
    example: 'https://placehold.co/600x400/png',
    required: false,
  })
  url?: string;

  @ApiProperty({
    description: 'Caption for image',
    example: 'Check out this image!',
    required: false,
  })
  caption?: string;
}
