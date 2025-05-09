import { setPopupIcon } from './../../utils/index';
import { CHAINS_ENUM, CHAINS } from 'consts';
import {
  permissionService,
  keyringService,
  preferenceService,
} from 'background/service';
import providerController from './controller';
import { findChainByEnum } from '@/utils/chain';
import { appIsDev } from '@/utils/env';
import wallet from '../wallet';
import { metamaskModeService } from '@/background/service/metamaskModeService';

const networkIdMap: {
  [key: string]: string;
} = {};

const tabCheckin = ({
  data: {
    params: { name, icon },
  },
  session,
  origin,
}) => {
  session.setProp({ origin, name, icon });
  const site = permissionService.getSite(origin);
  if (site) {
    permissionService.updateConnectSite(origin, { ...site, icon, name }, true);
  }
};

const getProviderState = async (req) => {
  const {
    session: { origin },
  } = req;
  const chainEnum =
    permissionService.getWithoutUpdate(origin)?.chain || CHAINS_ENUM.ETH;
  const isUnlocked = keyringService.memStore.getState().isUnlocked;
  let networkVersion = '1';
  if (networkIdMap[chainEnum]) {
    networkVersion = networkIdMap[chainEnum];
  } else {
    networkVersion = await providerController.netVersion(req);
    networkIdMap[chainEnum] = networkVersion;
  }

  // TODO: should we throw error here?
  let chainItem = findChainByEnum(chainEnum);

  if (!chainItem) {
    if (appIsDev) {
      throw new Error(
        `[internalMethod::getProviderState] chain ${chainEnum} not found`
      );
    } else {
      console.warn(
        `[internalMethod::getProviderState] chain ${chainEnum} not found`
      );
      chainItem = CHAINS.ETH;
    }
  }

  return {
    chainId: chainItem.hex,
    isUnlocked,
    accounts: isUnlocked ? await providerController.ethAccounts(req) : [],
    networkVersion,
  };
};

const providerOverwrite = ({
  data: {
    params: [val],
  },
}) => {
  preferenceService.setHasOtherProvider(val);
  return true;
};

const hasOtherProvider = () => {
  preferenceService.setHasOtherProvider(true);
  const isRabby = preferenceService.getIsDefaultWallet();
  if (wallet.isUnlocked()) {
    setPopupIcon(isRabby ? 'rabby' : 'metamask');
  }
  return true;
};

const isDefaultWallet = ({ origin }) => {
  return preferenceService.getIsDefaultWallet(origin);
};

const getProviderConfig = ({ origin }: { origin: string }) => {
  const rdns = permissionService.getSite(origin)?.rdns;
  const isMetamaskMode = metamaskModeService.checkIsMetamaskMode(origin);
  return {
    rdns,
    isMetamaskMode,
  };
};

const resetProvider = ({ origin }: { origin: string }) => {
  const site = permissionService.getSite(origin);
  if (site) {
    permissionService.setSite({ ...site, rdns: undefined });
  }
};

export default {
  tabCheckin,
  getProviderState,
  providerOverwrite,
  hasOtherProvider,
  isDefaultWallet,
  'rabby:getProviderConfig': getProviderConfig,
  'rabby:resetProvider': resetProvider,
};
