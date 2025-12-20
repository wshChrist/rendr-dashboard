import * as crypto from 'crypto';

export class HmacUtil {
  static calculateHMAC(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('base64');
  }

  static verifyHMAC(data: string, signature: string, secret: string): boolean {
    const expectedSignature = this.calculateHMAC(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}
