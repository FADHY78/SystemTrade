/**
 * Dual Platform Notification Manager:
 * Integrates HTML5 Browser Notification APIs with a fallback Web Audio synthesizer
 * and fallback central logs for cross-origin or sandboxed iframe environments.
 */

export class NotificationManager {
  private static audioCtx: AudioContext | null = null;

  /**
   * Safe getter for Web Audio Context to abide by browser-click gesture constraints.
   */
  private static getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Triggers a clean, high-fidelity synthesizer beep as sensory fallback.
   */
  public static playAudioSynth(type: "success" | "warn" | "error" | "info") {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === "success") {
        // High ascending melodic bleep
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "error" || type === "warn") {
        // Warning dual flat buzz
        osc.type = "triangle";
        osc.frequency.setValueAtTime(329.63, now); // E4
        osc.frequency.setValueAtTime(220.00, now + 0.1); // A3
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else {
        // Soft neutral synth chirp
        osc.type = "sine";
        osc.frequency.setValueAtTime(440.00, now); // A4
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch (e) {
      // Audio fallback bypass silently
      console.warn("Audio Context blocked, awaiting user gesture click interaction.");
    }
  }

  /**
   * Request standard native HTML5 permission for notifications
   */
  public static async requestPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch (err) {
      console.warn("Could not retrieve notification permissions:", err);
      // Fallback request method for older browsers
      return new Promise<boolean>((resolve) => {
        try {
          Notification.requestPermission((p) => {
            resolve(p === "granted");
          });
        } catch {
          resolve(false);
        }
      });
    }
  }

  /**
   * Delivers standard browser Notification OR fallback sound alerts
   */
  public static send(
    title: string,
    body: string,
    type: "success" | "warn" | "error" | "info" = "info"
  ) {
    // 1. Play auditory alert for active terminal HUD experience
    this.playAudioSynth(type);

    // 2. Dispatch native OS notification if allowed and supported
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          new Notification(title, {
            body,
            icon: "/favicon.ico",
            tag: "deriv-jarvis-algo",
          });
          return;
        } catch (e) {
          console.warn("Direct Notification constructor failed inside iframe sandbox context. Bypassing.", e);
        }
      }
    }

    console.log(`[Notification Fallback] ${title}: ${body}`);
  }
}
