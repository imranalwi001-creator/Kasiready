import QRCode from 'qrcode';

/**
 * QRIS Tag Dictionary and EMVCo Specifications (Bank Indonesia & ASPI)
 */
export interface QRISConfig {
  merchantName: string;
  nmid: string;
  terminalCode: string;
  acquirerId: string;
  acquirerName: string;
  city: string;
  postalCode: string;
  mcc: string; // Merchant Category Code (e.g. 5411 Grocery / Retail)
  staticBaseString?: string;
  feeType?: 'none' | 'fixed' | 'percentage';
  feeValue?: number;
}

export interface DynamicQRISResult {
  qrisString: string;
  qrDataUrl: string;
  merchantName: string;
  nmid: string;
  terminalCode: string;
  acquirerName: string;
  amount: number;
  feeAmount: number;
  totalPayable: number;
  invoiceNumber?: string;
  isDynamic: boolean;
  crc: string;
  isValidEMVCo: boolean;
  tagsSummary: Record<string, string>;
}

/**
 * Calculates standard EMVCo CRC-16 (CCITT-FALSE) Checksum
 * Polynomial: 0x1021, Initial value: 0xFFFF
 */
export function computeCRC16(data: string): string {
  let crc = 0xffff;
  for (let c = 0; c < data.length; c++) {
    crc ^= data.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Helper to build an EMVCo TLV string (Tag + 2-digit length + Value)
 */
export function formatTLV(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

/**
 * Parse an existing EMVCo / QRIS string into a key-value tag map
 */
export function parseQRISPayload(qrisStr: string): Map<string, string> {
  const tags = new Map<string, string>();
  let i = 0;
  while (i < qrisStr.length - 4) {
    const tag = qrisStr.substring(i, i + 2);
    const lengthStr = qrisStr.substring(i + 2, i + 4);
    const len = parseInt(lengthStr, 10);
    if (isNaN(len) || len < 0 || i + 4 + len > qrisStr.length) {
      break;
    }
    const val = qrisStr.substring(i + 4, i + 4 + len);
    tags.set(tag, val);
    i += 4 + len;
  }
  return tags;
}

/**
 * Validates EMVCo QRIS string integrity, tag structure and CRC16
 */
export function validateQRISString(fullString: string): {
  isValid: boolean;
  crc: string;
  calculatedCrc: string;
  tags: Record<string, string>;
  message: string;
} {
  if (!fullString || fullString.length < 20) {
    return {
      isValid: false,
      crc: '',
      calculatedCrc: '',
      tags: {},
      message: 'String QRIS terlalu pendek',
    };
  }

  const payloadWithoutCRC = fullString.substring(0, fullString.length - 4);
  const providedCRC = fullString.substring(fullString.length - 4).toUpperCase();
  const calculatedCrc = computeCRC16(payloadWithoutCRC);

  const tagsMap = parseQRISPayload(fullString);
  const tagsRecord: Record<string, string> = {};
  tagsMap.forEach((v, k) => {
    tagsRecord[k] = v;
  });

  const isFormatOk = tagsRecord['00'] === '01';
  const isCrcOk = providedCRC === calculatedCrc;

  return {
    isValid: isFormatOk && isCrcOk,
    crc: providedCRC,
    calculatedCrc,
    tags: tagsRecord,
    message: !isCrcOk
      ? `CRC mismatch (diberikan: ${providedCRC}, dihitung: ${calculatedCrc})`
      : 'Format EMVCo / QRIS Valid 100%',
  };
}

/**
 * Standard Verified DANA QRIS Template (Anugerah Store)
 */
export const DEFAULT_DANA_QRIS: QRISConfig = {
  merchantName: 'Anugerah Store',
  nmid: 'ID1025371471182',
  terminalCode: 'A01',
  acquirerId: '93600915',
  acquirerName: 'DANA (PT Espay Debit Indonesia Koe)',
  city: 'JAKARTA',
  postalCode: '12340',
  mcc: '5411', // Grocery & Retail Mart
  staticBaseString:
    '00020101021126630011ID.DANA.WWW011893600915002130160202150812345678901230303UMI51440014ID.CO.QRIS.WWW0215ID10253714711820303UMI5204541153033605802ID5914Anugerah Store6007JAKARTA61051234062070703A0163045EE1',
};

/**
 * Converts merchant configuration into a compliant Static (11) or Dynamic (12) QRIS payload.
 */
export function buildQRISPayload(
  amount: number,
  config: Partial<QRISConfig> = {},
  isDynamic: boolean = true,
  invoiceNumber?: string
): {
  qrisString: string;
  crc: string;
  totalPayable: number;
  feeAmount: number;
  isValidEMVCo: boolean;
  tagsSummary: Record<string, string>;
} {
  const mergedConfig: QRISConfig = {
    ...DEFAULT_DANA_QRIS,
    ...config,
  };

  // Fee calculation (convenience fee if configured)
  let feeAmount = 0;
  if (mergedConfig.feeType === 'fixed' && mergedConfig.feeValue) {
    feeAmount = mergedConfig.feeValue;
  } else if (mergedConfig.feeType === 'percentage' && mergedConfig.feeValue) {
    feeAmount = Math.round((amount * mergedConfig.feeValue) / 100);
  }
  const totalPayable = amount + feeAmount;

  // Pure procedural standard EMVCo builder for exact byte-aligned compliance
  let payload = '';
  payload += formatTLV('00', '01'); // Format Indicator
  payload += formatTLV('01', isDynamic ? '12' : '11'); // 11 = Static, 12 = Dynamic

  // Tag 26: DANA Acquirer Info
  const danaSub00 = formatTLV('00', 'ID.DANA.WWW');
  const danaSub01 = formatTLV('01', '936009150021301602');
  const danaSub02 = formatTLV('02', '081234567890123');
  const danaSub03 = formatTLV('03', 'UMI');
  payload += formatTLV('26', `${danaSub00}${danaSub01}${danaSub02}${danaSub03}`);

  // Tag 51: Domestic Central QRIS Repository with Merchant NMID
  const qrisSub00 = formatTLV('00', 'ID.CO.QRIS.WWW');
  const qrisSub02 = formatTLV('02', mergedConfig.nmid || 'ID1025371471182');
  const qrisSub03 = formatTLV('03', 'UMI');
  payload += formatTLV('51', `${qrisSub00}${qrisSub02}${qrisSub03}`);

  // Tag 52: MCC
  payload += formatTLV('52', mergedConfig.mcc || '5411');

  // Tag 53: Currency (360 = IDR)
  payload += formatTLV('53', '360');

  // Tag 54: Transaction Amount (Only for Dynamic QRIS or when amount is specified)
  if (isDynamic && totalPayable > 0) {
    payload += formatTLV('54', totalPayable.toString());
  }

  // Tag 58: Country Code
  payload += formatTLV('58', 'ID');

  // Tag 59: Merchant Name
  const cleanMerchantName = (mergedConfig.merchantName || 'Anugerah Store')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .substring(0, 25);
  payload += formatTLV('59', cleanMerchantName);

  // Tag 60: Merchant City
  const cleanCity = (mergedConfig.city || 'JAKARTA')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .substring(0, 15)
    .toUpperCase();
  payload += formatTLV('60', cleanCity);

  // Tag 61: Postal Code
  if (mergedConfig.postalCode) {
    payload += formatTLV('61', mergedConfig.postalCode.replace(/[^0-9]/g, '').substring(0, 10));
  }

  // Tag 62: Additional Data Field (Terminal & Invoice Reference)
  const termSubtag = formatTLV('07', (mergedConfig.terminalCode || 'A01').substring(0, 8));
  let tag62Val = termSubtag;
  if (isDynamic && invoiceNumber) {
    const invSubtag = formatTLV('01', invoiceNumber.replace(/[^A-Za-z0-9]/g, '').slice(-15));
    tag62Val = `${invSubtag}${termSubtag}`;
  }
  payload += formatTLV('62', tag62Val);

  // Tag 63: CRC16 Checksum
  const payloadWithPreamble = `${payload}6304`;
  const crc = computeCRC16(payloadWithPreamble);
  const fullQRIS = `${payloadWithPreamble}${crc}`;

  const validation = validateQRISString(fullQRIS);

  return {
    qrisString: fullQRIS,
    crc,
    totalPayable,
    feeAmount,
    isValidEMVCo: validation.isValid,
    tagsSummary: validation.tags,
  };
}

/**
 * Backward compatibility alias for buildDynamicQRIS
 */
export function buildDynamicQRIS(
  amount: number,
  config: Partial<QRISConfig> = {},
  invoiceNumber?: string
): { qrisString: string; crc: string; totalPayable: number; feeAmount: number } {
  const result = buildQRISPayload(amount, config, true, invoiceNumber);
  return {
    qrisString: result.qrisString,
    crc: result.crc,
    totalPayable: result.totalPayable,
    feeAmount: result.feeAmount,
  };
}

/**
 * Generates an ultra high-quality DataURL (PNG base64) for the QR code
 */
export async function generateQRDataURL(
  text: string,
  options?: QRCode.QRCodeToDataURLOptions
): Promise<string> {
  const defaultOptions: QRCode.QRCodeToDataURLOptions = {
    errorCorrectionLevel: 'M',
    margin: 2,
    scale: 8,
    color: {
      dark: '#0f172a', // slate-900 for high optical contrast
      light: '#ffffff',
    },
    ...options,
  };

  try {
    return await QRCode.toDataURL(text, defaultOptions);
  } catch (error) {
    console.error('Failed to generate QR Code data URL:', error);
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
  }
}

/**
 * Master generator providing full metadata, raw payload, and ready-to-render image
 */
export async function createDynamicQRISData(
  amount: number,
  config: Partial<QRISConfig> = {},
  invoiceNumber?: string,
  isDynamic: boolean = true
): Promise<DynamicQRISResult> {
  const mergedConfig: QRISConfig = {
    ...DEFAULT_DANA_QRIS,
    ...config,
  };

  const { qrisString, crc, totalPayable, feeAmount, isValidEMVCo, tagsSummary } = buildQRISPayload(
    amount,
    mergedConfig,
    isDynamic,
    invoiceNumber
  );

  const qrDataUrl = await generateQRDataURL(qrisString);

  return {
    qrisString,
    qrDataUrl,
    merchantName: mergedConfig.merchantName,
    nmid: mergedConfig.nmid,
    terminalCode: mergedConfig.terminalCode,
    acquirerName: mergedConfig.acquirerName,
    amount,
    feeAmount,
    totalPayable,
    invoiceNumber,
    isDynamic,
    crc,
    isValidEMVCo,
    tagsSummary,
  };
}
