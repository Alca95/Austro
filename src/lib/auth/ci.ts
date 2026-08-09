import "server-only";

import { createHmac } from "node:crypto";

const CI_PATTERN = /^\d{4,10}$/;
const HMAC_SECRET_PATTERN = /^[a-f0-9]{64}$/i;

export type CiIdentity = {
  normalizedCi: string;
  ciHmac: string;
  ciLast4: string;
};

export function normalizeCi(value: string): string {
  const normalizedCi = value.replace(/\D/g, "");

  if (!CI_PATTERN.test(normalizedCi)) {
    throw new Error("INVALID_CI");
  }

  return normalizedCi;
}

export function createCiIdentity(value: string): CiIdentity {
  const normalizedCi = normalizeCi(value);
  const secret = process.env.AUSTRO_CI_HMAC_SECRET;

  if (!secret || !HMAC_SECRET_PATTERN.test(secret)) {
    throw new Error("INVALID_CI_HMAC_CONFIGURATION");
  }

  const ciHmac = createHmac(
    "sha256",
    Buffer.from(secret, "hex"),
  )
    .update(normalizedCi, "utf8")
    .digest("hex");

  return {
    normalizedCi,
    ciHmac,
    ciLast4: normalizedCi.slice(-4),
  };
}