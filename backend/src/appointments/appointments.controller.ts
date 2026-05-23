import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';

@Controller('appointments')
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Get()
  async findAll() {
    return this.appointmentsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Post()
  async create(@Body() body: any) {
    return this.appointmentsService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.appointmentsService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.appointmentsService.delete(id);
  }
}
