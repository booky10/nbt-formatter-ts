export default interface Control {
  cut(): void;

  hasCut(): boolean;
}
export const ControlUnbound = {
  cut() {
    // NO-OP
  },
  hasCut(): boolean {
    return false;
  },
} as Control;
