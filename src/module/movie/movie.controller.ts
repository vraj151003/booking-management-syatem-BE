import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { MovieModule } from './movie.module';
import { MovieService } from './movie.service';
import { ApiResponse, ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { RequirePermissions } from '../permission/decorators/permissions.decorator';
import { PermissionsGuard } from '../permission/guards/permission.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

@ApiTags("movies")
@ApiBearerAuth()
@Controller('movies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MovieController {
    constructor(private readonly movieService : MovieService){
    }

    @Post()
    @RequirePermissions('MANAGE_MOVIE')
    @ApiOperation({ summary: 'Create a new movie (defaults to UPCOMING status)' })
    @ApiResponse({ status: 201, description: 'Movie created' })
    createMovie(@Body() dto: CreateMovieDto) {
        return this.movieService.createMovie(dto);
    }

    @Get()
    @RequirePermissions('MANAGE_MOVIE')
    @ApiOperation({ summary: 'Get all movies' })
    @ApiResponse({ status: 200, description: 'Movies retrieved' })
    getMovies() {
        return this.movieService.findAllMovies();
    }

    @Get('upcoming/all')
    @RequirePermissions('MANAGE_MOVIE')
    @ApiOperation({ summary: 'Get all upcoming movies' })
    @ApiResponse({ status: 200, description: 'Upcoming movies retrieved' })
    getUpcomingMovies() {
        return this.movieService.findUpcomingMovies();
    }

    @Get('running/all')
    @RequirePermissions('MANAGE_MOVIE')
    @ApiOperation({ summary: 'Get all currently running movies' })
    @ApiResponse({ status: 200, description: 'Running movies retrieved' })
    getRunningMovies() {
        return this.movieService.findRunningMovies();
    }

    @Get('trending')
    @ApiOperation({ summary: 'Get top 10 trending movies (most bookings in last 30 days)' })
    @ApiResponse({ status: 200, description: 'Trending movies retrieved' })
    getTrendingMovies() {
        return this.movieService.findTrendingMovies();
    }

    @Get('sample-excel')
    @RequirePermissions('MANAGE_MOVIE')
    @ApiOperation({ summary: 'Download sample Excel file for bulk upload' })
    @ApiResponse({ status: 200, description: 'Sample Excel file downloaded' })
    downloadSampleExcel(@Res() res: Response) {
        const buffer = this.movieService.generateSampleExcelFile();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sample-movies.xlsx');
        res.send(buffer);
    }

    @Get(':id')
    @RequirePermissions('MANAGE_MOVIE')
    @ApiOperation({ summary: 'Get a movie by ID' })
    @ApiResponse({status : 200, description : "Movie retrieved"})
    findOne(@Param('id') id : string){
        return this.movieService.findOneMovie(id);
    }

    @Put(':id')
    @RequirePermissions('MANAGE_MOVIE')
    @ApiOperation({ summary: 'Update a movie' })
    @ApiResponse({status : 200, description : "Movie updated successfully"})
    updateMovie(@Param('id') id : string , @Body() dto : UpdateMovieDto) {
        return this.movieService.updateMovie(id, dto);
    }

    @Delete(':id')
    @RequirePermissions('MANAGE_MOVIE')
    @ApiOperation({ summary: 'Delete a movie' })
    @ApiResponse({status : 200 , description : "Movie Deleted Successfully"})
    deleteMovie(@Param('id') id : string){
        return this.movieService.deleteMovie(id);
    }

    @Post('bulk-upload')
    @RequirePermissions('MANAGE_MOVIE')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Bulk upload movies from Excel file' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'Movies bulk uploaded successfully' })
    bulkUploadMovies(@UploadedFile() file: Express.Multer.File) {
        return this.movieService.bulkUploadMovies(file);
    }
}
