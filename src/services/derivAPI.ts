import { useTradingStore } from "../stores/tradingStore";
import { AccountInfo } from "../types/deriv.types";
import { NotificationManager } from "../utils/notifier";

class DerivAPIService {
  private socket: WebSocket | null = null;
  private reconnectTimeout: any = null;
  private messageQueue: string[] = [];
  private currentAppId: string = "86454";
  private currentToken: string = "";
  private onMessageCallbacks: Set<(data: any) => void> = new Set();
  private lastSubscribedSymbol: string = "";
  private lastSubscribedTimeframe: string = "";

  constructor() {
    // Read initial values from store if available (Zustand store can be loaded on runtime)
  }

  public connect(appId: string, token?: string) {
    const targetToken = token !== undefined ? token : this.currentToken;

    // Guard against multiple connection attempts of the exact same parameters
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) &&
      this.currentAppId === appId &&
      this.currentToken === targetToken
    ) {
      // Re-evaluate market subscription if the connection is already active and healthy
      if (this.socket.readyState === WebSocket.OPEN) {
        const store = useTradingStore.getState();
        const symbol = store.selectedSymbol?.symbol || "R_100";
        const tf = store.timeframe || "1m";
        if (this.lastSubscribedSymbol !== symbol || this.lastSubscribedTimeframe !== tf) {
          this.subscribeToMarket();
        }
      }
      return;
    }

    this.currentAppId = appId;
    this.currentToken = targetToken;

    this.cleanup();

    const store = useTradingStore.getState();
    store.setConnectionStatus("connecting");
    store.addLog("info", `Deriv Connection requested (App ID: ${appId})...`);

    const url = `wss://ws.binaryws.com/websockets/v3?app_id=${appId}`;
    try {
      this.socket = new WebSocket(url);
    } catch (e: any) {
      console.error("Failed to construct WebSocket:", e);
      store.setConnectionStatus("disconnected");
      store.addLog("error", `Socket initialization error: ${e.message || e}`);
      return;
    }

    this.socket.onopen = () => {
      const liveStore = useTradingStore.getState();
      liveStore.setConnectionStatus("connected");
      liveStore.addLog("success", "Centralized Deriv Connection Established.");

      // Flush any queued messages
      while (this.messageQueue.length > 0) {
        const msg = this.messageQueue.shift();
        if (msg) this.sendRaw(msg);
      }

      // Fetch brief overview of active symbols
      this.send({ active_symbols: "brief", product_type: "basic" });

      // Authenticate if we have a token
      if (this.currentToken) {
        liveStore.addLog("info", "Authenticating via credentials token...");
        this.send({ authorize: this.currentToken });
      } else {
        liveStore.addLog("warning", "Connected in Guest Mode. Add a Deriv Token in Settings to authorize trading.");
      }

      // Re-trigger actual subscription for currently selected market
      this.subscribeToMarket();
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Propagate to all standard subscribers (e.g., hooks, custom handlers)
        this.onMessageCallbacks.forEach((cb) => cb(data));

        // Let the central store process the standard outputs
        this.handleStandardMessage(data);
      } catch (err) {
        console.error("Error processing central message stream:", err);
      }
    };

    this.socket.onclose = () => {
      const liveStore = useTradingStore.getState();
      liveStore.setConnectionStatus("disconnected");
      liveStore.addLog("warning", "Deriv Connection disconnected. Reconnecting in 5s...");
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect(this.currentAppId, this.currentToken);
      }, 5000);
    };

    this.socket.onerror = (err) => {
      console.error("Central Deriv WS Error:", err);
      const liveStore = useTradingStore.getState();
      liveStore.setConnectionStatus("disconnected");
    };
  }

  public send(msg: any) {
    const raw = JSON.stringify(msg);
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.sendRaw(raw);
    } else {
      // Queue until socket ready
      this.messageQueue.push(raw);
    }
  }

  private sendRaw(rawMsg: string) {
    if (this.socket) {
      this.socket.send(rawMsg);
    }
  }

  public addMessageListener(cb: (data: any) => void) {
    this.onMessageCallbacks.add(cb);
    return () => this.onMessageCallbacks.delete(cb);
  }

  public disconnect() {
    this.cleanup();
    const store = useTradingStore.getState();
    store.setConnectionStatus("disconnected");
    store.addLog("info", "Centralized Deriv WS Session Closed.");
  }

  private cleanup() {
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private subscribeToMarket() {
    const store = useTradingStore.getState();
    const symbol = store.selectedSymbol?.symbol || "R_100";
    const tf = store.timeframe || "1m";

    // Track the last parameters subscribed to
    this.lastSubscribedSymbol = symbol;
    this.lastSubscribedTimeframe = tf;

    // Forget previous subscriptions by re-opening stream or letting deriv reuse
    let granularity = 60;
    switch (tf) {
      case "1T": granularity = 0; break;
      case "1m": granularity = 60; break;
      case "2m": granularity = 120; break;
      case "3m": granularity = 180; break;
      case "5m": granularity = 300; break;
      case "10m": granularity = 600; break;
      case "15m": granularity = 900; break;
      case "30m": granularity = 1800; break;
      case "1H": granularity = 3600; break;
      case "2H": granularity = 7200; break;
      case "4H": granularity = 14400; break;
      case "8H": granularity = 28800; break;
      case "1d": granularity = 86400; break;
      case "1w": granularity = 604800; break;
    }

    // Forget all pre-existing tick / candle streams
    this.send({ forget_all: ["ticks", "candles"] });

    if (granularity === 0) {
      this.send({
        ticks_history: symbol,
        count: 500,
        end: "latest",
        style: "ticks",
        subscribe: 1,
      });
    } else {
      this.send({
        ticks_history: symbol,
        count: 200,
        end: "latest",
        style: "candles",
        granularity,
        subscribe: 1,
      });
    }
  }

  private handleStandardMessage(data: any) {
    const store = useTradingStore.getState();
    const msgType = data.msg_type;

    if (data.error) {
      store.addLog("error", `API Response Err [${data.error.code}]: ${data.error.message}`);
      if (msgType === "authorize" || data.error.code === "InputValidationFailed") {
        store.setActiveAccount(null);
      }
      return;
    }

    switch (msgType) {
      case "authorize": {
        const auth = data.authorize;
        store.addLog("success", `Authenticated as: ${auth.fullname} (${auth.loginid}) - ${auth.currency || "USD"}`);

        // Pull and map ALL accounts in the list
        if (auth.account_list && Array.isArray(auth.account_list)) {
          const accounts: AccountInfo[] = auth.account_list.map((acc: any) => ({
            loginid: acc.loginid,
            // Only fill current balance, for others use 0 indicating "awaiting selection"
            balance: acc.loginid === auth.loginid ? (auth.balance || 0) : 0,
            currency: acc.currency || "USD",
            email: auth.email || "",
            is_virtual: Boolean(acc.is_virtual),
            token: this.currentToken,
            app_id: this.currentAppId,
          }));

          // Set all pulled accounts in Zustand state
          useTradingStore.setState({ accounts });
          store.addLog("info", `Retrieved ${accounts.length} sub-accounts tied to session authentication.`);
        }

        const activeAccInfo: AccountInfo = {
          loginid: auth.loginid,
          balance: auth.balance || 0,
          currency: auth.currency || "USD",
          email: auth.email || "",
          is_virtual: Boolean(auth.is_virtual),
          token: this.currentToken,
          app_id: this.currentAppId,
        };

        store.setActiveAccount(activeAccInfo);

        // Subscriptions
        this.send({ balance: 1, subscribe: 1 });
        this.send({ proposal_open_contract: 1, subscribe: 1 });
        break;
      }

      case "balance": {
        const bal = data.balance;
        if (bal) {
          useTradingStore.setState((state) => {
            // Update active account balance
            const nextActive = state.activeAccount 
              ? { ...state.activeAccount, balance: bal.balance } 
              : null;
            
            // Sync inside accounts list too
            const nextAccounts = state.accounts.map(acc => 
              acc.loginid === bal.loginid ? { ...acc, balance: bal.balance } : acc
            );

            return { 
              activeAccount: nextActive,
              accounts: nextAccounts
            };
          });
        }
        break;
      }

      case "active_symbols": {
        const active = data.active_symbols;
        if (active && Array.isArray(active)) {
          const mapped = active.map((s: any) => ({
            symbol: s.symbol,
            display_name: s.display_name,
            market: s.market,
            market_display_name: s.market_display_name,
            submarket: s.submarket,
            submarket_display_name: s.submarket_display_name,
          }));
          store.setSymbols(mapped);
          store.addLog("info", `Loaded ${mapped.length} available trading pairs/synthetics.`);
        }
        break;
      }

      case "tick": {
        const tick = data.tick;
        if (!tick) return;
        const newTick = {
          epoch: tick.epoch,
          quote: tick.quote,
          pip_size: tick.pip_size,
        };

        // Extract tick last digit for statistical bias analysis
        const decimals = tick.pip_size || 4;
        const quoteStr = tick.quote.toFixed(decimals);
        const lastDigitChar = quoteStr.charAt(quoteStr.length - 1);
        const digit = parseInt(lastDigitChar, 10);
        if (!isNaN(digit)) {
          store.addRecentDigit(digit);
        }

        useTradingStore.setState((state) => ({
          ticks: [...state.ticks, newTick].slice(-250),
        }));
        break;
      }

      case "candles": {
        const cList = data.candles;
        if (cList && Array.isArray(cList)) {
          const formatted = cList.map((c: any) => ({
            epoch: c.epoch,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }));
          store.setCandles(formatted);
        }
        break;
      }

      case "ohlc": {
        const ohlc = data.ohlc;
        if (!ohlc) return;
        const candleUpdate = {
          epoch: ohlc.epoch,
          open: parseFloat(ohlc.open),
          high: parseFloat(ohlc.high),
          low: parseFloat(ohlc.low),
          close: parseFloat(ohlc.close),
        };

        useTradingStore.setState((state) => {
          const candles = [...state.candles];
          const idx = candles.findIndex((c) => c.epoch === candleUpdate.epoch);
          if (idx >= 0) {
            candles[idx] = candleUpdate;
          } else {
            candles.push(candleUpdate);
          }
          return { candles: candles.slice(-250) };
        });
        break;
      }

      case "proposal": {
        const prop = data.proposal;
        if (prop) {
          store.setProposalPrice(prop);
        }
        break;
      }

      case "proposal_open_contract": {
        const poc = data.proposal_open_contract;
        if (!poc) return;

        const mapped: any = {
          contract_id: poc.contract_id,
          symbol: poc.underlying,
          display_name: poc.display_name,
          contract_type: poc.contract_type,
          buy_price: parseFloat(poc.buy_price || "0"),
          entry_spot: parseFloat(poc.entry_spot || "0"),
          current_spot: parseFloat(poc.current_spot || "0"),
          payout: parseFloat(poc.payout || "0"),
          profit: parseFloat(poc.profit || "0"),
          date_expiry: poc.date_expiry,
          status: poc.is_expired ? (poc.profit > 0 ? "won" : "lost") : "open",
        };

        if (poc.is_expired) {
          store.closePosition(poc.contract_id, parseFloat(poc.profit || "0"));
          store.addLog(
            poc.profit > 0 ? "success" : "error",
            `Option ${mapped.contract_id} closed expired. P/L: $${poc.profit}`
          );
          NotificationManager.send(
            poc.profit > 0 ? "MANUAL TRADE WON 📈" : "MANUAL TRADE LOST 📉",
            `Standard manual trade ID ${mapped.contract_id} closed ${poc.profit > 0 ? 'WON' : 'LOST'}. Return: $${poc.profit >= 0 ? "+" : ""}${poc.profit}`,
            poc.profit > 0 ? "success" : "error"
          );
        } else {
          const exists = store.openPositions.find((p) => p.contract_id === mapped.contract_id);
          if (exists) {
            store.updatePosition(mapped);
          } else {
            store.addPosition(mapped);
            store.addLog("info", `Created Active Contract: ${mapped.display_name} [${mapped.contract_type}]`);
          }
        }
        break;
      }

      case "buy": {
        const buy = data.buy;
        if (buy) {
          store.addLog("success", `Execution Success! Buy ID: ${buy.contract_id}, Paid: $${buy.buy_price}`);
          NotificationManager.send(
            "MANUAL ORDER CONFIRMED 👍",
            `Manual order ID ${buy.contract_id} successfully processed for $${buy.buy_price}`,
            "success"
          );
        }
        break;
      }
    }
  }
}

export const derivAPI = new DerivAPIService();
