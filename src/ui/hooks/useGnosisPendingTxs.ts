import { SafeTransactionItem } from '@rabby-wallet/gnosis-sdk/dist/api';
import { useRequest } from 'ahooks';
import type { Options } from 'ahooks/lib/useRequest/src/types';
import { useWallet } from '../utils';

export const useGnosisPendingTxs = (
  params: { address?: string },
  options?: Options<
    | {
        total: number;
        results: {
          networkId: string;
          txs: SafeTransactionItem[];
        }[];
      }
    | undefined
    | null,
    any[]
  >
) => {
  const { address } = params;
  const wallet = useWallet();
  return useRequest(
    async () => {
      if (address) {
        return wallet.getGnosisAllPendingTxs(address);
      }
    },
    {
      refreshDeps: [address],
      cacheKey: `useGnosisPendingTxs-${address}`,
      cacheTime: 500,
      ...options,
    }
  );
};
