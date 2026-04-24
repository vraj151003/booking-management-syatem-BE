import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { MovieModule } from './movie.module';
import { MovieService } from './movie.service';
import { ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { RequirePermissions } from '../permission/decorators/permissions.decorator';
import { PermissionsGuard } from '../permission/guards/permission.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags("movies")
@ApiBearerAuth()
@Controller('movies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MovieController {
    constructor(private readonly movieService : MovieService){
    }

    @Post()
    @RequirePermissions('MANAGE_MOVIE')
    @ApiResponse({ status: 201, description: 'Movie created' })
    createMovie(@Body() dto: CreateMovieDto) {
        return this.movieService.createMovie(dto);
    }

    @Get()
    @RequirePermissions('MANAGE_MOVIE')
    @ApiResponse({ status: 200, description: 'Movies retrieved' })
    getMovies() {
        return this.movieService.findAllMovies();
    }

    @Get(':id')
    @RequirePermissions('MANAGE_MOVIE')
    @ApiResponse({status : 200, description : "Movie retrieved"})
    findOne(@Param('id') id : string){
        return this.movieService.findOneMovie(id);
    }

    @Put(':id')
    @RequirePermissions('MANAGE_MOVIE')
    @ApiResponse({status : 200, description : "Movie updated successfully"})
    updateMovie(@Param('id') id : string , @Body() dto : UpdateMovieDto) {
        return this.movieService.updateMovie(id, dto);
    }

    @Delete(':id')
    @RequirePermissions('MANAGE_MOVIE')
    @ApiResponse({status : 200 , description : "Movie Deleted Successfully"})
    deleteMovie(@Param('id') id : string){
        return this.movieService.deleteMovie(id);
    }
}
