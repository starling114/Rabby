import { PageHeader } from '@/ui/component';
import { Chain } from '@debank/common';
import { Form, Input, Skeleton } from 'antd';
import React, { ComponentProps, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import IconSearch from 'ui/assets/search.svg';
import {
  CustomTestnetItem,
  TestnetChainWithRpcList,
} from './CustomTestnetItem';
import clsx from 'clsx';
import {
  useDebounce,
  useInfiniteScroll,
  useMemoizedFn,
  useRequest,
} from 'ahooks';
import { intToHex, useWallet } from '@/ui/utils';
import {
  TestnetChain,
  createTestnetChain,
} from '@/background/service/customTestnet';
import { Emtpy } from './Empty';
import { findChain } from '@/utils/chain';
import { id } from 'ethers/lib/utils';
import { TooltipWithMagnetArrow } from '@/ui/component/Tooltip/TooltipWithMagnetArrow';
import { sortBy } from 'lodash';
import { useRPCData } from '../hooks/useRPCData';

const Wraper = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  background-color: var(--r-neutral-bg1, #fff);
  transform: translateX(100%);
  transition: transform 0.3s;
  border-radius: 16px 16px 0px 0px;
  padding: 20px 0 0 0;

  display: flex;
  flex-direction: column;

  .ant-input-affix-wrapper {
    color: var(--r-neutral-foot, #6a7587);
    font-size: 13px;
    font-weight: 400;
    margin-bottom: 20px;
    height: 44px;

    border-radius: 6px;
    background: var(--r-neutral-card1, #fff);
    border: 1px solid var(--r-neutral-line, #d3d8e0);

    .ant-input {
      background-color: transparent;
      color: var(--r-neutral-title1, #192945);
    }

    .anticon {
      color: var(--r-neutral-foot, #6a7587);
    }
  }
  .ant-input-affix-wrapper:focus,
  .ant-input-affix-wrapper-focused {
    border-color: var(--r-blue-default, #7084ff);
  }

  .chain-list-item:not(:last-child)::after {
    position: absolute;
    content: ' ';
    left: 16px;
    right: 16px;
    bottom: 0;
    border-bottom: 0.5px solid var(--r-neutral-line, #d3d8e0);
  }
`;

export const AddFromChainList = ({
  visible,
  onClose,
  className,
  onSelect,
}: {
  visible?: boolean;
  className?: string;
  onClose?: () => void;
  onSelect?: (chain: TestnetChain) => void;
}) => {
  const { t } = useTranslation();
  const wallet = useWallet();
  const [_search, setSearch] = React.useState('');
  const ref = useRef<HTMLDivElement>(null);
  const search = useDebounce(_search, { wait: 500 });

  const { data: logos, runAsync: runFetchLogos } = useRequest(
    () => {
      return wallet.getCustomTestnetLogos();
    },
    {
      cacheKey: 'custom-testnet-logos',
      cacheTime: 30000,
      staleTime: 30000,
    }
  );

  const { loading, data, loadingMore } = useInfiniteScroll<{
    list: TestnetChainWithRpcList[];
    start: number;
    total: number;
  }>(
    async (data) => {
      const res = await wallet.openapi.searchChainList({
        start: data?.start || 0,
        limit: 50,
        q: search,
      });

      return {
        list: res.chain_list.map((item) => {
          const r = createTestnetChain({
            name: item.name,
            id: item.chain_id,
            nativeTokenSymbol: item.native_currency.symbol,
            rpcUrl: item.rpc || '',
            scanLink: item.explorer || '',
          });
          return {
            ...r,
            rpcList: item.rpc_list,
          };
        }),
        start: res.page.start + res.page.limit,
        total: res.page.total,
      };
    },
    {
      isNoMore(data) {
        return !!data && (data.list?.length || 0) >= (data?.total || 0);
      },
      reloadDeps: [search],
      target: ref,
      threshold: 150,
    }
  );

  const { data: usedList, loading: isLoadingUsed } = useRequest(async () => {
    return wallet.getUsedCustomTestnetChainList().then((list) => {
      return sortBy(
        list.map((item) => {
          const res = createTestnetChain({
            name: item.name,
            id: item.chain_id,
            nativeTokenSymbol: item.native_currency.symbol,
            rpcUrl: item.rpc || '',
            scanLink: item.explorer || '',
          });
          return {
            ...res,
            rpcList: item.rpc_list,
          };
        }),
        'name'
      );
    });
  });

  const isLoading = loading || isLoadingUsed;

  const _list = useMemo(() => {
    if (search) {
      return data?.list || [];
    }
    return (data?.list || []).filter((item) => {
      return !usedList?.find((used) => used.id === item.id);
    });
  }, [data?.list, usedList, search]);

  const list = useMemo(() => {
    return _list.map((item) => {
      if (logos?.[item.id]) {
        item.logo = logos?.[item.id].chain_logo_url;
      }
      return item;
    });
  }, [_list, logos]);

  const realUsedList = useMemo(() => {
    return usedList?.map((item) => {
      if (logos?.[item.id]) {
        item.logo = logos?.[item.id].chain_logo_url;
      }
      return item;
    });
  }, [usedList, logos]);

  const isEmpty = useMemo(() => {
    if (isLoading) {
      return false;
    }
    if (search) {
      return !list?.length;
    }
    return !usedList?.length && !list?.length;
  }, [isLoading, search, list, usedList]);

  return (
    <Wraper className={clsx({ 'translate-x-0': visible }, className)}>
      <div className="px-[20px]">
        <PageHeader className="pt-0" forceShowBack onBack={onClose}>
          {t('page.customTestnet.AddFromChainList.title')}
        </PageHeader>
        <Input
          prefix={<img src={IconSearch} />}
          placeholder={t('page.customTestnet.AddFromChainList.search')}
          onChange={(e) => setSearch(e.target.value)}
          value={_search}
          allowClear
        />
      </div>

      {isLoading ? (
        <div className="px-[20px]">
          <div className="rounded-[6px] bg-r-neutral-card2">
            <Loading />
          </div>
        </div>
      ) : isEmpty ? (
        <div className="h-full px-[20px]">
          <div className="h-full rounded-[6px] bg-r-neutral-card2">
            <Emtpy
              description={t('page.customTestnet.AddFromChainList.empty')}
            />
          </div>
        </div>
      ) : (
        <div ref={ref} className="flex-1 overflow-auto px-[20px]">
          {realUsedList?.length && !search ? (
            <div className="mb-[20px]">
              <CustomTestnetList
                list={realUsedList || []}
                onSelect={onSelect}
              />
            </div>
          ) : null}
          <CustomTestnetList
            list={list}
            loading={loading}
            loadingMore={loadingMore}
            onSelect={onSelect}
          />
        </div>
      )}
    </Wraper>
  );
};

const CustomTestnetList = ({
  loadingMore,
  list,
  onSelect,
  className,
}: {
  loading?: boolean;
  loadingMore?: boolean;
  list: TestnetChainWithRpcList[];
  onSelect?: (chain: TestnetChain) => void;
  className?: string;
}) => {
  const { t } = useTranslation();
  const { runAsync } = useRPCData();
  const loadingItemRef = useRef<{ chainId: number | null }>({
    chainId: null,
  });
  const [loadingChainId, setLoadingChainId] = useState<number | null>(null);
  const handleClick = useMemoizedFn(
    async (testnetChain: TestnetChainWithRpcList) => {
      loadingItemRef.current = {
        chainId: testnetChain.id,
      };
      setLoadingChainId(testnetChain.id);
      const sortedRpcList = await runAsync(testnetChain.rpcList || []).catch(
        () => null
      );
      if (loadingItemRef.current.chainId === testnetChain.id) {
        loadingItemRef.current = {
          chainId: null,
        };
        setLoadingChainId(null);
        onSelect?.({
          ...testnetChain,
          rpcUrl: sortedRpcList?.[0]?.url || testnetChain.rpcUrl,
        });
      }
    }
  );
  return (
    <div className="rounded-[6px] bg-r-neutral-card2">
      {list?.map((item) => {
        const chain = findChain({ id: item.id });

        return chain ? (
          <div className="chain-list-item relative" key={item.id + 'tooltip'}>
            <TooltipWithMagnetArrow
              className="rectangle w-[max-content]"
              trigger={['click']}
              align={{
                offset: [0, 30],
              }}
              placement="top"
              title={
                chain?.isTestnet
                  ? t('page.customTestnet.AddFromChainList.tips.added')
                  : t('page.customTestnet.AddFromChainList.tips.supported')
              }
            >
              <CustomTestnetItem item={item} disabled />
            </TooltipWithMagnetArrow>
          </div>
        ) : (
          <CustomTestnetItem
            item={item}
            key={item.id}
            onClick={handleClick}
            className="relative chain-list-item"
            loading={loadingChainId === item.id}
          />
        );
      })}
      {loadingMore ? <Loading /> : null}
    </div>
  );
};

const Loading = () => {
  return (
    <>
      <div className="chain-list-item relative flex items-center px-[16px] py-[11px] gap-[12px] bg-r-neutral-card2 rounded-[6px]">
        <Skeleton.Avatar active />
        <div className="flex flex-col gap-[4px]">
          <Skeleton.Input active className="w-[80px] h-[16px]" />
          <Skeleton.Input active className="w-[145px] h-[14px]" />
        </div>
      </div>
      <div className="chain-list-item relative flex items-center px-[16px] py-[11px] gap-[12px] bg-r-neutral-card2 rounded-[6px]">
        <Skeleton.Avatar active />
        <div className="flex flex-col gap-[4px]">
          <Skeleton.Input active className="w-[80px] h-[16px]" />
          <Skeleton.Input active className="w-[145px] h-[14px]" />
        </div>
      </div>
    </>
  );
};
