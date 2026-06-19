import { useCallback } from "react";
import { useTradingStore } from "../stores/tradingStore";
import { derivAPI } from "../services/derivAPI";
import { AccountInfo } from "../types/deriv.types";

export function useAccount() {
  const {
    activeAccount,
    accounts,
    connectionStatus,
    setActiveAccount,
  } = useTradingStore();

  const switchAccount = useCallback((loginid: string) => {
    const targetAccount = accounts.find((acc) => acc.loginid === loginid);
    if (!targetAccount) return;

    // Set as the active account globally
    setActiveAccount(targetAccount);
    
    // Log the account switch
    useTradingStore.getState().addLog(
      "info",
      `Switched trading portfolio console to account ${loginid} (${targetAccount.is_virtual ? "Demo" : "Real"}).`
    );
  }, [accounts, setActiveAccount]);

  const refreshAccountDetails = useCallback(() => {
    // Proactively send a balance inquiry request to fetch the latest values via the live websocket channel
    derivAPI.send({ balance: 1 });
  }, []);

  return {
    activeAccount,
    accounts,
    connectionStatus,
    switchAccount,
    refreshAccountDetails,
    isAuthorized: !!activeAccount,
    isVirtual: activeAccount?.is_virtual ?? false,
    balance: activeAccount?.balance ?? 0,
    currency: activeAccount?.currency ?? "USD",
    loginId: activeAccount?.loginid ?? "",
  };
}
