export default class StringBuilder {
  private value: string = "";

  constructor() {
  }

  public append(string: string) {
    this.value += string;
    return this;
  }

  public toString() {
    return this.value;
  }
}
