import { useEffect, useRef } from "react";
import { useTradingStore } from "../stores/tradingStore";
import { derivAPI } from "../services/derivAPI";
import { ActivePosition, TickData } from "../types/deriv.types";
import { NotificationManager } from "../utils/notifier";

interface SimTrade {
  contractId: number;
  botId: string;
  symbol: string;
  contractType: string;
  stake: number;
  entrySpot: number;
  durationTicks: number;
  ticksElapsed: number;
  targetDigit?: number;
  payout: number;
  isReal?: boolean;
}

export function useBotOrchestrator() {
  const {
    bots,
    activeAccount,
    ticks,
    candles,
    indicators,
    recentDigits,
    digitFrequency,
    updateBotStats,
    addBotLog,
    addLog,
    addPosition,
    updatePosition,
    closePosition,
    dailyLossLimit,
    takeProfitGoal
  } = useTradingStore();

  const activeSimTradesRef = useRef<Record<number, SimTrade>>({});
  const analyzingRef = useRef<Record<string, boolean>>({});
  const cooldownRef = useRef<Record<string, number>>({}); // tracks last transaction completed timestamp (or ticks)
  const lastLiveTickTimeRef = useRef<Record<string, number>>({});

  // Subscribes and listens to central websocket messages
  useEffect(() => {
    const handleWebSocketMessage = (data: any) => {
      const msgType = data.msg_type;

      // Real broker proposal message intercepted
      if (msgType === "proposal" && data.echo_req?.passthrough?.bot_id) {
        const pBotId = data.echo_req.passthrough.bot_id;
        const bot = bots.find(b => b.id === pBotId);
        
        if (bot && bot.isRunning) {
          const proposalId = data.proposal.id;
          const askPrice = data.proposal.ask_price;
          
          updateBotStats(pBotId, { phase: "buying" });
          addBotLog(pBotId, `API PROPOSAL LOCKED: ID ${proposalId} | Buy Premium: $${askPrice}. Initiating purchase strike...`);
          
          derivAPI.send({
            buy: proposalId,
            price: askPrice,
            passthrough: {
              bot_id: pBotId,
              contract_type: data.echo_req.passthrough.contract_type,
              duration_ticks: data.echo_req.passthrough.duration_ticks,
              target_digit: data.echo_req.passthrough.target_digit,
              stake: data.echo_req.passthrough.stake,
              symbol: data.echo_req.symbol
            }
          });
        }
      }

      // Real broker contract purchase confirm intercepted
      if (msgType === "buy" && data.echo_req?.passthrough?.bot_id) {
        const pBotId = data.echo_req.passthrough.bot_id;
        const bot = bots.find(b => b.id === pBotId);
        if (bot && bot.isRunning) {
          const contractId = data.buy.contract_id;
          const buyPrice = data.buy.buy_price;
          
          updateBotStats(pBotId, { phase: "trading" });
          addBotLog(pBotId, `API STRIKE ACCUMULATED: Bought Option Contract ID ${contractId} for $${buyPrice}. Tracking active...`);
          
          const trackedSymbol = data.echo_req.passthrough.symbol || bot.symbol;

          activeSimTradesRef.current[contractId] = {
            contractId,
            botId: pBotId,
            symbol: trackedSymbol,
            contractType: data.echo_req.passthrough.contract_type,
            stake: buyPrice,
            entrySpot: parseFloat(data.buy.start_val || "0"),
            durationTicks: data.echo_req.passthrough.duration_ticks || 5,
            ticksElapsed: 0,
            targetDigit: data.echo_req.passthrough.target_digit,
            payout: parseFloat(data.buy.payout || "0") || (buyPrice * 2),
            isReal: true
          };

          const activePos: ActivePosition = {
            contract_id: contractId,
            symbol: trackedSymbol,
            display_name: `${bot.name} (Live)`,
            contract_type: data.echo_req.passthrough.contract_type as any,
            buy_price: buyPrice,
            entry_spot: parseFloat(data.buy.start_val || "0"),
            current_spot: parseFloat(data.buy.start_val || "0"),
            payout: parseFloat(data.buy.payout || "0") || (buyPrice * 2),
            profit: 0,
            date_expiry: Date.now() + 5000,
            status: "open",
          };
          addPosition(activePos);
          NotificationManager.send(
            "LIVE CONTRACT EXECUTED",
            `Bot "${bot.name}" successfully bought ${data.echo_req.passthrough.contract_type} on ${trackedSymbol} [ID: ${contractId}] @ $${buyPrice}`,
            "success"
          );
        }
      }

      // Live contract updating and expiration telemetry
      if (msgType === "proposal_open_contract") {
        const poc = data.proposal_open_contract;
        if (poc) {
          const sim = activeSimTradesRef.current[poc.contract_id];
          if (sim && sim.isReal) {
            const currentSpot = parseFloat(poc.current_spot || "0");
            const profitVal = parseFloat(poc.profit || "0");
            
            updatePosition({
              contract_id: poc.contract_id,
              current_spot: currentSpot,
              profit: profitVal,
            } as ActivePosition);
            
            if (poc.is_expired) {
              const won = profitVal > 0;
              const pAndL = profitVal;
              
              const bot = bots.find(b => b.id === sim.botId);
              if (bot) {
                const nextTradesCount = bot.tradesCount + 1;
                const nextWinCount = bot.winCount + (won ? 1 : 0);
                const nextProfit = Number((bot.profit + pAndL).toFixed(2));
                
                let nextStake = bot.stake;
                if (!won) {
                  const mult = bot.config.multiplier || 2.2;
                  nextStake = Number((sim.stake * mult).toFixed(2));
                  if (nextStake > bot.maxStake) {
                    nextStake = bot.maxStake;
                    addBotLog(bot.id, `MARTINGALE HIGHEST STAKE HIT. Max configured: $${bot.maxStake}`);
                  }
                } else {
                  nextStake = (bot.config as any).baseStake || bot.stake;
                }

                updateBotStats(bot.id, {
                  tradesCount: nextTradesCount,
                  winCount: nextWinCount,
                  profit: nextProfit,
                  stake: nextStake,
                  phase: "cooldown"
                });

                addBotLog(bot.id, `LIVE POSITION RETIRED [ID: ${poc.contract_id}]. STATUS: ${won ? "WON" : "LOST"} | P/L: $${pAndL >= 0 ? "+" : ""}${pAndL.toFixed(2)}`);
                addLog(won ? "success" : "error", `Bot ${bot.name} live option closed. P/L: $${pAndL >= 0 ? "+" : ""}${pAndL.toFixed(2)}`);

                NotificationManager.send(
                  won ? "LIVE TRADE WON 📈" : "LIVE TRADE LOST 📉",
                  `Bot "${bot.name}" contract expired ${won ? "WON" : "LOST"}. Net: $${pAndL >= 0 ? "+" : ""}${pAndL.toFixed(2)}`,
                  won ? "success" : "error"
                );

                if (nextProfit <= -bot.stopLoss) {
                  updateBotStats(bot.id, { isRunning: false, phase: "idle" });
                  addBotLog(bot.id, `CRITICAL STOP LOSS FLOOR HIT (-$${bot.stopLoss}). Halting active bot execution.`);
                  NotificationManager.send(
                    "CRITICAL STOP LOSS TRIGGERED",
                    `Bot "${bot.name}" hit individual stop loss of -$${bot.stopLoss}! Halting agent execution.`,
                    "error"
                  );
                } else if (nextProfit >= bot.profitTarget) {
                  updateBotStats(bot.id, { isRunning: false, phase: "idle" });
                  addBotLog(bot.id, `TAKE PROFIT TARGET COMPLETED (+$${bot.profitTarget}). Deactivating.`);
                  NotificationManager.send(
                    "PROFIT GOAL COMPLETED! 🎉",
                    `Bot "${bot.name}" reached live profit target of +$${bot.profitTarget}! Safe lockdown completed.`,
                    "success"
                  );
                }
              }

              closePosition(poc.contract_id, pAndL);
              delete activeSimTradesRef.current[poc.contract_id];
              cooldownRef.current[sim.botId] = Date.now();
            }
          }
        }
      }

      // Broker API error diagnostics handling
      if (data.error && data.echo_req?.passthrough?.bot_id) {
        const errBotId = data.echo_req.passthrough.bot_id;
        updateBotStats(errBotId, { phase: "cooldown" });
        addBotLog(errBotId, `BROKER ERROR REJECTION: ${data.error.message || "Invalid contract configuration request."}`);
        addLog("error", `Algotrade Error: ${data.error.message}`);
        cooldownRef.current[errBotId] = Date.now();
      }

      if (msgType === "tick" || msgType === "ohlc") {
        const isOHLC = msgType === "ohlc";
        const ohlc = data.ohlc;
        const tick = data.tick;
        if (isOHLC && !ohlc) return;
        if (!isOHLC && !tick) return;
        
        const symbol = isOHLC ? ohlc.symbol : tick.symbol;
        const quote = isOHLC ? parseFloat(ohlc.close) : tick.quote;
        const tickTime = isOHLC ? ohlc.epoch : tick.epoch;

        // Save last live tick timestamp for this asset
        lastLiveTickTimeRef.current[symbol] = Date.now();

        // 1. Tick update on simulated positions (Skip real trades, as real trades are processed via proposal_open_contract)
        (Object.values(activeSimTradesRef.current) as SimTrade[]).forEach((sim) => {
          if (sim.symbol === symbol && !sim.isReal) {
            sim.ticksElapsed += 1;
            
            // Sync with live store positions
            const currentDecimals = isOHLC ? 4 : (tick.pip_size || 4);
            const quoteStr = quote.toFixed(currentDecimals);
            const lastDigit = parseInt(quoteStr.charAt(quoteStr.length - 1), 10);

            // Update in-flight visual progress
            const posToUpdate: Partial<ActivePosition> = {
              contract_id: sim.contractId,
              current_spot: quote,
            };
            updatePosition(posToUpdate as ActivePosition);

            // Check if duration expired
            if (sim.ticksElapsed >= sim.durationTicks) {
              const won = evaluateContractWin(sim.contractType, sim.entrySpot, quote, lastDigit, sim.targetDigit);
              const pAndL = won ? Number((sim.payout - sim.stake).toFixed(2)) : -sim.stake;

              // Update the target bot
              const bot = bots.find((b) => b.id === sim.botId);
              if (bot) {
                const nextTradesCount = bot.tradesCount + 1;
                const nextWinCount = bot.winCount + (won ? 1 : 0);
                const nextProfit = Number((bot.profit + pAndL).toFixed(2));

                // Money management (Martingale Scaling)
                let nextStake = bot.stake;
                if (!won) {
                  const mult = bot.config.multiplier || 2.2;
                  nextStake = Number((sim.stake * mult).toFixed(2));
                  if (nextStake > bot.maxStake) {
                    nextStake = bot.maxStake;
                    addBotLog(bot.id, `MARTINGALE HIGH CEILING WARNING. Capped at max stake: $${bot.maxStake}`);
                  }
                } else {
                  // Revert to user's initial base stake (saved on start)
                  nextStake = (bot.config as any).baseStake || bot.stake;
                }

                // Apply updates to the bot
                updateBotStats(sim.botId, {
                  tradesCount: nextTradesCount,
                  winCount: nextWinCount,
                  profit: nextProfit,
                  stake: nextStake,
                  phase: "cooldown",
                  config: { ...bot.config, multiplier: bot.config.multiplier || 2.2, durationTicks: sim.durationTicks },
                });

                // Logs and events telemetry
                addBotLog(
                  sim.botId,
                  `POSITION EXPIRED [ID: ${sim.contractId}]. OUTCOME: ${
                    won ? "WON" : "LOST"
                  } | spot: ${quote} | P/L: $${pAndL >= 0 ? "+" : ""}${pAndL.toFixed(2)}`
                );
                 addLog(
                   won ? "success" : "error",
                   `Bot ${bot.name} ${won ? "WON" : "LOST"} trade. P/L: $${pAndL >= 0 ? "+" : ""}${pAndL.toFixed(2)}`
                 );

                 NotificationManager.send(
                   won ? "SIMULATED TRADE WON 📈" : "SIMULATED TRADE LOST 📉",
                   `Bot "${bot.name}" simulated contract expired ${won ? "WON" : "LOST"}. Net: $${pAndL >= 0 ? "+" : ""}${pAndL.toFixed(2)}`,
                   won ? "success" : "error"
                 );

                 // Update virtual/real account balance inside store
                 if (activeAccount) {
                   useTradingStore.setState((state) => {
                     const updatedAcc = state.activeAccount
                       ? { ...state.activeAccount, balance: Number((state.activeAccount.balance + pAndL).toFixed(2)) }
                       : null;
                     return { activeAccount: updatedAcc };
                   });
                 }

                 // Check safety limit circuit breakers
                 if (nextProfit <= -bot.stopLoss) {
                   updateBotStats(bot.id, { isRunning: false, phase: "idle" });
                   addBotLog(bot.id, `CRITICAL STOP LOSS OVERRIDE LIMIT HIT (-$${bot.stopLoss}). Deactivating agent triggers.`);
                   addLog("warning", `Circuit Breaker: ${bot.name} deactivated. Stop loss exceeded.`);
                   NotificationManager.send(
                     "STOP LOSS LIMIT HIT",
                     `Bot "${bot.name}" hit simulation stop loss of -$${bot.stopLoss}! Stopped.`,
                     "warn"
                   );
                 } else if (nextProfit >= bot.profitTarget) {
                   updateBotStats(bot.id, { isRunning: false, phase: "idle" });
                   addBotLog(bot.id, `TAKE PROFIT TARGET COMPLETED (+$${bot.profitTarget}). Safety saving locked. Deactivating agent.`);
                   addLog("success", `System Profit Target reached for ${bot.name}. Safe lockdown activated!`);
                   NotificationManager.send(
                     "PROFIT TARGET REACHED! 🎉",
                     `Bot "${bot.name}" matched its profit target of +$${bot.profitTarget}! Safe lockdown activated.`,
                     "success"
                   );
                 }
              }

              // Finalize and clear simulation trackers
              closePosition(sim.contractId, pAndL);
              delete activeSimTradesRef.current[sim.contractId];
              cooldownRef.current[sim.botId] = Date.now(); // Record latest block cooldown
            }
          }
        });

        // 2. Dispatch cognitive logic check on active running bots
        bots.forEach((bot) => {
          if (!bot.isRunning) return;

          // Check main dashboard circuit breakers
          const totalProfit = bot.profit;
          if (totalProfit <= -dailyLossLimit) {
            updateBotStats(bot.id, { isRunning: false, phase: "idle" });
            addBotLog(bot.id, `SYSTEM PROTOCOL: Daily portfolio total loss ceiling exceeded (-$${dailyLossLimit}). Stopped.`);
            addLog("warning", `System halted ${bot.name} to preserve capital.`);
            NotificationManager.send(
              "PORTFOLIO LOSS CEILING HIT ⚠️",
              `Bot "${bot.name}" has been stopped. The portfolio loss matched the daily floor of -$${dailyLossLimit}.`,
              "warn"
            );
            return;
          }
          if (totalProfit >= takeProfitGoal) {
            updateBotStats(bot.id, { isRunning: false, phase: "idle" });
            addBotLog(bot.id, `SYSTEM PROTOCOL: Daily take profit goal attained (+$${takeProfitGoal}). Safe shutoff.`);
            addLog("success", `Take profit completed. Halted ${bot.name} safely.`);
            NotificationManager.send(
              "TAKE PROFIT TARGET ACHIEVED! 🏆",
              `Bot "${bot.name}" stopped. Daily target profit goal of +$${takeProfitGoal} completed successfully!`,
              "success"
            );
            return;
          }

          // Verify if bot is already active in a trade or currently waiting for AI analysis results
          const isBotTrading = (Object.values(activeSimTradesRef.current) as SimTrade[]).some((t) => t.botId === bot.id);
          const isAnalyzing = analyzingRef.current[bot.id];
          if (isBotTrading || isAnalyzing) return;

          // Enforce a cool downtime between consecutive contracts to avoid flash spam
          const lastCompleted = cooldownRef.current[bot.id] || 0;
          if (Date.now() - lastCompleted < 10000) {
            return; // 10s minimum cooldown spacing
          }

          // Trigger AI Analyzer Proxy
          triggerAIAnalysis(bot, quote);
        });
      }
    };

    const unsubscribe = derivAPI.addMessageListener(handleWebSocketMessage);
    return () => unsubscribe();
  }, [bots, activeAccount, candles, indicators, recentDigits, digitFrequency, dailyLossLimit, takeProfitGoal]);

  // Evaluates standard Binary contracts win requirements
  const evaluateContractWin = (type: string, entry: number, exit: number, exitLastDigit: number, targetDigit?: number): boolean => {
    switch (type) {
      case "CALL":
        return exit > entry;
      case "PUT":
        return exit < entry;
      case "DIGITDIFF":
        return targetDigit !== undefined ? exitLastDigit !== targetDigit : true;
      case "DIGITMATCH":
        return targetDigit !== undefined ? exitLastDigit === targetDigit : false;
      case "DIGITEVEN":
        return exitLastDigit % 2 === 0;
      case "DIGITODD":
        return exitLastDigit % 2 !== 0;
      case "DIGITOVER":
        return targetDigit !== undefined ? exitLastDigit > targetDigit : false;
      case "DIGITUNDER":
        return targetDigit !== undefined ? exitLastDigit < targetDigit : false;
      default:
        return exit > entry;
    }
  };

  // Fallback simulator for running bots to ensure they receive ticks when the feed is on another asset or connection is quiet.
  useEffect(() => {
    const interval = setInterval(() => {
      const activeBots = bots.filter(b => b.isRunning);
      if (activeBots.length === 0) return;

      activeBots.forEach((bot) => {
        // Find if this bot's symbol has received a live websocket tick/ohlc recently
        const lastTickTime = lastLiveTickTimeRef.current[bot.symbol] || 0;
        const receivesLiveTicks = Date.now() - lastTickTime < 6000;
        if (receivesLiveTicks) {
          // Skip simulating background ticks/analysis for this bot's symbol, because the central websocket is actively streaming live data for it!
          return;
        }

        // Find if this bot has a simulated trade in progress
        const activeSimTrade = (Object.values(activeSimTradesRef.current) as SimTrade[]).find((t) => t.botId === bot.id);
        
        if (activeSimTrade) {
          // Tick forward
          activeSimTrade.ticksElapsed += 1;
          
          // Small random walk around entry price
          const multiplier = Math.random() > 0.5 ? 1 : -1;
          const fluctuation = Math.random() * 0.15 * multiplier;
          const dummyCurrentSpot = Number((activeSimTrade.entrySpot + fluctuation).toFixed(3));
          
          // Last digit generator
          const exitLastDigit = Math.floor(Math.random() * 10);
          
          const posToUpdate: Partial<ActivePosition> = {
            contract_id: activeSimTrade.contractId,
            current_spot: dummyCurrentSpot,
          };
          updatePosition(posToUpdate as ActivePosition);

          if (activeSimTrade.ticksElapsed >= activeSimTrade.durationTicks) {
            const won = evaluateContractWin(
              activeSimTrade.contractType,
              activeSimTrade.entrySpot,
              dummyCurrentSpot,
              exitLastDigit,
              activeSimTrade.targetDigit
            );

            const pAndL = won ? Number((activeSimTrade.payout - activeSimTrade.stake).toFixed(2)) : -activeSimTrade.stake;
            const nextTradesCount = bot.tradesCount + 1;
            const nextWinCount = won ? bot.winCount + 1 : bot.winCount;
            const nextProfit = Number((bot.profit + pAndL).toFixed(2));
            const nextStake = (bot.config as any).baseStake || bot.stake;

            updateBotStats(bot.id, {
              tradesCount: nextTradesCount,
              winCount: nextWinCount,
              profit: nextProfit,
              stake: nextStake,
            });

            addBotLog(
              bot.id,
              `POSITION EXPIRED [ID: ${activeSimTrade.contractId}]. OUTCOME: ${won ? "WON" : "LOST"} | spot: ${dummyCurrentSpot} | P/L: $${pAndL >= 0 ? "+" : ""}${pAndL.toFixed(2)}`
            );
            addLog(
              won ? "success" : "error",
              `Bot ${bot.name} ${won ? "WON" : "LOST"} trade. P/L: $${pAndL >= 0 ? "+" : ""}${pAndL.toFixed(2)}`
            );

            // Update virtual/real account balance inside store
            if (activeAccount) {
              useTradingStore.setState((state) => {
                const updatedAcc = state.activeAccount
                  ? { ...state.activeAccount, balance: Number((state.activeAccount.balance + pAndL).toFixed(2)) }
                  : null;
                return { activeAccount: updatedAcc };
              });
            }

            // Check safety limit circuit breakers
            if (nextProfit <= -bot.stopLoss) {
              updateBotStats(bot.id, { isRunning: false });
              addBotLog(bot.id, `CRITICAL STOP LOSS OVERRIDE LIMIT HIT (-$${bot.stopLoss}). Deactivating agent triggers.`);
              addLog("warning", `Circuit Breaker: ${bot.name} deactivated. Stop loss exceeded.`);
            } else if (nextProfit >= bot.profitTarget) {
              updateBotStats(bot.id, { isRunning: false });
              addBotLog(bot.id, `TAKE PROFIT TARGET COMPLETED (+$${bot.profitTarget}). Safety saving locked. Deactivating agent.`);
              addLog("success", `System Profit Target reached for ${bot.name}. Safe lockdown activated!`);
            }

            closePosition(activeSimTrade.contractId, pAndL);
            delete activeSimTradesRef.current[activeSimTrade.contractId];
            cooldownRef.current[bot.id] = Date.now();
          }
        } else {
          // No trade in progress, check triggers
          const isAnalyzing = analyzingRef.current[bot.id];
          if (isAnalyzing) return;

          // Enforce cooldown spacing
          const lastCompleted = cooldownRef.current[bot.id] || 0;
          if (Date.now() - lastCompleted < 10000) {
            return;
          }

          // Choose a realistic base price
          const baseSpot = bot.symbol === "R_100" ? 1200 + Math.random() * 50 : 850 + Math.random() * 30;
          triggerAIAnalysis(bot, Number(baseSpot.toFixed(2)));
        }
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [bots, activeAccount, dailyLossLimit, takeProfitGoal]);

  // Automated trigger logic using actual backend AI services
  const triggerAIAnalysis = async (bot: any, currentSpotPrice: number) => {
    analyzingRef.current[bot.id] = true;
    updateBotStats(bot.id, { phase: "analyzing" });
    addBotLog(bot.id, `INTELLIGENT HANDSHAPE requested. Querying Gemini cognitive layers for ${bot.symbol}...`);

    try {
      if (bot.contractType === "DIGITDIFF" || bot.contractType === "DIGITMATCH") {
        // Send actual live digit history
        const statsObj = digitFrequency.reduce((acc, current, i) => {
          acc[`freq_${i}`] = current;
          return acc;
        }, {} as Record<string, number>);

        const response = await fetch("/api/ai/analyze-digits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: bot.symbol,
            digits: recentDigits.slice(-50),
            stats: statsObj,
          }),
        });

        const data = await response.json();
        
        let targetDigitVal = bot.config.digitsValue !== undefined ? bot.config.digitsValue : 7;
        if (data.cold_digits && data.cold_digits.length > 0) {
          // Dynamically adapt target digit based on AI recommendations if configured as dynamic
          targetDigitVal = data.cold_digits[0];
        }

        // Calculate Martingale dynamic stake
        const activeStake = bots.find((b) => b.id === bot.id)?.stake || bot.stake;

        addBotLog(bot.id, `GEMINI ANALYSIS: Bias ${data.bias} | Rule: ${data.prediction_rules} | Confidence: ${data.confidence}%`);
        addBotLog(bot.id, `AI DECISION: commentary: ${data.commentary}`);

        if (data.confidence >= 65) {
          executeTrade(bot.id, bot.symbol, bot.contractType, activeStake, currentSpotPrice, targetDigitVal);
        } else {
          updateBotStats(bot.id, { phase: "cooldown" });
          addBotLog(bot.id, `SIGNAL REJECTED: Gemini confidence (${data.confidence}%) below strategic filters (65%).`);
          cooldownRef.current[bot.id] = Date.now() - 4000; // soft cooldown if ignored
        }

      } else {
        // Standard directions (Rise/Fall)
        // Supply recent virtual candle data
        const dummyCandles = candles.length > 0 ? candles : [
          { epoch: Date.now() / 1000 - 40, open: currentSpotPrice - 1, high: currentSpotPrice + 2, low: currentSpotPrice - 2, close: currentSpotPrice },
          { epoch: Date.now() / 1000 - 20, open: currentSpotPrice, high: currentSpotPrice + 1, low: currentSpotPrice - 1, close: currentSpotPrice + 0.5 },
          { epoch: Date.now() / 1000, open: currentSpotPrice + 0.5, high: currentSpotPrice + 1.5, low: currentSpotPrice - 0.5, close: currentSpotPrice + 1.0 },
        ];

        const response = await fetch("/api/ai/analyze-chart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: bot.symbol,
            timeframe: "1m",
            candles: dummyCandles,
            indicators: indicators,
          }),
        });

        const data = await response.json();
        const activeStake = bots.find((b) => b.id === bot.id)?.stake || bot.stake;

        addBotLog(bot.id, `GEMINI ANALYSIS: Trend ${data.trend} | Signal: ${data.entry_signal} | Confidence: ${data.confidence}%`);
        addBotLog(bot.id, `AI DECISION: ${data.commentary}`);

        // Strong entry confirmations
        const isBullishAlign = data.entry_signal === "BUY" && bot.contractType === "CALL";
        const isBearishAlign = data.entry_signal === "SELL" && bot.contractType === "PUT";

        if ((isBullishAlign || isBearishAlign) && data.confidence >= 65) {
          executeTrade(bot.id, bot.symbol, bot.contractType, activeStake, currentSpotPrice);
        } else {
          updateBotStats(bot.id, { phase: "cooldown" });
          addBotLog(bot.id, `SIGNAL STANDBY: Signal (${data.entry_signal}) did not align with contract ${bot.contractType} or failed threshold.`);
          cooldownRef.current[bot.id] = Date.now() - 5000;
        }
      }
    } catch (err: any) {
      console.error("AI automated execution failure:", err);
      updateBotStats(bot.id, { phase: "cooldown" });
      addBotLog(bot.id, `COGNITIVE TIMEOUT: local heuristics engine dispatched standard target.`);
      // Heuristic auto fallback execution if Gemini has network/peak issues
      const activeStake = bots.find((b) => b.id === bot.id)?.stake || bot.stake;
      executeTrade(bot.id, bot.symbol, bot.contractType, activeStake, currentSpotPrice);
    } finally {
      analyzingRef.current[bot.id] = false;
    }
  };

  // Wrapper choosing between actual Live Trading contract proposal/buy or high fidelity simulation
  const executeTrade = (
    botId: string,
    symbol: string,
    contractType: string,
    stake: number,
    entrySpot: number,
    targetDigit?: number
  ) => {
    const { token, activeAccount, connectionStatus } = useTradingStore.getState();
    if (token && activeAccount && connectionStatus === "connected") {
      updateBotStats(botId, { phase: "proposal" });
      addBotLog(botId, `REAL PORTAL DETECTED: Opening actual API proposal contract for ${symbol} @ $${stake}...`);
      derivAPI.send({
        proposal: 1,
        subscribe: 1,
        amount: stake,
        basis: "stake",
        contract_type: contractType,
        currency: activeAccount.currency || "USD",
        duration: 5,
        duration_unit: "t",
        symbol: symbol,
        ...(targetDigit !== undefined && { barrier: targetDigit.toString() }),
        passthrough: {
          bot_id: botId,
          contract_type: contractType,
          duration_ticks: 5,
          target_digit: targetDigit,
          stake: stake,
          symbol: symbol
        }
      });
    } else {
      executeSimulatedTrade(botId, symbol, contractType, stake, entrySpot, targetDigit);
    }
  };

  // Dispatches High-Fidelity simulated/demo trade resolving real-time inside HUD and logs
  const executeSimulatedTrade = (
    botId: string,
    symbol: string,
    contractType: string,
    stake: number,
    entrySpot: number,
    targetDigit?: number
  ) => {
    const contractId = Math.floor(Math.random() * 10000000) + 90000000;
    const duration = 5; // Ticks duration

    // Volatility payout ratios standard
    const payoutFactor = contractType === "DIGITDIFF" ? 1.09 : 1.95;
    const payout = Number((stake * payoutFactor).toFixed(2));

    const newSim: SimTrade = {
      contractId,
      botId,
      symbol,
      contractType,
      stake,
      entrySpot,
      durationTicks: duration,
      ticksElapsed: 0,
      targetDigit,
      payout,
    };

    activeSimTradesRef.current[contractId] = newSim;
    updateBotStats(botId, { phase: "trading" });

    // Standard position model for HUD panels
    const displayPos: ActivePosition = {
      contract_id: contractId,
      symbol: symbol,
      display_name: `${bots.find((b) => b.id === botId)?.name || "Bot"} [Simulated]`,
      contract_type: contractType as any,
      buy_price: stake,
      entry_spot: entrySpot,
      current_spot: entrySpot,
      payout: payout,
      profit: 0,
      date_expiry: Date.now() + 5000,
      status: "open",
    };

    addPosition(displayPos);

    addBotLog(botId, `ORDER DISPATCHED [ID: ${contractId}] | Stake: $${stake} | Entry Spot: ${entrySpot} ${targetDigit !== undefined ? `| Target Digit: ${targetDigit}` : ""}`);
    addLog("info", `Bot ${bots.find((b) => b.id === botId)?.name} dispatched simulated order.`);
    NotificationManager.send(
      "SIMULATED ORDER EXECUTED 🤖",
      `Bot "${bots.find((b) => b.id === botId)?.name || 'Bot'}" placed ${contractType} trade on ${symbol} @ $${stake}`,
      "info"
    );
  };
}
