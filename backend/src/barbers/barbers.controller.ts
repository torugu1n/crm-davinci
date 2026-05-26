import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
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
