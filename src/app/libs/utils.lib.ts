export const Utils: { [key: string]: any } = {
  ascSort: (a, b) => {
    if (a.name < b.name) {
      return -1;
    } else {
      return 1;
    }
  }
};
