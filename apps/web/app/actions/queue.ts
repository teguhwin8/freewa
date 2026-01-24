'use server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'your_api_key';

export async function fetchQueueStats() {
    try {
        const res = await fetch(`${API_URL}/queue/stats`, {
            headers: { 'x-api-key': API_KEY },
            cache: 'no-store',
        });
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch queue stats:', error);
        return { success: false, error: 'Failed to fetch queue stats' };
    }
}

export async function fetchQueueJobs(status: string) {
    try {
        const res = await fetch(`${API_URL}/queue/jobs?status=${status}`, {
            headers: { 'x-api-key': API_KEY },
            cache: 'no-store',
        });
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch queue jobs:', error);
        return { success: false, error: 'Failed to fetch queue jobs' };
    }
}

export async function retryQueueJob(jobId: string) {
    try {
        const res = await fetch(`${API_URL}/queue/jobs/${jobId}/retry`, {
            method: 'POST',
            headers: { 'x-api-key': API_KEY },
        });
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Failed to retry job:', error);
        return { success: false, error: 'Failed to retry job' };
    }
}

export async function removeQueueJob(jobId: string) {
    try {
        const res = await fetch(`${API_URL}/queue/jobs/${jobId}`, {
            method: 'DELETE',
            headers: { 'x-api-key': API_KEY },
        });
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Failed to remove job:', error);
        return { success: false, error: 'Failed to remove job' };
    }
}
