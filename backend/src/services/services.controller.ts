import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Get()
  async findAll() {
    return this.servicesService.findAll();
  }

  @Post()
  async create(@Body() body: any) {
    return this.servicesService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.servicesService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.servicesService.delete(id);
  }
}
