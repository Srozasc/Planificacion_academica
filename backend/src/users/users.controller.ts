import { Controller, Get, Query, Param, ParseIntPipe, Post, Put, Delete, Body, UseGuards, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { QueryUsersDto } from './dto/query-users.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AdminChangePasswordDto } from './dto/admin-change-password.dto';
import { UserResponseDto, UsersListResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('Maestro')
  async findAll(
    @Query() queryDto: QueryUsersDto,
    @Query('bimestreId') bimestreId?: string
  ): Promise<UsersListResponseDto> {
    const bimestreIdNum = bimestreId ? parseInt(bimestreId, 10) : undefined;
    return this.usersService.findAll(queryDto, bimestreIdNum);
  }

  @Get(':id')
  @Roles('Maestro')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('bimestreId') bimestreId?: string
  ): Promise<UserResponseDto | null> {
    const bimestreIdNum = bimestreId ? parseInt(bimestreId, 10) : undefined;
    return this.usersService.findOne(id, bimestreIdNum);
  }

  @Post()
  @Roles('Maestro')
  async create(
    @Body() createUserDto: CreateUserDto,
    @Query('bimestreId') bimestreId?: string
  ): Promise<UserResponseDto> {
    const bimestreIdNum = bimestreId ? parseInt(bimestreId, 10) : undefined;
    return this.usersService.create(createUserDto, bimestreIdNum);
  }

  @Put(':id')
  @Roles('Maestro')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Query('bimestreId') bimestreId?: string
  ): Promise<UserResponseDto> {
    const bimestreIdNum = bimestreId ? parseInt(bimestreId, 10) : undefined;
    return this.usersService.update(id, updateUserDto, bimestreIdNum);
  }

  @Delete(':id')
  @Roles('Maestro')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.usersService.remove(id);
  }

  @Post('admin-change-password')
  @Roles('Maestro')
  async adminChangePassword(
    @Body() adminChangePasswordDto: AdminChangePasswordDto,
    @Req() req: any
  ): Promise<{ message: string }> {
    const adminUserId = req.user.userId;
    return this.usersService.adminChangePassword(adminChangePasswordDto, adminUserId);
  }

  @Post('import')
  @Roles('Maestro')
  @UseInterceptors(FileInterceptor('file'))
  async importUsers(
    @UploadedFile() file: Express.Multer.File,
    @Body('bimestreId') bimestreId: string,
    @Req() req: any
  ) {
    if (!file) {
      throw new Error('No se ha proporcionado ningún archivo');
    }
    const bimestreIdNum = bimestreId ? parseInt(bimestreId, 10) : undefined;
    return this.usersService.importUsers(file, bimestreIdNum);
  }

  @Get(':id/permissions')
  @Roles('Maestro')
  async getUserPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Query('bimestreId') bimestreId?: string
  ) {
    const bimestreIdNum = bimestreId ? parseInt(bimestreId, 10) : undefined;
    return this.usersService.getUserPermissions(id, bimestreIdNum);
  }

  @Put(':id/permissions')
  @Roles('Maestro')
  async updateUserPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() permissionsData: any,
    @Query('bimestreId') bimestreId?: string
  ) {
    const bimestreIdNum = bimestreId ? parseInt(bimestreId, 10) : undefined;
    return this.usersService.updateUserPermissions(id, permissionsData, bimestreIdNum);
  }
}