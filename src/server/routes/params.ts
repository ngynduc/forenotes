import { AppError } from "../errors.js";

export function getRequiredParam(value: string | string[] | undefined, name: string) {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  throw new AppError(400, `Missing route param: ${name}`);
}
