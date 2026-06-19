import { useEffect, useCallback } from "react";
import { useTradingStore } from "../stores/tradingStore";
import { derivAPI } from "../services/derivAPI";

export function useDerivWS() {
  const { appId, token, selectedSymbol, timeframe } = useTradingStore();

  // Send helpers linked to central service
  const sendWS = useCallback((msg: any) => {
    derivAPI.send(msg);
  }, []);

  // Fetch contract proposals
  const requestProposal = useCallback((config: any) => {
    derivAPI.send({
      proposal: 1,
      subscribe: 1,
      amount: config.amount || 10,
      basis: config.basis || "stake",
      contract_type: config.contractType || "CALL",
      currency: config.currency || "USD",
      duration: config.duration || 5,
      duration_unit: config.durationUnit || "t",
      symbol: selectedSymbol.symbol,
      ...(config.barrier !== undefined && { barrier: config.barrier }),
      ...(config.barrier2 !== undefined && { barrier2: config.barrier2 }),
    });
  }, [selectedSymbol]);

  // Execute buy contract
  const buyContract = useCallback((proposalId: string, price: number) => {
    derivAPI.send({
      buy: proposalId,
      price: price || 10,
    });
  }, []);

  // Re-connect when credentials change
  useEffect(() => {
    derivAPI.connect(appId, token);
  }, [appId, token]);

  // Handle symbol or timeframe change sub trigger
  useEffect(() => {
    // Calling connect again will trigger fresh connect or re-evaluate market subscriptions
    derivAPI.connect(appId, token);
  }, [selectedSymbol.symbol, timeframe, appId, token]);

  return {
    sendWS,
    requestProposal,
    buyContract,
  };
}
