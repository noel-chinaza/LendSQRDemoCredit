import { object, number, string } from "yup";

export const WITHDRAW_VALIDATOR_BODY = object({
	amount: number().positive().required(),
	gateway: string().trim().oneOf(["BANK", "CRYPTO"]).required()
});