import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableVersioning({
    type: VersioningType.URI, // Add version to out API
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // filter out all unwanted payloads fields
      transform: true, // auto transform the datatypes
    }),
  );
  await app.listen(3000);
}
bootstrap();
