import { Body, Controller, Delete, ForbiddenException, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { BarbersService } from './barbers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('barbers')
export class BarbersController {
  constructor(private barbersService: BarbersService) {}

  @Get()
  async findAll() {
    return this.barbersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.barbersService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(@Body() body: any) {
    return this.barbersService.create(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.barbersService.update(id, body);
  }

  @Put(':id/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BARBER')
  async updateProfile(
    @Param('id') id: string,
    @Body() body: { miniBio?: string; fotoUrl?: string; especialidade?: string },
    @Request() req: any
  ) {
    const user = req.user;
    const isAdmin = user.role === 'ADMIN' || user.roles?.includes('ADMIN');
    if (!isAdmin) {
      const barber = await this.barbersService.findOne(id);
      if (barber.userId !== user.id) {
        throw new ForbiddenException('Você não tem permissão para alterar o perfil de outro profissional.');
      }
    }
    return this.barbersService.updateProfile(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async delete(@Param('id') id: string) {
    return this.barbersService.delete(id);
  }

  @Get(':id/dashboard')
  async getDashboard(@Param('id') id: string) {
    return this.barbersService.getBarberDashboard(id);
  }
}
