import { object, string, number } from "yup";

export const TRANSFER_MONEY_TO_OTHER_USER_VALIDATOR = object({
	destinationUserTag: string().trim().required(),
	amount: number().positive().required().min(100)
});
