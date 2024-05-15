export const timestampParser = (timestamp: string) => {
  const date = new Date(timestamp);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString();
  }
  return date.toLocaleDateString();
};
