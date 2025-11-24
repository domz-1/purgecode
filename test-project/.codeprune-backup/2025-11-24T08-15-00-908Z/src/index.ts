import "./legacy";
import { usedFunction } from "./utils";
const result = usedFunction(10);

const unusedVar = "I am unused";

export function main() {
  return result;
}
