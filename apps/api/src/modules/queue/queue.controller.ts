import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Query,
    UseGuards,
    NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { ApiKeyGuard } from '../../common/guards/api-key/api-key.guard';
import { ApiTags, ApiSecurity, ApiOperation, ApiQuery } from '@nestjs/swagger';

type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';

@ApiTags('Queue')
@ApiSecurity('x-api-key')
@UseGuards(ApiKeyGuard)
@Controller('queue')
export class QueueController {
    constructor(@InjectQueue('message-queue') private messageQueue: Queue) { }

    @Get('stats')
    @ApiOperation({ summary: 'Get queue statistics' })
    async getStats() {
        const counts = await this.messageQueue.getJobCounts(
            'waiting',
            'active',
            'completed',
            'failed',
            'delayed',
        );

        return {
            success: true,
            data: counts,
        };
    }

    @Get('jobs')
    @ApiOperation({ summary: 'List jobs with pagination' })
    @ApiQuery({ name: 'status', required: false, enum: ['waiting', 'active', 'completed', 'failed', 'delayed'] })
    @ApiQuery({ name: 'start', required: false, type: Number })
    @ApiQuery({ name: 'end', required: false, type: Number })
    async getJobs(
        @Query('status') status: JobStatus = 'waiting',
        @Query('start') start: string = '0',
        @Query('end') end: string = '20',
    ) {
        const startNum = parseInt(start, 10);
        const endNum = parseInt(end, 10);

        let jobs: Job[] = [];

        switch (status) {
            case 'waiting':
                jobs = await this.messageQueue.getWaiting(startNum, endNum);
                break;
            case 'active':
                jobs = await this.messageQueue.getActive(startNum, endNum);
                break;
            case 'completed':
                jobs = await this.messageQueue.getCompleted(startNum, endNum);
                break;
            case 'failed':
                jobs = await this.messageQueue.getFailed(startNum, endNum);
                break;
            case 'delayed':
                jobs = await this.messageQueue.getDelayed(startNum, endNum);
                break;
        }

        const jobList = jobs.map((job) => ({
            id: job.id,
            name: job.name,
            data: job.data,
            status: status,
            timestamp: job.timestamp,
            processedOn: job.processedOn,
            finishedOn: job.finishedOn,
            failedReason: job.failedReason,
            attemptsMade: job.attemptsMade,
        }));

        return {
            success: true,
            data: jobList,
            meta: {
                status,
                start: startNum,
                end: endNum,
                count: jobList.length,
            },
        };
    }

    @Post('jobs/:id/retry')
    @ApiOperation({ summary: 'Retry a failed job' })
    async retryJob(@Param('id') id: string) {
        const job = await this.messageQueue.getJob(id);

        if (!job) {
            throw new NotFoundException(`Job ${id} not found`);
        }

        await job.retry();

        return {
            success: true,
            message: `Job ${id} has been retried`,
        };
    }

    @Delete('jobs/:id')
    @ApiOperation({ summary: 'Remove a job' })
    async removeJob(@Param('id') id: string) {
        const job = await this.messageQueue.getJob(id);

        if (!job) {
            throw new NotFoundException(`Job ${id} not found`);
        }

        await job.remove();

        return {
            success: true,
            message: `Job ${id} has been removed`,
        };
    }
}
