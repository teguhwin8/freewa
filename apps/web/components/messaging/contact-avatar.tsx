import { Avatar as RadixAvatar, AvatarFallback } from '@/components/ui/avatar';

interface ContactAvatarProps {
    name?: string;
    phoneNumber?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function ContactAvatar({ name, phoneNumber, size = 'md', className = '' }: ContactAvatarProps) {
    const getInitials = () => {
        if (name) {
            return name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
        }
        if (phoneNumber) {
            return phoneNumber.slice(-2);
        }
        return '?';
    };

    const sizeClasses = {
        sm: 'size-8 text-xs',
        md: 'size-10 text-sm',
        lg: 'size-12 text-base',
    };

    const getColorFromString = (str: string) => {
        const colors = [
            'bg-blue-500',
            'bg-green-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-orange-500',
            'bg-teal-500',
            'bg-cyan-500',
            'bg-indigo-500',
        ];
        const hash = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    const bgColor = getColorFromString(name || phoneNumber || '');

    return (
        <RadixAvatar className={`${sizeClasses[size]} ${className}`}>
            <AvatarFallback className={`${bgColor} text-white font-semibold`}>
                {getInitials()}
            </AvatarFallback>
        </RadixAvatar>
    );
}
