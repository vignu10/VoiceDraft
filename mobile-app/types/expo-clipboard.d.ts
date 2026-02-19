declare module 'expo-clipboard' {
  export function getStringAsync(): Promise<string>;
  export function setStringAsync(text: string): Promise<void>;
  export const getString: (callback: (content: string) => void) => void;
  export const setString: (text: string) => void;
}
