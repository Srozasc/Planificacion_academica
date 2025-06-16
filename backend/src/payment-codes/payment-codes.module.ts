import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentCode } from './entities/payment-code.entity';
import { PaymentCodesService } from './services/payment-codes.service';
import { PaymentCodesController } from './controllers/payment-codes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentCode])],
  controllers: [PaymentCodesController],
  providers: [PaymentCodesService],
  exports: [PaymentCodesService],
})
export class PaymentCodesModule {}
