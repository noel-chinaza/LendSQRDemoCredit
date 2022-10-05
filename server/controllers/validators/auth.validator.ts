import { object, string } from "yup";

export const REGISTRATION_VALIDATOR_BODY = object({
	name: string().lowercase().trim().required(),
	password: string().trim().required(),
	confirmPassword: string().trim(),
});

export const LOGIN_VALIDATOR_BODY = object({
	name: string().lowercase().trim().required(),
	password: string().trim().required(),
});

