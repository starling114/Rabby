jest.mock('@/ui/hooks/useEnterPassphraseModal', () => ({
  useEnterPassphraseModal: () => jest.fn(),
}));

jest.mock('@/ui/store', () => ({
  useRabbyDispatch: () => ({
    account: {
      getCurrentAccountAsync: jest.fn(),
    },
  }),
}));

jest.mock('@/ui/utils', () => ({
  useWallet: () => ({}),
}));

jest.mock('ahooks', () => ({
  useMemoizedFn: (fn: unknown) => fn,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('react-router-dom', () => ({
  useHistory: () => ({
    location: {
      pathname: '/mock-path',
    },
    push: jest.fn(),
  }),
}));

import { getCreateAddressSuccessSecondaryAction } from '@/ui/views/AddAddress/useCreateAddress';

describe('getCreateAddressSuccessSecondaryAction', () => {
  it('returns null for created seed phrase success page when backup is disabled', () => {
    expect(
      getCreateAddressSuccessSecondaryAction({
        address: '0xaddress',
        publicKey: '0xpublicKey',
        primaryAction: 'done',
        seedPhrase: 'test seed phrase',
      })
    ).toBeNull();
  });

  it('returns null when success page is in open wallet mode', () => {
    expect(
      getCreateAddressSuccessSecondaryAction({
        publicKey: '0xpublicKey',
        primaryAction: 'open-wallet',
      })
    ).toBeNull();
  });

  it('returns add more action for existing seed phrase success page', () => {
    expect(
      getCreateAddressSuccessSecondaryAction({
        publicKey: '0xpublicKey',
        primaryAction: 'done',
      })
    ).toEqual({
      kind: 'add-more',
      labelKey: 'page.newAddress.addMoreAddressesFromThisSeedPhrase',
    });
  });
});
