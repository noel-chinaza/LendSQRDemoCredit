import { object, number, boolean, string } from "yup";

export const REGISTRATION_VALIDATOR_BODY = object({
	name: string().lowercase().trim().required(),
	password: string().trim().required(),
	confirmPassword: string().trim().required(),
});

export const LOGIN_VALIDATOR_BODY = object({
	name: string().lowercase().trim().required(),
	password: string().trim().required(),
});

