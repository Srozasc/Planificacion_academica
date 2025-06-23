import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BimestresModule } from './bimestres/bimestres.module';
import { CommonModule } from './common/common.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CommonModule,     // Global module providing shared resources
    AuthModule,       // Login and authentication
    BimestresModule,  // Academic semester configuration
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
