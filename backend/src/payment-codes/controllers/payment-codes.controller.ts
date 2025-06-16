import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PaymentCodesService } from '../services/payment-codes.service';
import { CreatePaymentCodeDto, PaymentCodeCategory, PaymentCodeType } from '../dto/create-payment-code.dto';
import { UpdatePaymentCodeDto } from '../dto/update-payment-code.dto';
import { PaymentCodeResponseDto } from '../dto/payment-code-response.dto';

@Controller('payment-codes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentCodesController {
  constructor(private readonly paymentCodesService: PaymentCodesService) {}
  @Post()
  @Roles('Administrador', 'Director/Jefe de Programa')
  async create(@Body() createPaymentCodeDto: CreatePaymentCodeDto): Promise<PaymentCodeResponseDto> {
    return await this.paymentCodesService.create(createPaymentCodeDto);
  }
  @Get()
  @Roles('Administrador', 'Director/Jefe de Programa', 'Usuario Lector')
  async findAll(
    @Query('category') category?: PaymentCodeCategory,
    @Query('type') type?: PaymentCodeType,
    @Query('active') active?: string
  ): Promise<PaymentCodeResponseDto[]> {
    // Si se especifica que solo códigos activos
    if (active === 'true') {
      return await this.paymentCodesService.findActive();
    }
    
    // Si se especifica una categoría
    if (category) {
      return await this.paymentCodesService.findByCategory(category);
    }
    
    // Si se especifica un tipo
    if (type) {
      return await this.paymentCodesService.findByType(type);
    }
    
    // Retornar todos los códigos
    return await this.paymentCodesService.findAll();
  }
  @Get('categories/:category')
  @Roles('Administrador', 'Director/Jefe de Programa', 'Usuario Lector')
  async findByCategory(@Param('category') category: PaymentCodeCategory): Promise<PaymentCodeResponseDto[]> {
    return await this.paymentCodesService.findByCategory(category);
  }
  @Get('types/:type')
  @Roles('Administrador', 'Director/Jefe de Programa', 'Usuario Lector')
  async findByType(@Param('type') type: PaymentCodeType): Promise<PaymentCodeResponseDto[]> {
    return await this.paymentCodesService.findByType(type);
  }
  @Get('active')
  @Roles('Administrador', 'Director/Jefe de Programa', 'Usuario Lector')
  async findActive(): Promise<PaymentCodeResponseDto[]> {
    return await this.paymentCodesService.findActive();
  }
  @Get('code/:codeName')
  @Roles('Administrador', 'Director/Jefe de Programa', 'Usuario Lector')
  async findByCodeName(@Param('codeName') codeName: string): Promise<PaymentCodeResponseDto> {
    return await this.paymentCodesService.findByCodeName(codeName);
  }
  @Get(':id')
  @Roles('Administrador', 'Director/Jefe de Programa', 'Usuario Lector')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<PaymentCodeResponseDto> {
    return await this.paymentCodesService.findOne(id);
  }
  @Patch(':id')
  @Roles('Administrador', 'Director/Jefe de Programa')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentCodeDto: UpdatePaymentCodeDto
  ): Promise<PaymentCodeResponseDto> {
    return await this.paymentCodesService.update(id, updatePaymentCodeDto);
  }
  @Patch(':id/activate')
  @Roles('Administrador', 'Director/Jefe de Programa')
  async activate(@Param('id', ParseIntPipe) id: number): Promise<PaymentCodeResponseDto> {
    return await this.paymentCodesService.activate(id);
  }
  @Patch(':id/deactivate')
  @Roles('Administrador', 'Director/Jefe de Programa')
  async deactivate(@Param('id', ParseIntPipe) id: number): Promise<PaymentCodeResponseDto> {
    return await this.paymentCodesService.deactivate(id);
  }
  @Delete(':id')
  @Roles('Administrador')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.paymentCodesService.remove(id);
  }
}
