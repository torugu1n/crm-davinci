import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  @Roles('ADMIN', 'ATTENDANT', 'BARBER', 'HAIRDRESSER', 'MANICURE_PEDICURE')
  async findAll() {
    return this.clientsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const isClient = req.user.role === 'CLIENT';
    if (isClient && req.user.id !== id) {
      throw new ForbiddenException('Você não tem permissão para visualizar os dados de outro cliente.');
    }
    return this.clientsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'ATTENDANT', 'BARBER', 'HAIRDRESSER', 'MANICURE_PEDICURE')
  async create(@Body() body: any) {
    return this.clientsService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    const isClient = req.user.role === 'CLIENT';
    if (isClient && req.user.id !== id) {
      throw new ForbiddenException('Você não tem permissão para atualizar os dados de outro cliente.');
    }
    return this.clientsService.update(id, body);
  }

  @Delete(':id')
  @Roles('ADMIN', 'ATTENDANT')
  async delete(@Param('id') id: string) {
    return this.clientsService.delete(id);
  }
}
