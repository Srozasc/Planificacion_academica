import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentCode } from '../entities/payment-code.entity';
import { CreatePaymentCodeDto, PaymentCodeCategory, PaymentCodeType } from '../dto/create-payment-code.dto';
import { UpdatePaymentCodeDto } from '../dto/update-payment-code.dto';
import { PaymentCodeResponseDto } from '../dto/payment-code-response.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class PaymentCodesService {
  constructor(
    @InjectRepository(PaymentCode)
    private paymentCodeRepository: Repository<PaymentCode>,
  ) {}

  async create(createPaymentCodeDto: CreatePaymentCodeDto): Promise<PaymentCodeResponseDto> {
    // Verificar que el código no exista
    const existingCode = await this.paymentCodeRepository.findOne({
      where: { code_name: createPaymentCodeDto.code_name }
    });

    if (existingCode) {
      throw new BadRequestException(`El código de pago '${createPaymentCodeDto.code_name}' ya existe`);
    }

    // Validar fechas de vigencia
    if (createPaymentCodeDto.valid_from && createPaymentCodeDto.valid_until) {
      const fromDate = new Date(createPaymentCodeDto.valid_from);
      const untilDate = new Date(createPaymentCodeDto.valid_until);
      
      if (fromDate >= untilDate) {
        throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
      }
    }

    const paymentCode = this.paymentCodeRepository.create(createPaymentCodeDto);
    const savedPaymentCode = await this.paymentCodeRepository.save(paymentCode);
    
    return plainToClass(PaymentCodeResponseDto, savedPaymentCode, { excludeExtraneousValues: true });
  }

  async findAll(): Promise<PaymentCodeResponseDto[]> {
    const paymentCodes = await this.paymentCodeRepository.find({
      where: { deleted_at: null },
      order: { category: 'ASC', type: 'ASC', code_name: 'ASC' }
    });
    
    return paymentCodes.map(code => 
      plainToClass(PaymentCodeResponseDto, code, { excludeExtraneousValues: true })
    );
  }

  async findOne(id: number): Promise<PaymentCodeResponseDto> {
    const paymentCode = await this.paymentCodeRepository.findOne({
      where: { id, deleted_at: null }
    });

    if (!paymentCode) {
      throw new NotFoundException(`Código de pago con ID ${id} no encontrado`);
    }

    return plainToClass(PaymentCodeResponseDto, paymentCode, { excludeExtraneousValues: true });
  }

  async findByCodeName(codeName: string): Promise<PaymentCodeResponseDto> {
    const paymentCode = await this.paymentCodeRepository.findOne({
      where: { code_name: codeName, deleted_at: null }
    });

    if (!paymentCode) {
      throw new NotFoundException(`Código de pago '${codeName}' no encontrado`);
    }

    return plainToClass(PaymentCodeResponseDto, paymentCode, { excludeExtraneousValues: true });
  }

  async findByCategory(category: PaymentCodeCategory): Promise<PaymentCodeResponseDto[]> {
    const paymentCodes = await this.paymentCodeRepository.find({
      where: { category, deleted_at: null },
      order: { type: 'ASC', code_name: 'ASC' }
    });

    return paymentCodes.map(code => 
      plainToClass(PaymentCodeResponseDto, code, { excludeExtraneousValues: true })
    );
  }

  async findByType(type: PaymentCodeType): Promise<PaymentCodeResponseDto[]> {
    const paymentCodes = await this.paymentCodeRepository.find({
      where: { type, deleted_at: null },
      order: { category: 'ASC', code_name: 'ASC' }
    });

    return paymentCodes.map(code => 
      plainToClass(PaymentCodeResponseDto, code, { excludeExtraneousValues: true })
    );
  }

  async findActive(): Promise<PaymentCodeResponseDto[]> {
    const now = new Date();
    const paymentCodes = await this.paymentCodeRepository.createQueryBuilder('pc')
      .where('pc.deleted_at IS NULL')
      .andWhere('pc.is_active = :isActive', { isActive: true })
      .andWhere('(pc.valid_from IS NULL OR pc.valid_from <= :now)', { now })
      .andWhere('(pc.valid_until IS NULL OR pc.valid_until >= :now)', { now })
      .orderBy('pc.category', 'ASC')
      .addOrderBy('pc.type', 'ASC')
      .addOrderBy('pc.code_name', 'ASC')
      .getMany();

    return paymentCodes.map(code => 
      plainToClass(PaymentCodeResponseDto, code, { excludeExtraneousValues: true })
    );
  }

  async update(id: number, updatePaymentCodeDto: UpdatePaymentCodeDto): Promise<PaymentCodeResponseDto> {
    const paymentCode = await this.paymentCodeRepository.findOne({
      where: { id, deleted_at: null }
    });

    if (!paymentCode) {
      throw new NotFoundException(`Código de pago con ID ${id} no encontrado`);
    }

    // Si se está actualizando el código, verificar que no exista otro con el mismo nombre
    if (updatePaymentCodeDto.code_name && updatePaymentCodeDto.code_name !== paymentCode.code_name) {
      const existingCode = await this.paymentCodeRepository.findOne({
        where: { code_name: updatePaymentCodeDto.code_name }
      });

      if (existingCode) {
        throw new BadRequestException(`El código de pago '${updatePaymentCodeDto.code_name}' ya existe`);
      }
    }

    // Validar fechas de vigencia
    const validFrom = updatePaymentCodeDto.valid_from || paymentCode.valid_from;
    const validUntil = updatePaymentCodeDto.valid_until || paymentCode.valid_until;
    
    if (validFrom && validUntil) {
      const fromDate = new Date(validFrom);
      const untilDate = new Date(validUntil);
      
      if (fromDate >= untilDate) {
        throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
      }
    }

    Object.assign(paymentCode, updatePaymentCodeDto);
    const updatedPaymentCode = await this.paymentCodeRepository.save(paymentCode);
    
    return plainToClass(PaymentCodeResponseDto, updatedPaymentCode, { excludeExtraneousValues: true });
  }

  async remove(id: number): Promise<void> {
    const paymentCode = await this.paymentCodeRepository.findOne({
      where: { id, deleted_at: null }
    });

    if (!paymentCode) {
      throw new NotFoundException(`Código de pago con ID ${id} no encontrado`);
    }

    // Soft delete - marcar como eliminado
    paymentCode.deleted_at = new Date();
    await this.paymentCodeRepository.save(paymentCode);
  }

  async activate(id: number): Promise<PaymentCodeResponseDto> {
    const paymentCode = await this.paymentCodeRepository.findOne({
      where: { id, deleted_at: null }
    });

    if (!paymentCode) {
      throw new NotFoundException(`Código de pago con ID ${id} no encontrado`);
    }

    paymentCode.is_active = true;
    const updatedPaymentCode = await this.paymentCodeRepository.save(paymentCode);
    
    return plainToClass(PaymentCodeResponseDto, updatedPaymentCode, { excludeExtraneousValues: true });
  }

  async deactivate(id: number): Promise<PaymentCodeResponseDto> {
    const paymentCode = await this.paymentCodeRepository.findOne({
      where: { id, deleted_at: null }
    });

    if (!paymentCode) {
      throw new NotFoundException(`Código de pago con ID ${id} no encontrado`);
    }

    paymentCode.is_active = false;
    const updatedPaymentCode = await this.paymentCodeRepository.save(paymentCode);
    
    return plainToClass(PaymentCodeResponseDto, updatedPaymentCode, { excludeExtraneousValues: true });
  }
}
