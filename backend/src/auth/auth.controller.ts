import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateStaff(body.email, body.senha);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return this.authService.staffLogin(user);
  }

  @Post('client')
  async clientLogin(@Body() body: any) {
    return this.authService.clientLogin(body.nome, body.telefone, body.aniversario);
  }
}
