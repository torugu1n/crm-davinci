import { Controller, Get, Param } from '@nestjs/common';
import { BarbersService } from './barbers.service';

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

  @Get(':id/dashboard')
  async getDashboard(@Param('id') id: string) {
    return this.barbersService.getBarberDashboard(id);
  }
}
