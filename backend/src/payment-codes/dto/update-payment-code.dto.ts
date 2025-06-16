import { PartialType } from '@nestjs/mapped-types';
import { CreatePaymentCodeDto } from './create-payment-code.dto';

export class UpdatePaymentCodeDto extends PartialType(CreatePaymentCodeDto) {}
