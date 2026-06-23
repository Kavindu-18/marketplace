import { PipeTransform, BadRequestException } from '@nestjs/common';

// Duck-typed interface so the pipe doesn't need a direct 'zod' import.
// Any Zod schema satisfies this shape.
interface SafeParseSchema {
  safeParse(value: unknown):
    | { success: true; data: unknown }
    | { success: false; error: { format(): unknown } };
}

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: SafeParseSchema) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException(result.error.format());
    }
    return result.data;
  }
}
