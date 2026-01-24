import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('messages')
@Index(['deviceId', 'chatId'])
@Index(['deviceId', 'chatId', 'createdAt'])
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    deviceId: string;

    @Column()
    chatId: string; // Phone number without @s.whatsapp.net

    @Column()
    from: string; // Full JID (e.g., 628xxx@s.whatsapp.net)

    @Column()
    to: string; // Full JID

    @Column('text')
    body: string;

    @Column({ type: 'bigint' })
    timestamp: number;

    @Column({ default: false })
    fromMe: boolean;

    @Column({ default: 'sent' })
    status: string; // 'pending' | 'sent' | 'delivered' | 'read' | 'failed'

    @CreateDateColumn()
    createdAt: Date;
}
