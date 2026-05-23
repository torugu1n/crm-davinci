import { Controller, Get } from '@nestjs/common';
import { FinanceService } from './finance.service';

@Controller('finance')
export class FinanceController {
  constructor(private financeService: FinanceService) {}

  @Get('summary')
  async getSummary() {
    return this.financeService.getFinanceSummary();
  }
}
