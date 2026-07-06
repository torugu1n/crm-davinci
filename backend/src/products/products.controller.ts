import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ActiveTenantId } from '../auth/tenant.decorator';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  async findAll(@ActiveTenantId() tenantId: string) {
    return this.productsService.findAll(tenantId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT', 'SUPER_ADMIN')
  async create(@Body() body: any, @ActiveTenantId() tenantId: string) {
    return this.productsService.create(body, tenantId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT', 'SUPER_ADMIN')
  async update(@Param('id') id: string, @Body() body: any, @ActiveTenantId() tenantId: string) {
    return this.productsService.update(id, body, tenantId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT', 'SUPER_ADMIN')
  async delete(@Param('id') id: string, @ActiveTenantId() tenantId: string) {
    return this.productsService.delete(id, tenantId);
  }
}
