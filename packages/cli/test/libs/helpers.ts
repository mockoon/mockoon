export const delay = (t: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, t));
