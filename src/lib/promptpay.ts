// Thai PromptPay EMVCo Standard QR Payload Generator

function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

function formatTag(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export function generatePromptPayPayload(target: string, amount?: number): string {
  const sanitized = target.replace(/[^0-9]/g, '');
  let tag29Value = '';

  if (sanitized.length === 10) {
    // Phone number: 0812345678 -> 0066812345678
    const mobileFormatted = '0066' + sanitized.substring(1);
    const sub00 = formatTag('00', 'A000000677010111');
    const sub01 = formatTag('01', mobileFormatted);
    tag29Value = sub00 + sub01;
  } else if (sanitized.length === 13) {
    // National ID / Tax ID
    const sub00 = formatTag('00', 'A000000677010111');
    const sub02 = formatTag('02', sanitized);
    tag29Value = sub00 + sub02;
  } else {
    // Fallback format
    const mobileFormatted = '0066' + sanitized;
    const sub00 = formatTag('00', 'A000000677010111');
    const sub01 = formatTag('01', mobileFormatted);
    tag29Value = sub00 + sub01;
  }

  let payload = '';
  payload += formatTag('00', '01'); // Payload Format Indicator
  payload += formatTag('01', amount ? '12' : '11'); // 11 = Static QR, 12 = Dynamic QR
  payload += formatTag('29', tag29Value); // Merchant Account Information - PromptPay
  payload += formatTag('53', '764'); // Currency: THB
  payload += formatTag('58', 'TH'); // Country Code: TH

  if (amount && amount > 0) {
    const formattedAmount = amount.toFixed(2);
    payload += formatTag('54', formattedAmount);
  }

  // Tag 63: CRC placeholder
  payload += '6304';
  const checksum = crc16(payload);
  return payload + checksum;
}
