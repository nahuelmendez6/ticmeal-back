import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { GlobalExceptionFilter } from './common/filters/global-exception-filter';
import { TenantInterceptor } from './common/interceptors/tenant-interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Ajuste de CORS para Producción
  app.enableCors({
    // Permite localhost para pruebas y agrega la URL de Vercel cuando la tengas
    origin: [
      'http://localhost:5173', 
      /\.vercel\.app$/, // Esto permite cualquier subdominio de Vercel (muy útil para demos)
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter(), new GlobalExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Ticmeal API')
    .setDescription('API documentation for Ticmeal')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));

  app.useGlobalInterceptors(app.get(TenantInterceptor));

  // 2. Escuchar en el host 0.0.0.0 (Requerido por Render)
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0'); 
  
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();