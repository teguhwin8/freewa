'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { BarChart3, ArrowLeft, RotateCcw, Trash2 } from 'lucide-react';

interface QueueStats {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
}

interface QueueJob {
    id: string;
    name: string;
    data: {
        type: string;
        to: string;
        message?: string;
        deviceId?: string;
    };
    status: string;
    timestamp: number;
    processedOn?: number;
    finishedOn?: number;
    failedReason?: string;
    attemptsMade: number;
}

type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';

export default function QueuePage() {
    const [stats, setStats] = useState<QueueStats | null>(null);
    const [jobs, setJobs] = useState<QueueJob[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<JobStatus>('waiting');
    const [loading, setLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'your_api_key';

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/queue/stats`, {
                headers: { 'x-api-key': API_KEY },
            });
            const data = await res.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, [API_URL, API_KEY]);

    const fetchJobs = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/queue/jobs?status=${selectedStatus}`, {
                headers: { 'x-api-key': API_KEY },
            });
            const data = await res.json();
            if (data.success) {
                setJobs(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        }
    }, [API_URL, API_KEY, selectedStatus]);

    const retryJob = async (jobId: string) => {
        setLoading(true);
        try {
            await fetch(`${API_URL}/queue/jobs/${jobId}/retry`, {
                method: 'POST',
                headers: { 'x-api-key': API_KEY },
            });
            fetchStats();
            fetchJobs();
        } catch (error) {
            console.error('Failed to retry job:', error);
        } finally {
            setLoading(false);
        }
    };

    const removeJob = async (jobId: string) => {
        if (!confirm('Are you sure you want to remove this job?')) return;
        setLoading(true);
        try {
            await fetch(`${API_URL}/queue/jobs/${jobId}`, {
                method: 'DELETE',
                headers: { 'x-api-key': API_KEY },
            });
            fetchStats();
            fetchJobs();
        } catch (error) {
            console.error('Failed to remove job:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchJobs();
    }, [fetchStats, fetchJobs]);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(() => {
            fetchStats();
            fetchJobs();
        }, 5000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchStats, fetchJobs]);

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    const statuses: { key: JobStatus; label: string }[] = [
        { key: 'waiting', label: 'Waiting' },
        { key: 'active', label: 'Active' },
        { key: 'completed', label: 'Completed' },
        { key: 'failed', label: 'Failed' },
        { key: 'delayed', label: 'Delayed' },
    ];

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <BarChart3 className="size-8" /> Queue Dashboard
                        </h1>
                        <p className="text-muted-foreground mt-1">Monitor message queue status</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={autoRefresh}
                                onCheckedChange={setAutoRefresh}
                                id="auto-refresh"
                            />
                            <label htmlFor="auto-refresh" className="text-sm text-muted-foreground cursor-pointer">
                                Auto-refresh (5s)
                            </label>
                        </div>
                        <Button asChild variant="outline">
                            <Link href="/" className="flex items-center gap-2">
                                <ArrowLeft className="size-4" /> Dashboard
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-5 gap-4 mb-8">
                    {statuses.map(({ key, label }) => (
                        <Card
                            key={key}
                            className={`cursor-pointer transition ${selectedStatus === key
                                    ? 'border-primary ring-2 ring-primary/20'
                                    : 'border-border hover:border-muted-foreground'
                                }`}
                            onClick={() => setSelectedStatus(key)}
                        >
                            <CardContent className="pt-6 text-center">
                                <div className="text-3xl font-bold text-primary">
                                    {stats?.[key] ?? '-'}
                                </div>
                                <p className="text-muted-foreground text-sm mt-1">{label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Jobs Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="capitalize">{selectedStatus} Jobs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {jobs.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                No {selectedStatus} jobs
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>To</TableHead>
                                        <TableHead>Device</TableHead>
                                        <TableHead>Created</TableHead>
                                        {selectedStatus === 'failed' && <TableHead>Error</TableHead>}
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {jobs.map((job) => (
                                        <TableRow key={job.id}>
                                            <TableCell className="font-mono text-xs">
                                                {job.id?.toString().slice(0, 8)}...
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={job.data.type === 'text' ? 'default' : 'secondary'}>
                                                    {job.data.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{job.data.to}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {job.data.deviceId?.slice(0, 8) || 'default'}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatTime(job.timestamp)}
                                            </TableCell>
                                            {selectedStatus === 'failed' && (
                                                <TableCell className="text-destructive max-w-xs truncate">
                                                    {job.failedReason}
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    {selectedStatus === 'failed' && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => retryJob(job.id)}
                                                            disabled={loading}
                                                        >
                                                            <RotateCcw className="size-3 mr-1" /> Retry
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => removeJob(job.id)}
                                                        disabled={loading}
                                                    >
                                                        <Trash2 className="size-3 mr-1" /> Remove
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
