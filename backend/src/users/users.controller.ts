import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards, BadRequestException } from '@nestjs/common';
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
  async findAll(@ActiveTenantId() tenantId: string, @Request() req: any) {
    const user = req.user;
    const isSuperAdmin = user.role === 'SUPER_ADMIN' || (user.roles && user.roles.includes('SUPER_ADMIN'));
    
    if (!isSuperAdmin && !tenantId) {
      throw new BadRequestException('Contexto de estabelecimento ausente.');
    }
    
    return this.usersService.findAll(tenantId || undefined);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @ActiveTenantId() tenantId: string, @Request() req: any) {
    const user = req.user;
    const isSuperAdmin = user.role === 'SUPER_ADMIN' || (user.roles && user.roles.includes('SUPER_ADMIN'));
    
    if (!isSuperAdmin && !tenantId) {
      throw new BadRequestException('Contexto de estabelecimento ausente.');
    }
    
    return this.usersService.findOne(id, tenantId || undefined);
  }

  @Post()
  async create(@Body() body: any, @Request() req: any, @ActiveTenantId() tenantId: string) {
    const user = req.user;
    const isSuperAdmin = user.role === 'SUPER_ADMIN' || (user.roles && user.roles.includes('SUPER_ADMIN'));
    
    const resolvedTenantId = tenantId || body.tenantId;
    if (!isSuperAdmin && !resolvedTenantId) {
      throw new BadRequestException('Contexto de estabelecimento ausente.');
    }
    
    return this.usersService.create(body, resolvedTenantId || undefined, req.user);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Request() req: any, @ActiveTenantId() tenantId: string) {
    const user = req.user;
    const isSuperAdmin = user.role === 'SUPER_ADMIN' || (user.roles && user.roles.includes('SUPER_ADMIN'));
    
    const resolvedTenantId = tenantId || undefined;
    
    return this.usersService.update(id, body, resolvedTenantId, req.user);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @ActiveTenantId() tenantId: string, @Request() req: any) {
    const user = req.user;
    const isSuperAdmin = user.role === 'SUPER_ADMIN' || (user.roles && user.roles.includes('SUPER_ADMIN'));
    
    return this.usersService.delete(id, tenantId || undefined);
  }
}
