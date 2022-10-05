import { object, number, string } from "yup";

export const DEPOSIT_VALIDATOR_BODY = object({
	transactionReference: string().trim().required(),
	amount: number().positive().required(),
});

export const INITIATE_PAYMENT_VALIDATOR_BODY = object({
	gateway: string().trim().oneOf(["PAYSTACK", "FLUTTERWAVE"]).required(),
	amount: number().positive().required().min(100)
});
