let alertInstance: HTMLAudioElement | null = null;

export function soundAlert(audioFilePath: string) {
  alertInstance = new Audio(audioFilePath);
  alertInstance.addEventListener("ended", () => {
    console.log("clearing ref");
    alertInstance = null;
  });
  if (alertInstance) {
    alertInstance.pause();
    alertInstance.currentTime = 0;
  }
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
      console.log("clearing");
      loopInstance=null
      clearInterval(interval);
    }, duration * 1000);
  }
}
