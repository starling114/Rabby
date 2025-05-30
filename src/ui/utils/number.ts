import BigNumber from 'bignumber.js';

const Sub_Numbers = '₀₁₂₃₄₅₆₇₈₉';

export const splitNumberByStep = (
  num: number | string,
  step = 3,
  symbol = ',',
  forceInt = false
) => {
  const fmt: BigNumber.Format = {
    decimalSeparator: '.',
    groupSeparator: symbol,
    groupSize: step,
  };
  const n = new BigNumber(num);
  // hide the after-point part if number is more than 1000000
  if (n.isGreaterThan(1000000) || forceInt) {
    return n.decimalPlaces(0).toFormat(fmt);
  }
  return n.toFormat(fmt);
};

export const formatLittleNumber = (num: string, minLen = 8) => {
  const bn = new BigNumber(num);
  if (bn.toFixed().length > minLen) {
    const s = bn.precision(4).toFormat();
    const ss = s.replace(/^0.(0*)?(?:.*)/, (l, z) => {
      const zeroLength = z.length;

      const sub = `${zeroLength}`
        .split('')
        .map((x) => Sub_Numbers[x as any])
        .join('');

      const end = s.slice(zeroLength + 2);
      return `0.0${sub}${end}`;
    });

    return ss;
  }
  return num;
};

export const formatTokenAmount = (
  amount: number | string,
  decimals = 4,
  moreDecimalsWhenNotEnough = false // when number less then 0.0001, auto change decimals to 8
) => {
  if (!amount) return '0';
  const bn = new BigNumber(amount);
  const str = bn.toFixed();
  const split = str.split('.');
  let realDecimals = decimals;
  if (moreDecimalsWhenNotEnough && bn.lt(0.0001) && decimals < 8) {
    realDecimals = 8;
  }
  if (moreDecimalsWhenNotEnough && bn.lt(0.00000001)) {
    return '<0.00000001';
  }
  if (bn.lte(0.0001)) {
    return formatLittleNumber(bn.toFixed());
  }
  if (!split[1] || split[1].length < realDecimals) {
    return splitNumberByStep(bn.toFixed());
  }
  return splitNumberByStep(bn.toFixed(realDecimals));
};

export const numberWithCommasIsLtOne = (
  x?: number | string | BigNumber,
  precision?: number
) => {
  if (x === undefined || x === null) {
    return '-';
  }
  if (x.toString() === '0') return '0';

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  if (x < 0.00005) {
    return '< 0.0001';
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  precision = x < 1 ? 4 : precision ?? 2;
  const parts: string[] = Number(x).toFixed(precision).split('.');

  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

export const formatNumber = (
  num: string | number,
  decimal = 2,
  opt = {} as BigNumber.Format,
  roundingMode = BigNumber.ROUND_HALF_UP as BigNumber.RoundingMode
) => {
  const n = new BigNumber(num);
  const format = {
    prefix: '',
    decimalSeparator: '.',
    groupSeparator: ',',
    groupSize: 3,
    secondaryGroupSize: 0,
    fractionGroupSeparator: ' ',
    fractionGroupSize: 0,
    suffix: '',
    ...opt,
  };
  if (n.isNaN()) {
    return num.toString();
  }
  // hide the after-point part if number is more than 1000000
  if (n.isGreaterThan(1000000)) {
    if (n.gte(1e9)) {
      return `${n.div(1e9).toFormat(decimal, roundingMode, format)}B`;
    }
    return n.decimalPlaces(0).toFormat(format);
  }
  return n.toFormat(decimal, roundingMode, format);
};

export const formatPrice = (price: string | number, len = 4) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  if (price >= 1) {
    return formatNumber(price);
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  if (price < 0.0001) {
    return formatLittleNumber(new BigNumber(price).toFixed(), 6);
  }
  return formatNumber(price, len);
};

export const intToHex = (n: number) => {
  if (n % 1 !== 0) throw new Error(`${n} is not int`);
  return `0x${n.toString(16)}`;
};

export const formatUsdValue = (
  value: string | number,
  roundingMode = BigNumber.ROUND_HALF_UP as BigNumber.RoundingMode
) => {
  const bnValue = new BigNumber(value);
  if (bnValue.lt(0)) {
    return `-$${formatNumber(
      Math.abs(Number(value)),
      2,
      undefined,
      roundingMode
    )}`;
  }
  if (bnValue.gte(0.01) || bnValue.eq(0)) {
    return `$${formatNumber(value, 2, undefined, roundingMode)}`;
  }
  return '<$0.01';
};

export const formatAmount = (amount: string | number, decimals = 4) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  if (amount > 1e9) {
    return `${new BigNumber(amount).div(1e9).toFormat(4)}B`;
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  if (amount > 10000) return formatNumber(amount);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  if (amount > 1) return formatNumber(amount, 4);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  if (amount < 0.0001) {
    const str = new BigNumber(amount).toFixed();
    return formatLittleNumber(str);
  }
  return formatNumber(amount, decimals);
};

export const calcPercent = (
  pre?: number,
  next?: number,
  precision = 2,
  needSign = true
) => {
  const delta = (next || 0) - (pre || 0);
  const percent = pre
    ? ((delta / pre) * 100).toFixed(precision)
    : next
    ? '100.00'
    : '0.00';

  return `${needSign && delta >= 0 ? '+' : ''}${percent}%`;
};

export function coerceInteger(input: any, fallbackInt = 0) {
  const output = parseInt(input, 10);

  if (Number.isNaN(output)) return fallbackInt;

  return output;
}

export function coerceFloat(input: any, fallbackNum = 0) {
  const output = parseFloat(input);

  if (Number.isNaN(output)) return fallbackNum;

  return output;
}

export function isMeaningfulNumber(input: any): input is number {
  return typeof input === 'number' && !Number.isNaN(input);
}

export const formatGasCostUsd = (gasCostUsd: BigNumber) => {
  const bn = gasCostUsd!;
  let value;

  if (bn.gt(1)) {
    value = bn.toFixed(2);
  } else if (bn.gt(0.0001)) {
    value = bn.toFixed(4);
  } else {
    value = '0.0001';
  }

  return formatTokenAmount(value);
};

export const formatGasHeaderUsdValue = (
  value: string | number,
  roundingMode = BigNumber.ROUND_HALF_UP as BigNumber.RoundingMode
) => {
  const bnValue = new BigNumber(value);
  if (bnValue.lt(0)) {
    return `-$${formatNumber(Math.abs(Number(value)))}`;
  }
  if (bnValue.gte(0.01)) {
    return `$${formatNumber(value, 2, undefined, roundingMode)}`;
  }
  if (bnValue.lt(0.0001)) return '<$0.0001';

  return `$${formatNumber(value, 4, undefined, roundingMode)}`;
};

export const formatGasAccountUSDValue = (value: string | number) => {
  const bnValue = new BigNumber(value);
  if (bnValue.lt(0.0001)) return '<$0.0001';
  return `$${formatNumber(value, 4)}`;
};
