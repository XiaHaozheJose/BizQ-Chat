export interface Country {
  code: string
  name: string
  dialCode: string
  flag: string
}

export const countries: Country[] = [
  {
    code: 'ES',
    name: '西班牙',
    dialCode: '+34',
    flag: '🇪🇸',
  },
  {
    code: 'FR',
    name: '法国',
    dialCode: '+33',
    flag: '🇫🇷',
  },
  {
    code: 'DE',
    name: '德国',
    dialCode: '+49',
    flag: '🇩🇪',
  },
  {
    code: 'IT',
    name: '意大利',
    dialCode: '+39',
    flag: '🇮🇹',
  },
  {
    code: 'PT',
    name: '葡萄牙',
    dialCode: '+351',
    flag: '🇵🇹',
  },
  {
    code: 'CN',
    name: '中国',
    dialCode: '+86',
    flag: '🇨🇳',
  },
] 