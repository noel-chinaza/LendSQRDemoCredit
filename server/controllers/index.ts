export function WrapIV2DataWrap(
	data: any,
	error: string | undefined | object,
	status: number = ErrorCodes.SUCCESS
): V2DataWrap {
	return {
		data,
		error: {
			message: error,
			code: status,
		},
	};
}

export interface V2DataWrap {
	data: any;
	error: { code: number; message?: string | object };
}

export var ErrorCodes = {
	SUCCESS: 0,
	ERROR: 1,
};