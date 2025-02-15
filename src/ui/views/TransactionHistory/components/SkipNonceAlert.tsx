import { TransactionGroup } from '@/background/service/transactionHistory';
import { useAccount } from '@/ui/store-hooks';
import { intToHex, useWallet } from '@/ui/utils';
import { findChain, findChainByID } from '@/utils/chain';
import { findMaxGasTx } from '@/utils/tx';
import { GasLevel } from '@rabby-wallet/rabby-api/dist/types';
import { useRequest } from 'ahooks';
import { flatten, maxBy } from 'lodash';
import React from 'react';
import { Trans } from 'react-i18next';
import styled from 'styled-components';
import IconWarning from 'ui/assets/signature-record/warning.svg';

const Warper = styled.div`
  margin-bottom: 16px;

  .alert-detail {
    display: flex;
    align-items: start;
    padding: 8px 12px 8px 8px;
    border-radius: 6px;
    border: 0.5px solid var(--r-orange-default, #ffb020);
    border: 1px solid var(--r-orange-default, #ffb020);
    background: var(--r-orange-light, rgba(255, 176, 32, 0.15));
    gap: 6px;

    &:not(:last-child) {
      margin-bottom: 12px;
    }

    &-content {
      color: var(--r-neutral-title-1, #192945);
      font-size: 13px;
      font-weight: 400;
      line-height: 18px; /* 138.462% */

      .link {
        color: var(--r-blue-default, #7084ff);
        text-decoration-line: underline;
        cursor: pointer;
      }
    }
  }
`;

const SkipAlertDetail = ({
  data,
  onSubmitTx,
}: {
  data: { nonce: number; chainId: number };
  onSubmitTx?: (item: { nonce: number; chainId: number }) => void;
}) => {
  const chain = findChainByID(data.chainId);
  const nonce = data.nonce;
  const chainName = chain?.name || 'Unknown';

  return (
    <div className="alert-detail">
      <img src={IconWarning} alt="" />
      <div className="alert-detail-content">
        <Trans
          i18nKey="page.activities.signedTx.SkipNonceAlert.alert"
          values={{
            nonce: data.nonce,
            chainName: chain?.name || 'Unknown',
          }}
          nonce={data.nonce}
          chainName={chainName}
        >
          Nonce #{{ nonce }} skipped on {{ chainName }} chain. This may cause
          pending transactions ahead.{' '}
          <span
            className="link"
            onClick={() => {
              onSubmitTx?.(data);
            }}
          >
            Submit a tx
          </span>{' '}
          on chain to resolve
        </Trans>
      </div>
    </div>
  );
};

export const SkipNonceAlert = ({
  pendings,
}: {
  pendings: TransactionGroup[];
}) => {
  const [account] = useAccount();
  const wallet = useWallet();

  const { data } = useRequest(
    async () => {
      if (!account?.address || !pendings.length) {
        return;
      }
      const res = await wallet.getSkipedTxs(account?.address);
      return flatten(Object.values(res));
    },
    {
      refreshDeps: [account?.address, pendings],
    }
  );

  const handleOnChainCancel = async (item: {
    chainId: number;
    nonce: number;
  }) => {
    const chain = findChain({
      id: item.chainId,
    });
    if (!chain) {
      throw new Error('chainServerId not found');
    }
    const gasLevels: GasLevel[] = chain.isTestnet
      ? await wallet.getCustomTestnetGasMarket({
          chainId: chain.id,
        })
      : await wallet.gasMarketV2({
          chainId: chain.serverId,
        });
    const maxGasMarketPrice = maxBy(gasLevels, (level) => level.price)!.price;
    await wallet.sendRequest({
      method: 'eth_sendTransaction',
      params: [
        {
          from: account?.address,
          to: account?.address,
          gasPrice: intToHex(maxGasMarketPrice),
          value: '0x0',
          chainId: item.chainId,
          nonce: intToHex(item.nonce),
          isCancel: true,
          // reqId: maxGasTx.reqId,
        },
      ],
    });
    window.close();
  };

  if (!data?.length) {
    return null;
  }

  return (
    <Warper>
      {data?.map((item) => {
        return (
          <SkipAlertDetail
            key={item.nonce}
            data={item}
            onSubmitTx={handleOnChainCancel}
          />
        );
      })}
    </Warper>
  );
};
