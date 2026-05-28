import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ActiveTenantId } from '../auth/tenant.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll(@ActiveTenantId() tenantId: string) {
    return this.usersService.findAll(tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @ActiveTenantId() tenantId: string) {
    return this.usersService.findOne(id, tenantId);
  }

  @Post()
  async create(@Body() body: any, @Request() req: any, @ActiveTenantId() tenantId: string) {
    return this.usersService.create(body, tenantId, req.user);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Request() req: any, @ActiveTenantId() tenantId: string) {
    return this.usersService.update(id, body, tenantId, req.user);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @ActiveTenantId() tenantId: string) {
    return this.usersService.delete(id, tenantId);
  }
}
