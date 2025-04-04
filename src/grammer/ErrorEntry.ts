export default class ErrorEntry<S> {
  private readonly cursor: number;
  private readonly reason: any;

  constructor(cursor: number, reason: any) {
    this.cursor = cursor;
    this.reason = reason;
  }

  public getCursor() {
    return this.cursor;
  }

  public getReason() {
    return this.reason;
  }
}
