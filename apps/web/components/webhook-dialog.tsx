'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Webhook as WebhookIcon } from 'lucide-react';

interface WebhookDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    deviceId: string;
    deviceName: string;
    currentWebhook: string | null | undefined;
    onSave: (webhookUrl: string | null) => Promise<void>;
}

export function WebhookDialog({
    open,
    onOpenChange,
    deviceId,
    deviceName,
    currentWebhook,
    onSave,
}: WebhookDialogProps) {
    const [webhookUrl, setWebhookUrl] = useState(currentWebhook || '');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validateUrl = (url: string): boolean => {
        if (!url.trim()) return true; // Empty is valid (will clear webhook)
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
            return false;
        }
    };

    const handleSave = async () => {
        const trimmedUrl = webhookUrl.trim();

        if (trimmedUrl && !validateUrl(trimmedUrl)) {
            setError('Please enter a valid HTTP/HTTPS URL');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await onSave(trimmedUrl || null);
            onOpenChange(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save webhook');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClear = async () => {
        setIsSaving(true);
        setError(null);

        try {
            await onSave(null);
            setWebhookUrl('');
            onOpenChange(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to clear webhook');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <WebhookIcon className="size-5" />
                        Configure Webhook
                    </DialogTitle>
                    <DialogDescription>
                        Set a webhook URL for <strong>{deviceName}</strong> to receive incoming messages
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="webhook-url">Webhook URL</Label>
                        <Input
                            id="webhook-url"
                            value={webhookUrl}
                            onChange={(e) => {
                                setWebhookUrl(e.target.value);
                                setError(null);
                            }}
                            placeholder="https://your-backend.com/webhook"
                            disabled={isSaving}
                        />
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Leave empty to use the global webhook URL from environment
                        </p>
                    </div>

                    {currentWebhook && (
                        <div className="p-3 rounded-lg bg-muted">
                            <p className="text-xs text-muted-foreground mb-1">Current webhook:</p>
                            <code className="text-xs break-all">{currentWebhook}</code>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    {currentWebhook && (
                        <Button
                            variant="outline"
                            onClick={handleClear}
                            disabled={isSaving}
                        >
                            Clear Webhook
                        </Button>
                    )}
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="size-4 mr-2 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
