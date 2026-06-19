/**
 * ABA Bank / KHQR EMVCo generation utility
 */

export interface KHQRData {
  accountNo: string;
  name: string;
  amount?: string;
  currency?: "840" | "116"; // 840: USD, 116: KHR
  merchantName?: string;
  city?: string;
}

/**
 * Calculates CRC16 for EMVCo strings
 */
function crc16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Formats a tag and value according to EMVCo standard
 */
function formatEMV(tag: string, value: string | object): string {
  let valueStr = "";
  if (typeof value === 'object') {
    for (const [subTag, subValue] of Object.entries(value)) {
      valueStr += formatEMV(subTag, subValue as string);
    }
  } else {
    valueStr = value;
  }
  return tag.padStart(2, '0') + valueStr.length.toString().padStart(2, '0') + valueStr;
}

/**
 * Generates an ABA/KHQR compliant string
 */
export function generateKHQRString(data: KHQRData): string {
  const emvData: Record<string, any> = {
    "00": "01",                   // Payload Indicator
    "01": data.amount ? "12" : "11", // 11: Static, 12: Dynamic
    "38": {                       // Merchant Account Information
      "00": "kh.com.ababank",     // ABA Global ID
      "01": data.accountNo.replace(/\s/g, ''), // Strip spaces for logic
      "02": data.name
    },
    "53": data.currency || "840", // Default to USD
    "58": "KH",                   // KH Country Code
    "59": data.merchantName || "ABA Bank",
    "60": data.city || "Phnom Penh"
  };

  if (data.amount) {
    emvData["54"] = parseFloat(data.amount).toFixed(2);
  }

  let qrString = "";
  for (const [tag, value] of Object.entries(emvData)) {
    qrString += formatEMV(tag, value);
  }

  // Pre-seed for CRC
  qrString += "6304";

  return qrString + crc16(qrString);
}

/**
 * Parses an EMVCo string into a flat object of tags and values
 */
export function parseEMV(str: string): Record<string, string> {
  const result: Record<string, string> = {};
  
  try {
    let i = 0;
    while (i < str.length) {
      if (i + 4 > str.length) break;
      const tag = str.substring(i, i + 2);
      const lengthStr = str.substring(i + 2, i + 4);
      const length = parseInt(lengthStr, 10);
      
      if (isNaN(length)) {
        break;
      }

      // Check if string contains any multi-byte characters that would mess up substring mapping
      // If it doesn't, we can just use substring directly.
      // If it does, we need to carefully extract the bytes.
      let value = str.substring(i + 4, i + 4 + length);
      
      // Attempt to decode ISO-8859-1 garbled text (common in JS QR libraries reading UTF-8 bytes)
      try {
        let isGarbled = false;
        const bytes = new Uint8Array(value.length);
        for (let j = 0; j < value.length; j++) {
          const code = value.charCodeAt(j);
          if (code > 255) {
             isGarbled = false;
             break;
          }
          bytes[j] = code;
          if (code > 127) isGarbled = true;
        }
        if (isGarbled) {
          const decoder = new TextDecoder("utf-8");
          value = decoder.decode(bytes);
        }
      } catch (e) {}

      result[tag] = value;
      i += 4 + length;
    }
  } catch (e) {
    console.error("parseEMV Error", e);
  }
  
  return result;
}

/**
 * Verifies if an EMVCo string has a valid CRC16
 */
export function verifyKHQR(str: string): boolean {
  if (str.length < 4) return false;
  const data = str.slice(0, -4);
  const check = str.slice(-4).toUpperCase();
  // Ensure the CRC section exists "6304"
  if (!data.endsWith("6304")) return false;
  return crc16(data) === check;
}

/**
 * Specifically parses KHQR/ABA data from EMVCo string
 */
export function parseKHQR(str: string): Partial<KHQRData> & { merchantAccount?: Record<string, string>; isValid: boolean; binCode?: string; } {
  try {
    const isValid = verifyKHQR(str);
    const tags = parseEMV(str);
    
    // Parse tags 29, 30, 38 (Merchant Account Info)
    let merchantAccount: Record<string, string> = {};
    let extractedAccountNo = "";
    let extractedBinCode = "";

    const accountTags = ["29", "30", "38"];
    // Iterate through common account info tags
    for (const tag of accountTags) {
      if (tags[tag]) {
        try {
          const parsed = parseEMV(tags[tag]);
          // Merge so that we capture any available sub-tags
          merchantAccount = { ...merchantAccount, ...parsed };

          // VietQR specific extraction:
          // In VietQR, Tag 38 contains sub-tag 01 which is ANOTHER nested EMV string
          if (parsed["00"] && parsed["01"]) {
             // Check if it's VietQR (GUID usually starts with A00000072)
             try {
                const innerParsed = parseEMV(parsed["01"]);
                if (innerParsed["01"]) {
                   extractedAccountNo = innerParsed["01"];
                }
                if (innerParsed["00"]) {
                   extractedBinCode = innerParsed["00"];
                }
             } catch(e) {}
          }

        } catch (e) {
          // ignore parsing error for individual tag
        }
      }
    }

    return {
      isValid,
      accountNo: extractedAccountNo || merchantAccount["01"] || "",
      binCode: extractedBinCode,
      name: tags["59"] || merchantAccount["02"] || "",
      amount: tags["54"],
      currency: tags["53"] as KHQRData["currency"],
      merchantName: tags["59"],
      city: tags["60"],
      merchantAccount
    };
  } catch (e) {
    console.error("KHQR Parse Error", e);
    return { isValid: false };
  }
}
