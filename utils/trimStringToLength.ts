//function trims the string to desired length adds .... and last 3 characters
export default function trimStringToLength(str: string, desiredLength: number): string {
  return (
    str.substring(0, desiredLength) +
    "...." +
    str.substring(str.length - 3, str.length)
  );
}
