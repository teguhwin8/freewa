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
import { Loader2, Webhook as WebhookIcon, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { testWebhook } from '@/app/actions/devices';

interface WebhookDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    deviceId: string;
    deviceName: string;
    currentWebhook: string | null | undefined;
    onSave: (webhookUrl: string | null) => Promise<void>;
}

interface TestResult {
    success: boolean;
    message?: string;
    error?: string;
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
    const [isTesting, setIsTesting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<TestResult | null>(null);

    const validateUrl = (url: string): boolean => {
        if (!url.trim()) return true; // Empty is valid (will clear webhook)
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
            return false;
        }
    };

    const handleTest = async () => {
        const trimmedUrl = webhookUrl.trim();

        if (!trimmedUrl) {
            setError('Please enter a webhook URL to test');
            return;
        }

        if (!validateUrl(trimmedUrl)) {
            setError('Please enter a valid HTTP/HTTPS URL');
            return;
        }

        setIsTesting(true);
        setError(null);
        setTestResult(null);

        try {
            const result = await testWebhook(trimmedUrl, deviceId, deviceName);
            setTestResult(result);
        } catch (err) {
            setTestResult({
                success: false,
                error: err instanceof Error ? err.message : 'Failed to test webhook',
            });
        } finally {
            setIsTesting(false);
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
            setTestResult(null);
            onOpenChange(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to clear webhook');
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setTestResult(null);
            setError(null);
        }
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
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
                        <div className="flex gap-2">
                            <Input
                                id="webhook-url"
                                value={webhookUrl}
                                onChange={(e) => {
                                    setWebhookUrl(e.target.value);
                                    setError(null);
                                    setTestResult(null);
                                }}
                                placeholder="https://your-backend.com/webhook"
                                disabled={isSaving || isTesting}
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleTest}
                                disabled={isSaving || isTesting || !webhookUrl.trim()}
                                title="Test Connection"
                            >
                                {isTesting ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Zap className="size-4" />
                                )}
                            </Button>
                        </div>
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Leave empty to use the global webhook URL from environment
                        </p>
                    </div>

                    {/* Test Result */}
                    {testResult && (
                        <div className={`p-3 rounded-lg flex items-start gap-2 ${testResult.success
                                ? 'bg-emerald-500/10 border border-emerald-500/20'
                                : 'bg-destructive/10 border border-destructive/20'
                            }`}>
                            {testResult.success ? (
                                <CheckCircle2 className="size-4 text-emerald-500 mt-0.5 shrink-0" />
                            ) : (
                                <XCircle className="size-4 text-destructive mt-0.5 shrink-0" />
                            )}
                            <p className={`text-sm ${testResult.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                                {testResult.success ? testResult.message : testResult.error}
                            </p>
                        </div>
                    )}

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
                            disabled={isSaving || isTesting}
                        >
                            Clear Webhook
                        </Button>
                    )}
                    <Button onClick={handleSave} disabled={isSaving || isTesting}>
                        {isSaving && <Loader2 className="size-4 mr-2 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

