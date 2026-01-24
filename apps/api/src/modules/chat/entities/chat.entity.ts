import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne } from 'typeorm';

@Entity('chats')
@Index(['deviceId', 'chatId'], { unique: true })
export class Chat {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    deviceId: string;

    @Column()
    chatId: string; // Phone number without @s.whatsapp.net

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    lastMessageBody: string;

    @Column({ type: 'bigint', nullable: true })
    lastMessageTimestamp: number;

    @Column({ default: 0 })
    unreadCount: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
