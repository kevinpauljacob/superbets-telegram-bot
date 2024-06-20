let alertInstance: HTMLAudioElement | null = null;

export function soundAlert(audioFilePath: string, muted?: boolean) {
  alertInstance = new Audio(audioFilePath);
  alertInstance.addEventListener("ended", () => {
    alertInstance = null;
  });
  if (alertInstance) {
    alertInstance.pause();
    alertInstance.currentTime = 0;
  }
  if (muted) alertInstance.muted = muted;
  alertInstance.play().catch((error) => {
    console.error("Audio playback failed:", error);
  });
}

let loopInstance: HTMLAudioElement | null = null;
export function loopSound(
  audioFilePath: string,
  duration: number,
  muted?: boolean,
) {
  loopInstance = new Audio(audioFilePath);
  if (loopInstance) {
    if (muted) {
      loopInstance.muted = muted;
    }
    const interval = setInterval(() => {
      loopInstance &&
        loopInstance.play().catch((error) => {
          console.error("Audio playback failed:", error);
        });
    }, loopInstance.duration * 1000);

    setTimeout(() => {
      loopInstance = null;
      clearInterval(interval);
    }, duration * 1000);
  }
}
