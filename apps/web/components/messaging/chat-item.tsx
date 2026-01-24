import { ContactAvatar } from './contact-avatar';
import { formatTimestamp } from '@/lib/utils/format';

interface ChatItemProps {
    chat: {
        id: string;
        chatId: string;
        name: string | null;
        lastMessageBody: string | null;
        lastMessageTimestamp: number | string | null;
        unreadCount: number;
    };
    isSelected: boolean;
    onClick: () => void;
}

export function ChatItem({ chat, isSelected, onClick }: ChatItemProps) {

    return (
        <button
            onClick={onClick}
            className={`
        w-full p-3 flex items-center gap-3 transition-all border-b
        ${isSelected
                    ? 'bg-gray-100'
                    : 'hover:bg-gray-50 bg-white'
                }
      `}
        >
            {/* Avatar with unread indicator */}
            <div className="relative">
                <ContactAvatar
                    name={chat.name || undefined}
                    phoneNumber={chat.chatId}
                    size="md"
                />
                {chat.unreadCount > 0 && (
                    <div className="absolute -bottom-0.5 -right-0.5 size-3 bg-green-500 border-2 border-white rounded-full" />
                )}
            </div>

            {/* Chat Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between mb-1">
                    <h3 className={`truncate text-sm ${chat.unreadCount > 0
                        ? 'font-bold text-gray-900'
                        : 'font-semibold text-gray-700'
                        }`}>
                        {chat.name || chat.chatId}
                    </h3>
                    <span className={`text-xs ml-2 flex-shrink-0 ${chat.unreadCount > 0
                        ? 'text-green-600 font-semibold'
                        : 'text-gray-500'
                        }`}>
                        {formatTimestamp(chat.lastMessageTimestamp)}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${chat.unreadCount > 0
                        ? 'text-gray-900 font-medium'
                        : 'text-gray-500'
                        }`}>
                        {chat.lastMessageBody || 'No messages'}
                    </p>
                    {chat.unreadCount > 0 && (
                        <span className="ml-2 bg-green-500 text-white text-xs font-semibold rounded-full px-2 py-0.5 flex-shrink-0">
                            {chat.unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
}
