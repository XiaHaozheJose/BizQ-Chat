export interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  pattern: string;
  example: string;
}

export const countries: Country[] = [
  {
    code: "ES",
    name: "西班牙",
    dialCode: "+34",
    flag: "🇪🇸",
    pattern: "^[67][0-9]{8}$",
    example: "612345678",
  },
  {
    code: "FR",
    name: "法国",
    dialCode: "+33",
    flag: "🇫🇷",
    pattern: "^[1-9][0-9]{8}$",
    example: "123456789",
  },
  {
    code: "DE",
    name: "德国",
    dialCode: "+49",
    flag: "🇩🇪",
    pattern: "^[1-9][0-9]{10}$",
    example: "15123456789",
  },
  {
    code: "IT",
    name: "意大利",
    dialCode: "+39",
    flag: "🇮🇹",
    pattern: "^[3][0-9]{9}$",
    example: "3123456789",
  },
  {
    code: "PT",
    name: "葡萄牙",
    dialCode: "+351",
    flag: "🇵🇹",
    pattern: "^[9][0-9]{8}$",
    example: "912345678",
  },
  {
    code: "CN",
    name: "中国",
    dialCode: "+86",
    flag: "🇨🇳",
    pattern: "^1[3-9][0-9]{9}$",
    example: "13812345678",
  },
];
