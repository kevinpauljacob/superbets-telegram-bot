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
  if(muted) alertInstance.muted = muted
  alertInstance.play();
}

let loopInstance: HTMLAudioElement | null = null;
export function loopSound(audioFilePath: string, duration: number) {
  loopInstance = new Audio(audioFilePath);
  if (loopInstance) {
    const interval = setInterval(() => {
      loopInstance && loopInstance.play();
    }, loopInstance.duration * 1000);

    setTimeout(() => {
      loopInstance=null
      clearInterval(interval);
    }, duration * 1000);
  }
}
