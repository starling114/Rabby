import React, { lazy, Suspense, useCallback, useEffect } from 'react';
import {
  HashRouter as Router,
  Route,
  useHistory,
  useLocation,
} from 'react-router-dom';
import { getUiType, useWallet, WalletProvider } from 'ui/utils';
import { PrivateRoute } from 'ui/component';
import Dashboard from './Dashboard';
import Unlock from './Unlock';
import SortHat from './SortHat';
import eventBus from '@/eventBus';
import { EVENTS } from '@/constant';
import { useIdleTimer } from 'react-idle-timer';
import { useRabbyDispatch, useRabbySelector } from '../store';
import { useMount } from 'react-use';
import { useMemoizedFn } from 'ahooks';
import { useThemeModeOnMain } from '../hooks/usePreference';
import { useSubscribeCurrentAccountChanged } from '../hooks/backgroundState/useAccount';
import { ForgotPassword } from './ForgotPassword/ForgotPassword';
const AsyncMainRoute = lazy(() => import('./MainRoute'));
const isTab = getUiType().isTab;

const useAutoLock = () => {
  const history = useHistory();
  const location = useLocation();
  const wallet = useWallet();
  const autoLockTime = useRabbySelector(
    (state) => state.preference.autoLockTime
  );

  const dispatch = useRabbyDispatch();

  useMount(() => {
    dispatch.preference.getPreference('autoLockTime').then((v) => {
      if (v) {
        wallet.setLastActiveTime();
      }
    });
  });

  useIdleTimer({
    onAction() {
      if (autoLockTime > 0 && location.pathname !== '/cud34e32e-unlock') {
        wallet.setLastActiveTime();
      }
    },
    throttle: 1000,
  });

  const listener = useMemoizedFn(() => {
    if (location.pathname !== '/cud34e32e-unlock') {
      if (isTab) {
        history.replace(
          `/no-address?from=${encodeURIComponent(
            location.pathname + location.search
          )}`
        );
      } else {
        history.push('/no-address');
      }
    }
  });

  useEffect(() => {
    eventBus.addEventListener(EVENTS.LOCK_WALLET, listener);
    return () => {
      eventBus.removeEventListener(EVENTS.LOCK_WALLET, listener);
    };
  }, [listener]);
};

const Main = () => {
  useAutoLock();
  useThemeModeOnMain();
  useSubscribeCurrentAccountChanged();

  return (
    <>
      <Route exact path="/">
        <SortHat />
      </Route>

      <Route exact path="/cud34e32e-unlock">
        <Unlock />
      </Route>

      <Route exact path="/forgot-password">
        <ForgotPassword />
      </Route>

      <PrivateRoute exact path="/dashboard">
        <Dashboard />
      </PrivateRoute>
      <Suspense fallback={null}>
        <AsyncMainRoute />
      </Suspense>
    </>
  );
};

const App = ({ wallet }: { wallet: any }) => {
  return (
    <WalletProvider wallet={wallet}>
      <Router>
        <Main />
      </Router>
    </WalletProvider>
  );
};

export default App;
