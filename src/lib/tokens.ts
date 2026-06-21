export interface Token {
  symbol: string;
  name: string;
  decimals: number;
  address: {
    testnet: string;
    mainnet: string;
  };
  logoUrl?: string;
}

export const TOKENS: Token[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 7,
    address: {
      testnet: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
      mainnet: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    },
    logoUrl: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png",
  },
  {
    symbol: "XLM",
    name: "Stellar Lumens",
    decimals: 7,
    address: {
      testnet: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
      mainnet: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
    },
    logoUrl: "https://assets.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png",
  },
  {
    symbol: "AQUA",
    name: "Aquarius",
    decimals: 7,
    address: {
      testnet: "CAJGVSXQBQMQJHBPQZTN4EF3GFGCYNBK2OFSQNNM55LXVEGQJHXBVQ",
      mainnet: "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA",
    },
    logoUrl: "https://assets.coingecko.com/coins/images/18794/small/aqua.png",
  },
  {
    symbol: "yXLM",
    name: "Yield XLM",
    decimals: 7,
    address: {
      testnet: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
      mainnet: "GARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55",
    },
  },
];

export function getToken(symbol: string): Token | undefined {
  return TOKENS.find((t) => t.symbol === symbol);
}

export function getTokenAddress(token: Token, network: "testnet" | "mainnet"): string {
  return token.address[network];
}

export function getTokenByAddress(address: string): Token | undefined {
  return TOKENS.find(
    (t) => t.address.testnet === address || t.address.mainnet === address
  );
}
