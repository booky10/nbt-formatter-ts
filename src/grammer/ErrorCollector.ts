export default interface ErrorCollector<S> {
    store(cursor: number, reason: any): void;

    finish(cursor: number): void;
}
// TODO
