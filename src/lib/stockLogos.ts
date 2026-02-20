// Stock/Index/Commodity logo URLs using Google favicon service (reliable, always available)

function googleFavicon(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

// Direct logo overrides for indices and commodities
const LOGO_OVERRIDES: Record<string, string> = {
  // Indian Indices
  "^NSEI": googleFavicon("nseindia.com"),
  "^BSESN": googleFavicon("bseindia.com"),
  // US Indices
  "^GSPC": googleFavicon("spglobal.com"),
  "^DJI": googleFavicon("dowjones.com"),
  "^IXIC": googleFavicon("nasdaq.com"),
  "^RUT": googleFavicon("ftserussell.com"),
  // Europe
  "^FTSE": googleFavicon("londonstockexchange.com"),
  "^GDAXI": googleFavicon("deutsche-boerse.com"),
  "^FCHI": googleFavicon("euronext.com"),
  "^STOXX50E": googleFavicon("stoxx.com"),
  "^IBEX": googleFavicon("bolsamadrid.es"),
  // Asia-Pacific
  "^N225": googleFavicon("jpx.co.jp"),
  "^HSI": googleFavicon("hsi.com.hk"),
  "000001.SS": googleFavicon("sse.com.cn"),
  "^KS11": googleFavicon("krx.co.kr"),
  "^STI": googleFavicon("sgx.com"),
  "^AXJO": googleFavicon("asx.com.au"),
  "^TWII": googleFavicon("twse.com.tw"),
  "^JKSE": googleFavicon("idx.co.id"),
  "^KLSE": googleFavicon("bursamalaysia.com"),
  "^NZ50": googleFavicon("nzx.com"),
  // Americas
  "^BVSP": googleFavicon("b3.com.br"),
  "^MXX": googleFavicon("bmv.com.mx"),
  "^GSPTSE": googleFavicon("tsx.com"),
  // Commodities
  "GC=F": googleFavicon("gold.org"),
  "SI=F": googleFavicon("silverinstitute.org"),
  "CL=F": googleFavicon("opec.org"),
};

// Company domains for logo lookup
const COMPANY_DOMAINS: Record<string, string> = {
  // US stocks
  AAPL: "apple.com", MSFT: "microsoft.com", NVDA: "nvidia.com", AMZN: "amazon.com",
  GOOGL: "google.com", TSLA: "tesla.com", META: "meta.com", NFLX: "netflix.com",
  AMD: "amd.com", INTC: "intel.com", JPM: "jpmorganchase.com", V: "visa.com",
  WMT: "walmart.com", JNJ: "jnj.com", PG: "pg.com", MA: "mastercard.com",
  UNH: "unitedhealthgroup.com", HD: "homedepot.com", DIS: "disney.com", BAC: "bankofamerica.com",
  CRM: "salesforce.com", ADBE: "adobe.com", ORCL: "oracle.com", CSCO: "cisco.com",
  PEP: "pepsico.com", KO: "coca-cola.com", AVGO: "broadcom.com", MRK: "merck.com",
  NKE: "nike.com", PYPL: "paypal.com", QCOM: "qualcomm.com", TXN: "ti.com",
  IBM: "ibm.com", GS: "goldmansachs.com", MS: "morganstanley.com", AXP: "americanexpress.com",
  SBUX: "starbucks.com", CVX: "chevron.com", XOM: "exxonmobil.com",
  LLY: "lilly.com", ABBV: "abbvie.com", TMO: "thermofisher.com",
  NOW: "servicenow.com", UBER: "uber.com", ABNB: "airbnb.com", SPOT: "spotify.com",
  COIN: "coinbase.com", PLTR: "palantir.com", NET: "cloudflare.com", CRWD: "crowdstrike.com",
  // Indian stocks
  RELIANCE: "ril.com", TCS: "tcs.com", INFY: "infosys.com",
  HDFCBANK: "hdfcbank.com", ICICIBANK: "icicibank.com", SBIN: "sbi.co.in",
  LT: "larsentoubro.com", ITC: "itcportal.com",
  AXISBANK: "axisbank.com", KOTAKBANK: "kotak.com",
  BAJFINANCE: "bajajfinance.in", MARUTI: "marutisuzuki.com",
  HCLTECH: "hcltech.com", WIPRO: "wipro.com",
  SUNPHARMA: "sunpharma.com", TITAN: "titan.co.in",
  BHARTIARTL: "airtel.in", ADANIENT: "adani.com",
  TATAMOTORS: "tatamotors.com", TATASTEEL: "tatasteel.com",
  POWERGRID: "powergrid.in", NTPC: "ntpc.co.in",
  HINDALCO: "hindalco.com", ULTRACEMCO: "ultratechcement.com",
  TECHM: "techmahindra.com", ASIANPAINT: "asianpaints.com",
  BAJAJFINSV: "bajajfinserv.in", ONGC: "ongcindia.com",
  COALINDIA: "coalindia.in", DRREDDY: "drreddys.com",
  DIVISLAB: "divislaboratories.com", CIPLA: "cipla.com",
  APOLLOHOSP: "apollohospitals.com", EICHERMOT: "eicher.in",
  NESTLEIND: "nestle.in", HEROMOTOCO: "heromotocorp.com",
  BRITANNIA: "britannia.co.in", INDUSINDBK: "indusind.com",
  HINDUNILVR: "hul.co.in", GRASIM: "grasim.com",
  JSWSTEEL: "jsw.in", VEDL: "vedantalimited.com",
  TATAPOWER: "tatapower.com", ZOMATO: "zomato.com",
  PAYTM: "paytm.com",
};

export function getAssetLogo(symbol: string, type?: string): string | null {
  if (LOGO_OVERRIDES[symbol]) return LOGO_OVERRIDES[symbol];
  
  const clean = symbol.replace(".NS", "").replace(/\^|%5E/g, "");
  
  if (COMPANY_DOMAINS[clean]) {
    return googleFavicon(COMPANY_DOMAINS[clean]);
  }
  
  return null;
}
